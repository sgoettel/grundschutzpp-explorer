import { exportCsv, exportMarkdown } from './exporters';
import { ControlRecord } from './types';

const sample: ControlRecord[] = [
  {
    id: 'CTRL-1',
    title: 'First Control',
    groupPath: ['Group A'],
    fullText: 'First control prose',
    control: {},
    metadata: { known: [], unknown: [] }
  },
  {
    id: 'CTRL-2',
    title: 'Second Control',
    groupPath: ['Group B', 'Sub B'],
    fullText: 'Second control prose; with delimiter',
    control: {},
    metadata: { known: [], unknown: [] }
  }
];

const projectedSample: ControlRecord[] = [
  {
    id: 'APP.1',
    title: 'Fristen und Abhängigkeiten',
    groupPath: ['Organisation', 'Regelungen'],
    fullText: 'Fristen und Abhängigkeiten 30 Tage Hilfestellung Basis',
    control: {
      params: [
        {
          id: 'p-frist',
          label: 'festgelegte Frist',
          values: ['30 Tage']
        }
      ],
      parts: [
        {
          name: 'statement',
          prose: 'Die Frist beträgt {{ insert: param, p-frist }}.'
        },
        {
          name: 'guidance',
          prose: 'Hilfestellung zur Umsetzung.'
        },
        {
          name: 'additional',
          title: 'Zusatz',
          prose: 'Weiterer BSI-Inhalt.'
        }
      ]
    },
    metadata: {
      known: [
        {
          name: 'sec_level',
          value: 'Basis',
          sourceLevel: 'control',
          sourcePath: 'Control → Prop',
          raw: { name: 'sec_level', value: 'Basis' }
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
    },
    relationships: [
      {
        kind: 'required',
        targetId: 'APP.2',
        targetTitle: 'Voraussetzung',
        sourcePath: 'Control → Link',
        raw: { href: '#APP.2', rel: 'required' }
      }
    ]
  }
];

describe('exportCsv', () => {
  it('adds UTF-8 BOM, uses semicolon, and escapes quotes', () => {
    const csv = exportCsv(sample);
    expect(csv.startsWith('\ufeff')).toBe(true);
    expect(csv).toContain('id;title;groupPath;fullText');
    expect(csv).toContain('Group B > Sub B');
    expect(csv).toContain('"Second control prose; with delimiter"');
    expect(csv.endsWith('\r\n')).toBe(true);
  });

  it('exports the corrected structured projection without raw parameter inserts', () => {
    const csv = exportCsv(projectedSample);

    expect(csv).toContain(
      'id;title;groupPath;fullText;requirement;guidance;metadata;relationships;otherContent'
    );
    expect(csv).toContain('Die Frist beträgt 30 Tage.');
    expect(csv).not.toContain('{{ insert: param, p-frist }}');
    expect(csv).toContain('Sicherheitsniveau: Basis');
    expect(csv).toContain('Gefährdungen: G 0.18');
    expect(csv).toContain('Erforderlich: Voraussetzung (APP.2)');
    expect(csv).toContain('Zusatz');
    expect(csv).toContain('Weiterer BSI-Inhalt.');
  });
});

describe('exportMarkdown', () => {
  it('renders headings and body', () => {
    const md = exportMarkdown(sample);
    expect(md).toContain('## First Control (CTRL-1)');
    expect(md).toContain('*Pfad:* Group B > Sub B');
    expect(md).toContain('Second control prose');
  });

  it('renders structured fachlich sections from the corrected projection', () => {
    const md = exportMarkdown(projectedSample);

    expect(md).toContain('### Anforderung');
    expect(md).toContain('Die Frist beträgt 30 Tage.');
    expect(md).not.toContain('{{ insert: param, p-frist }}');
    expect(md).toContain('### Umsetzungshinweis');
    expect(md).toContain('Hilfestellung zur Umsetzung.');
    expect(md).toContain('### Metadaten');
    expect(md).toContain('- **Sicherheitsniveau:** Basis');
    expect(md).toContain('- **Gefährdungen:** G 0.18');
    expect(md).toContain('### Beziehungen');
    expect(md).toContain('- **Erforderlich:** Voraussetzung (APP.2)');
    expect(md).toContain('### Weitere Inhalte');
    expect(md).toContain('Zusatz');
    expect(md).toContain('Weiterer BSI-Inhalt.');
  });
});
