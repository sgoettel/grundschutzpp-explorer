import MiniSearch, { SearchResult } from 'minisearch';
import { ControlRecord } from './types';

export interface SearchIndexResult {
  index: MiniSearch<ControlRecord>;
  query: (text: string, filters?: { group?: string }) => SearchResult[];
}

export const buildIndex = (records: ControlRecord[]): SearchIndexResult => {
  const index = new MiniSearch<ControlRecord>({
    fields: ['title', 'fullText', 'groupPath'],
    storeFields: ['id', 'title', 'groupPath', 'fullText'],
  });

  index.addAll(records);

  const query = (text: string, filters?: { group?: string }): SearchResult[] => {
  const q = text.trim();
    const hasGroup = Boolean(filters?.group);
    const queryValue = q ? q : hasGroup ? MiniSearch.wildcard : '';

    // Kein Query, keine Gruppe → nichts anzeigen (wie bisher)
    if (!queryValue) return [];
    const results = index.search(queryValue, {
       prefix: true,
       fuzzy: 0.2,
       combineWith: 'AND',
       filter: filters?.group
         ? (res) => (res.groupPath as string[]).includes(filters.group as string)
         : undefined,
     });

     return results;
   };

   return { index, query };
 };
