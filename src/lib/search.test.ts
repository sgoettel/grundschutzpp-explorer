import { buildIndex } from './search';
import type { ControlRecord } from './types';

const records: ControlRecord[] = [
  {
    id: 'GS-EXAKT',
    title: 'Verschlüsselung verwalten',
    fullText:
      'Verschlüsselung verwalten Nachweis dokumentieren Nachweis prüfen Hoch',
    groupPath: ['Organisation', 'Kryptografie'],
    control: {
      parts: [
        {
          name: 'statement',
          prose: 'Nachweis zur Verschlüsselung dokumentieren.'
        },
        {
          name: 'guidance',
          prose: 'Nachweis regelmäßig prüfen.'
        }
      ]
    },
    metadata: {
      known: [
        {
          name: 'sec_level',
          value: 'Hoch',
          sourceLevel: 'control',
          sourcePath: 'Control → Prop',
          raw: { name: 'sec_level', value: 'Hoch' }
        },
        {
          name: 'target_object_categories',
          value: 'Daten',
          sourceLevel: 'part',
          sourcePath: 'Control → statement-Part → Prop',
          raw: { name: 'target_object_categories', value: 'Daten' }
        },
        {
          name: 'threats',
          value: 'G 0.18',
          sourceLevel: 'control',
          sourcePath: 'Control → Prop',
          raw: { name: 'threats', value: 'G 0.18' }
        }
      ],
      unknown: []
    }
  },
  {
    id: 'GS-ANDERS',
    title: 'Schlüssel verwalten',
    fullText: 'Schlüssel verwalten Verschlüsselung sicher umsetzen',
    groupPath: ['Technik', 'Kryptografie'],
    control: {
      parts: [
        {
          name: 'guidance',
          prose: 'Verschlüsselung mit sicheren Verfahren umsetzen.'
        }
      ]
    },
    metadata: { known: [], unknown: [] }
  }
];

describe('buildIndex', () => {
  it('returns records and supports the existing group filter', () => {
    const { query } = buildIndex(records);

    expect(query('Schlüssel').map((hit) => hit.id)).toEqual([
      'GS-ANDERS'
    ]);
    expect(
      query('Verschlüsselung', { group: 'Organisation' }).map(
        (hit) => hit.id
      )
    ).toEqual(['GS-EXAKT']);
  });

  it('weights fields and explains one deduplicated hit with a snippet', () => {
    const { query } = buildIndex(records);

    const weighted = query('Verschlüsselung');
    expect(weighted.map((hit) => hit.id)).toEqual([
      'GS-EXAKT',
      'GS-ANDERS'
    ]);
    expect(weighted[0]).toMatchObject({
      primaryField: 'title',
      matchedFields: ['title', 'requirement']
    });
    expect(weighted[1]).toMatchObject({
      primaryField: 'guidance',
      matchedFields: ['guidance']
    });

    const combined = query('Nachweis');
    expect(combined).toHaveLength(1);
    expect(combined[0]).toMatchObject({
      primaryField: 'requirement',
      matchedFields: ['requirement', 'guidance'],
      snippet: 'Nachweis zur Verschlüsselung dokumentieren.'
    });

    expect(query('Hoch')[0]?.primaryField).toBe('metadata');
    expect(query('Hoch')[0]?.snippet).toContain('Hoch');
    expect(query('Gefährdungen')[0]).toMatchObject({
      id: 'GS-EXAKT',
      primaryField: 'metadata'
    });
    expect(query('Gefährdungen')[0]?.snippet).toContain('Gefährdungen');
    expect(query('Daten')[0]).toMatchObject({
      id: 'GS-EXAKT',
      primaryField: 'metadata'
    });
    expect(query('GS-EXAKT')[0]).toMatchObject({
      primaryField: 'id',
      snippet: 'GS-EXAKT'
    });
  });
});
