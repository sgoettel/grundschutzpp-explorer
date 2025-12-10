import { describe, expect, it } from 'vitest';
import type { SearchResult } from 'minisearch';
import { buildIndex } from './search';
import type { ControlRecord } from './types';

const ids = (results: SearchResult[]): string[] => {
  return results
    .map((r) => String((r as unknown as { id: string }).id))
    .sort();
};

describe('buildIndex', () => {
  it('returns hits for keywords and supports group filter', () => {
    const records: ControlRecord[] = [
      {
        id: 'A',
        title: 'Group Policy A',
        fullText: 'policy for group A',
        groupPath: ['Group']
      },
      {
        id: 'B',
        title: 'Other Policy B',
        fullText: 'policy for other group',
        groupPath: ['Other']
      }
    ];

    const { query } = buildIndex(records);

    expect(ids(query('policy'))).toEqual(['A', 'B']);
    expect(ids(query('policy', { group: 'Group' }))).toEqual(['A']);
  });
});

