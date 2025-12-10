import { exportCsv, exportMarkdown } from './exporters';
import { ControlRecord } from './types';

const sample: ControlRecord[] = [
  {
    id: 'CTRL-1',
    title: 'First Control',
    groupPath: ['Group A'],
    fullText: 'First control prose',
    control: {}
  },
  {
    id: 'CTRL-2',
    title: 'Second Control',
    groupPath: ['Group B', 'Sub B'],
    fullText: 'Second control prose; with delimiter',
    control: {}
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
});

describe('exportMarkdown', () => {
  it('renders headings and body', () => {
    const md = exportMarkdown(sample);
    expect(md).toContain('## First Control (CTRL-1)');
    expect(md).toContain('*Pfad:* Group B > Sub B');
    expect(md).toContain('Second control prose');
  });
});
