import fixture from '../__fixtures__/catalog.json';
import projectionFixture from '../__fixtures__/catalog-projection.json';
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

  it('preserves source objects and projects Control and nested Part props with their origin', () => {
    const result = parseCatalog(projectionFixture);
    const sourceControl =
      projectionFixture.catalog.groups[0].groups[0].controls[0];
    const record = result.controls.find((control) => control.id === 'APP.1');

    expect(result.source).toBe(projectionFixture);
    expect(record?.control).toBe(sourceControl);
    expect(record?.metadata.known.map((prop) => prop.name)).toEqual([
      'sec_level',
      'modal_verb'
    ]);
    expect(record?.metadata.unknown.map((prop) => prop.name)).toEqual([
      'future_control_prop',
      'future_part_prop'
    ]);
    expect(record?.metadata.known[0]).toMatchObject({
      namespace: 'https://bsi.bund.de/ns/grundschutz-plusplus',
      sourceLevel: 'control',
      sourcePath: 'Control → Prop'
    });
    expect(record?.metadata.known[0].raw).toBe(sourceControl.props[0]);
    expect(record?.metadata.known[1]).toMatchObject({
      sourceLevel: 'part',
      sourcePath: 'Control → statement-Part → Prop'
    });
    expect(record?.metadata.unknown[1]).toMatchObject({
      sourceLevel: 'part',
      sourcePath: 'Control → statement-Part → item-Part → Prop'
    });
    expect(record?.control.class).toBe('normal-SdT');
  });
});
