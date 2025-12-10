import MiniSearch, { SearchResult } from 'minisearch';
import { ControlRecord } from './types';

type IndexedRecord = Omit<ControlRecord, 'groupPath'> & { groupPath: string };

export interface SearchIndexResult {
  index: MiniSearch<IndexedRecord>;
  query: (text: string, filters?: { group?: string }) => SearchResult[];
}

const normalizeGroupPath = (gp: ControlRecord['groupPath']): string => {
  if (Array.isArray(gp)) {
    return gp.map((x) => String(x)).join(' / ');
  }
  return String(gp ?? '');
};

const getResultId = (r: SearchResult): string => {
  return String((r as unknown as { id: string }).id);
};

export const buildIndex = (records: ControlRecord[]): SearchIndexResult => {
  const normalized: IndexedRecord[] = records.map((r) => ({
    ...r,
    groupPath: normalizeGroupPath(r.groupPath)
  }));

  const groupPathById = new Map<string, string>(
    normalized.map((r) => [String(r.id), String(r.groupPath ?? '')])
  );

  const index = new MiniSearch<IndexedRecord>({
    idField: 'id',
    fields: ['title', 'fullText', 'groupPath'],
    storeFields: ['id', 'title', 'groupPath', 'fullText']
  });

  index.addAll(normalized);

  const query = (text: string, filters?: { group?: string }) => {
    const results = index.search(text || '*', {
      prefix: true,
      fuzzy: 0.2,
      combineWith: 'AND'
    });

    if (!filters?.group) return results;

    const needle = String(filters.group).toLowerCase();
    return results.filter((r) =>
      String(groupPathById.get(getResultId(r)) ?? '')
        .toLowerCase()
        .includes(needle)
    );
  };

  return { index, query };
};

