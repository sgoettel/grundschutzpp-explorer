import { diffCatalogs } from './diff';
import { ControlRecord } from './types';

const before: ControlRecord[] = [
  { id: '1', title: 'Old', groupPath: ['A'], fullText: 'Old text', control: {} },
  { id: '2', title: 'Stay', groupPath: ['B'], fullText: 'Same', control: {} }
];

const after: ControlRecord[] = [
  { id: '1', title: 'New', groupPath: ['A'], fullText: 'Old text', control: {} },
  { id: '3', title: 'Added', groupPath: ['C'], fullText: 'New control', control: {} },
  { id: '2', title: 'Stay', groupPath: ['B'], fullText: 'Same', control: {} }
];

describe('diffCatalogs', () => {
  it('detects added, removed, and changed controls', () => {
    const diff = diffCatalogs(before, after);
    const statuses = Object.fromEntries(diff.map((d) => [d.id, d.status]));
    expect(statuses).toEqual({ '1': 'changed', '2': 'unchanged', '3': 'added' });
    const change = diff.find((d) => d.id === '1');
    expect(change?.changedFields).toContain('title');
  });
});
