import { ControlRecord } from './types';

const CRLF = '\r\n';

const escapeCsvValue = (value: string, delimiter: string): string => {
  const needsQuoting = value.includes(delimiter) || value.includes('"') || value.includes('\n');
  let escaped = value.replace(/"/g, '""');
  if (needsQuoting) {
    escaped = `"${escaped}"`;
  }
  return escaped;
};

export const exportCsv = (records: ControlRecord[], delimiter = ';'): string => {
  const header = ['id', 'title', 'groupPath', 'fullText'];
  const rows = records.map((record) => {
    const cells = [
      record.id,
      record.title,
      record.groupPath.join(' > '),
      record.fullText
    ].map((cell) => escapeCsvValue(cell, delimiter));
    return cells.join(delimiter);
  });
  const content = [header.join(delimiter), ...rows].join(CRLF) + CRLF;
  return `\ufeff${content}`;
};

export const exportMarkdown = (records: ControlRecord[]): string => {
  const lines = ['# Grundschutz++ OSCAL Controls', ''];
  records.forEach((record) => {
    lines.push(`## ${record.title} (${record.id})`);
    if (record.groupPath.length) {
      lines.push(`*Pfad:* ${record.groupPath.join(' > ')}`);
    }
    lines.push('');
    lines.push(record.fullText || '_Keine Details verfügbar_');
    lines.push('');
  });
  return lines.join('\n');
};
