import { buildIndex } from './search';
import { ControlRecord } from './types';

const records: ControlRecord[] = [
  { id: 'A', title: 'Access Control', groupPath: ['Group'], fullText: 'Login policies', control: {} },
  { id: 'B', title: 'Backup Policy', groupPath: ['Ops'], fullText: 'Nightly backups', control: {} }
];

describe('buildIndex', () => {
  it('returns hits for keywords and supports group filter', () => {
    const { query } = buildIndex(records);
    const results = query('backup');
    expect(results.map((r) => r.id)).toEqual(['B']);
    const filtered = query('policy', { group: 'Group' });
    expect(filtered.map((r) => r.id)).toEqual(['A']);
  });
});
