import { metadataLabel } from './metadata';
import { resolveParameterInserts } from './parameters';
import type {
  CatalogPart,
  ControlRecord,
  ControlRelationship
} from './types';

const CRLF = '\r\n';

const escapeCsvValue = (value: string, delimiter: string): string => {
  const needsQuoting = value.includes(delimiter) || value.includes('"') || value.includes('\n');
  let escaped = value.replace(/"/g, '""');
  if (needsQuoting) {
    escaped = `"${escaped}"`;
  }
  return escaped;
};

interface ExportContent {
  requirement: string;
  guidance: string;
  metadata: string;
  relationships: string;
  otherContent: string;
}

const collectFachlichContent = (
  parts: CatalogPart[] | undefined,
  params: ControlRecord['control']['params'],
  target: {
    requirement: string[];
    guidance: string[];
    otherContent: string[];
  },
  inheritedKind?: 'requirement' | 'guidance'
): void => {
  parts?.forEach((part) => {
    const kind =
      part.name === 'statement'
        ? 'requirement'
        : part.name === 'guidance'
          ? 'guidance'
          : inheritedKind;

    if (kind) {
      if (part.title?.trim()) {
        target[kind].push(part.title.trim());
      }
      const prose = resolveParameterInserts(part.prose, params).plainText;
      if (prose) {
        target[kind].push(prose);
      }
    } else {
      if (part.title?.trim()) {
        target.otherContent.push(part.title.trim());
      }
      const prose = resolveParameterInserts(part.prose, params).plainText;
      if (prose) {
        target.otherContent.push(prose);
      }
    }

    collectFachlichContent(part.parts, params, target, kind);
  });
};

const relationshipLabel = (
  relationship: ControlRelationship
): string => relationship.kind === 'required' ? 'Erforderlich' : 'Verwandt';

const projectExportContent = (record: ControlRecord): ExportContent => {
  const content = {
    requirement: [] as string[],
    guidance: [] as string[],
    otherContent: [] as string[]
  };
  collectFachlichContent(
    record.control.parts,
    record.control.params,
    content
  );

  return {
    requirement: content.requirement.join('\n\n'),
    guidance: content.guidance.join('\n\n'),
    metadata: record.metadata.known
      .map(
        (prop) =>
          `${metadataLabel(prop.name)}: ${prop.value ?? '–'}`
      )
      .join('\n'),
    relationships:
      record.relationships
        ?.map((relationship) => {
          const target = relationship.targetTitle
            ? `${relationship.targetTitle} (${relationship.targetId})`
            : relationship.targetId;
          return `${relationshipLabel(relationship)}: ${target}`;
        })
        .join('\n') ?? '',
    otherContent: content.otherContent.join('\n\n')
  };
};

export const exportCsv = (records: ControlRecord[], delimiter = ';'): string => {
  const header = [
    'id',
    'title',
    'groupPath',
    'fullText',
    'requirement',
    'guidance',
    'metadata',
    'relationships',
    'otherContent'
  ];
  const rows = records.map((record) => {
    const projected = projectExportContent(record);
    const cells = [
      record.id,
      record.title,
      record.groupPath.join(' > '),
      record.fullText,
      projected.requirement,
      projected.guidance,
      projected.metadata,
      projected.relationships,
      projected.otherContent
    ].map((cell) => escapeCsvValue(cell, delimiter));
    return cells.join(delimiter);
  });
  const content = [header.join(delimiter), ...rows].join(CRLF) + CRLF;
  return `\ufeff${content}`;
};

export const exportMarkdown = (records: ControlRecord[]): string => {
  const lines = ['# Grundschutz++ OSCAL Controls', ''];
  records.forEach((record) => {
    const projected = projectExportContent(record);
    lines.push(`## ${record.title} (${record.id})`);
    if (record.groupPath.length) {
      lines.push(`*Pfad:* ${record.groupPath.join(' > ')}`);
    }
    lines.push('');

    if (projected.requirement) {
      lines.push('### Anforderung', '', projected.requirement, '');
    }
    if (projected.guidance) {
      lines.push('### Umsetzungshinweis', '', projected.guidance, '');
    }
    if (projected.metadata) {
      lines.push('### Metadaten', '');
      projected.metadata.split('\n').forEach((line) => {
        const separator = line.indexOf(': ');
        lines.push(
          separator >= 0
            ? `- **${line.slice(0, separator)}:**${line.slice(separator + 1)}`
            : `- ${line}`
        );
      });
      lines.push('');
    }
    if (projected.relationships) {
      lines.push('### Beziehungen', '');
      projected.relationships.split('\n').forEach((line) => {
        const separator = line.indexOf(': ');
        lines.push(
          separator >= 0
            ? `- **${line.slice(0, separator)}:**${line.slice(separator + 1)}`
            : `- ${line}`
        );
      });
      lines.push('');
    }
    if (projected.otherContent) {
      lines.push(
        '### Weitere Inhalte',
        '',
        projected.otherContent,
        ''
      );
    }
    if (
      !projected.requirement &&
      !projected.guidance &&
      !projected.metadata &&
      !projected.relationships &&
      !projected.otherContent
    ) {
      lines.push(record.fullText || '_Keine Details verfügbar_', '');
    }
  });
  return lines.join('\n');
};
