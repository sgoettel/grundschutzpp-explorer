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

    // Sonderfall: kein Suchstring, aber Gruppe gesetzt → alle Controls dieser Gruppe
    if (!q && filters?.group) {
      const filtered = records.filter((r) => r.groupPath.includes(filters.group as string));
      // App nutzt nur .id → minimaler „Fake“-SearchResult reicht
      return filtered.map(
        (r) =>
          ({
            id: r.id,
          } as SearchResult),
      );
    }

    // Kein Query, keine Gruppe → nichts anzeigen
    if (!q) {
      return [];
    }

    // Normale Suche
    const results = index.search(q, {
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

