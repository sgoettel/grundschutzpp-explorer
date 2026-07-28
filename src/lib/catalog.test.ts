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

  it('projects resolved nested prose and known metadata into searchable text', () => {
    const result = parseCatalog({
      catalog: {
        controls: [
          {
            id: 'SEARCH.1',
            title: 'Suchprojektion',
            params: [
              {
                id: 'p-frist',
                label: 'festgelegte Frist',
                values: ['30 Tage']
              }
            ],
            props: [{ name: 'sec_level', value: 'Basis' }],
            parts: [
              {
                name: 'statement',
                prose: 'Die Frist beträgt {{ insert: param, p-frist }}.',
                props: [{ name: 'modal_verb', value: 'MUSS' }],
                parts: [
                  {
                    name: 'item',
                    title: 'Vertiefung',
                    prose: 'Verschachtelte Pflicht'
                  }
                ]
              }
            ]
          }
        ]
      }
    });

    const fullText = result.controls[0]?.fullText ?? '';

    expect(fullText).toContain('Die Frist beträgt 30 Tage.');
    expect(fullText).not.toContain('{{ insert: param, p-frist }}');
    expect(fullText).toContain('Vertiefung');
    expect(fullText).toContain('Verschachtelte Pflicht');
    expect(fullText).toContain('Basis');
    expect(fullText).toContain('MUSS');
    expect(fullText).not.toContain('modal_verb');
  });

  it('projects practices and topics with descriptions and control references', () => {
    const source = {
      catalog: {
        groups: [
          {
            id: 'practice-organisation',
            title: 'Organisation',
            parts: [
              {
                name: 'overview',
                prose: 'Organisation wirksam gestalten.'
              }
            ],
            groups: [
              {
                id: 'topic-regelungen',
                title: 'Regelungen',
                parts: [
                  {
                    name: 'overview',
                    prose: 'Verbindliche Regelungen schaffen.'
                  }
                ],
                controls: [
                  {
                    id: 'ORG.1',
                    title: 'Regelungen festlegen',
                    controls: [
                      {
                        id: 'ORG.1.1',
                        title: 'Regelungen prüfen'
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    };

    const result = parseCatalog(source);

    expect(result.practices).toHaveLength(1);
    const practice = result.practices?.[0];
    const topic = practice?.topics[0];
    expect(practice).toMatchObject({
      id: 'practice-organisation',
      title: 'Organisation',
      description: 'Organisation wirksam gestalten.',
      directControlIds: []
    });
    expect(practice?.raw).toBe(source.catalog.groups[0]);
    expect(topic).toMatchObject({
      id: 'topic-regelungen',
      title: 'Regelungen',
      description: 'Verbindliche Regelungen schaffen.',
      controlIds: ['ORG.1', 'ORG.1.1']
    });
    expect(topic?.raw).toBe(source.catalog.groups[0].groups[0]);
  });
});
