import MiniSearch from 'minisearch';
import type { SearchResult } from 'minisearch';
import { metadataLabel } from './metadata';
import { resolveParameterInserts } from './parameters';
import type { CatalogPart, CatalogParam, ControlRecord } from './types';

export type SearchField =
  | 'id'
  | 'title'
  | 'path'
  | 'requirement'
  | 'guidance'
  | 'metadata';

export interface SearchHit extends ControlRecord {
  score: number;
  primaryField: SearchField;
  matchedFields: SearchField[];
  snippet: string;
}

interface SearchDocument {
  id: string;
  title: string;
  path: string;
  groupPath: string[];
  requirement: string;
  guidance: string;
  metadata: string;
}

interface FachlichText {
  requirement: string[];
  guidance: string[];
}

export interface SearchIndexResult {
  index: MiniSearch<SearchDocument>;
  query: (text: string, filters?: { group?: string }) => SearchHit[];
}

const SEARCH_FIELD_PRIORITY: SearchField[] = [
  'id',
  'title',
  'requirement',
  'path',
  'guidance',
  'metadata'
];

const SEARCH_FIELD_BOOST: Record<SearchField, number> = {
  id: 10,
  title: 9,
  requirement: 6,
  path: 5,
  guidance: 4,
  metadata: 3
};

const collectFachlichText = (
  parts: CatalogPart[] | undefined,
  params: CatalogParam[] | undefined,
  target: FachlichText,
  inheritedKind?: keyof FachlichText
): void => {
  parts?.forEach((part) => {
    const kind =
      part.name === 'statement'
        ? 'requirement'
        : part.name === 'guidance'
          ? 'guidance'
          : inheritedKind;

    if (kind) {
      if (part.title) {
        target[kind].push(part.title);
      }
      const prose = resolveParameterInserts(part.prose, params).plainText;
      if (prose) {
        target[kind].push(prose);
      }
    }

    collectFachlichText(part.parts, params, target, kind);
  });
};

const createSearchDocument = (record: ControlRecord): SearchDocument => {
  const fachlichText: FachlichText = { requirement: [], guidance: [] };
  collectFachlichText(
    record.control.parts,
    record.control.params,
    fachlichText
  );

  return {
    id: record.id,
    title: record.title,
    path: record.groupPath.join(' › '),
    groupPath: record.groupPath,
    requirement: fachlichText.requirement.join(' '),
    guidance: fachlichText.guidance.join(' '),
    metadata: record.metadata.known
      .map((prop) =>
        prop.value
          ? `${metadataLabel(prop.name)} ${prop.value}`
          : metadataLabel(prop.name)
      )
      .join(' ')
  };
};

const matchedSearchFields = (result: SearchResult): SearchField[] => {
  const matched = new Set(Object.values(result.match).flat());
  return SEARCH_FIELD_PRIORITY.filter((field) => matched.has(field));
};

const normalizeSnippet = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();

const createSnippet = (
  value: string,
  matchedTerms: string[],
  maxLength = 160
): string => {
  const normalized = normalizeSnippet(value);
  if (normalized.length <= maxLength) {
    return normalized;
  }

  const lower = normalized.toLocaleLowerCase('de');
  const matchIndex = matchedTerms.reduce((earliest, term) => {
    const index = lower.indexOf(term.toLocaleLowerCase('de'));
    if (index < 0) return earliest;
    return earliest < 0 ? index : Math.min(earliest, index);
  }, -1);
  const approximateStart = Math.max(0, matchIndex - Math.floor(maxLength / 3));
  const startSpace = normalized.lastIndexOf(' ', approximateStart);
  const start = approximateStart > 0 && startSpace >= 0 ? startSpace + 1 : 0;
  const rawEnd = Math.min(normalized.length, start + maxLength);
  const endSpace = normalized.lastIndexOf(' ', rawEnd);
  const end = rawEnd < normalized.length && endSpace > start
    ? endSpace
    : rawEnd;

  return `${start > 0 ? '…' : ''}${normalized.slice(start, end)}${
    end < normalized.length ? '…' : ''
  }`;
};

export const buildIndex = (records: ControlRecord[]): SearchIndexResult => {
  const documents = records.map(createSearchDocument);
  const recordsById = new Map(records.map((record) => [record.id, record]));
  const documentsById = new Map(
    documents.map((document) => [document.id, document])
  );
  const index = new MiniSearch<SearchDocument>({
    fields: SEARCH_FIELD_PRIORITY,
    storeFields: ['id', 'groupPath']
  });

  index.addAll(documents);

  const query = (
    text: string,
    filters?: { group?: string }
  ): SearchHit[] => {
    const normalizedQuery = text.trim();
    const hasGroup = Boolean(filters?.group);
    const queryValue = normalizedQuery
      ? normalizedQuery
      : hasGroup
        ? MiniSearch.wildcard
        : '';

    if (!queryValue) return [];

    return index
      .search(queryValue, {
        prefix: true,
        fuzzy: 0.2,
        combineWith: 'AND',
        boost: SEARCH_FIELD_BOOST,
        filter: filters?.group
          ? (result) =>
              (result.groupPath as string[]).includes(filters.group as string)
          : undefined
      })
      .flatMap((result) => {
        const record = recordsById.get(String(result.id));
        const document = documentsById.get(String(result.id));
        if (!record || !document) return [];

        const matchedFields = matchedSearchFields(result);
        const primaryField = matchedFields[0] ?? 'path';

        return [
          {
            ...record,
            score: result.score,
            primaryField,
            matchedFields,
            snippet: createSnippet(
              String(document[primaryField]),
              result.terms
            )
          }
        ];
      });
  };

  return { index, query };
};
