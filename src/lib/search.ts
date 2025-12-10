import MiniSearch, { SearchResult } from 'minisearch';
import { ControlRecord } from './types';

export interface SearchIndexResult {
  index: MiniSearch<ControlRecord>;
  query: (text: string, filters?: { group?: string }) => SearchResult[];
}

export const buildIndex = (records: ControlRecord[]): SearchIndexResult => {
  const index = new MiniSearch<ControlRecord>({
    fields: ['title', 'fullText', 'groupPath'],
    storeFields: ['id', 'title', 'groupPath', 'fullText']
  });
  index.addAll(records);
  const query = (text: string, filters?: { group?: string }) => {
    const results = index.search(text || '*', { prefix: true, fuzzy: 0.2, combineWith: 'AND' });
    const filtered = filters?.group
      ? results.filter((r) => (r.groupPath as string[]).includes(filters.group as string))
      : results;
    return filtered;
  };
  return { index, query };
};
