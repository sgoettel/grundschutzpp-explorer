import fixture from '../__fixtures__/catalog.json';
import { parseCatalog } from './catalog';

describe('parseCatalog', () => {
  it('flattens catalog structure with nested groups and controls', () => {
    const result = parseCatalog(fixture);
    expect(result.warnings).toEqual([]);
    const ids = result.controls.map((c) => c.id);
    expect(ids).toEqual(['CTRL-ROOT', 'CTRL-1', 'CTRL-1.1', 'CTRL-2']);
    const nested = result.controls.find((c) => c.id === 'CTRL-1.1');
    expect(nested?.groupPath).toEqual(['Group One', 'Control One']);
    expect(nested?.fullText).toContain('Nested text');
  });

  it('handles invalid catalog gracefully', () => {
    const result = parseCatalog({});
    expect(result.controls).toEqual([]);
    expect(result.warnings[0]).toContain('Missing "catalog"');
  });
});
