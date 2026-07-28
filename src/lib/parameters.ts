import type { CatalogParam } from './types';

export interface ResolvedTextSegment {
  kind: 'text';
  text: string;
}

export interface ResolvedParameterSegment {
  kind: 'parameter';
  text: string;
  original: string;
  parameterId: string;
  label?: string;
  values: string[];
  resolved: boolean;
  raw?: CatalogParam;
}

export interface ResolvedProse {
  plainText: string;
  segments: Array<ResolvedTextSegment | ResolvedParameterSegment>;
}

const INSERT_PARAM_PATTERN = /\{\{\s*insert:\s*param\s*,\s*([^\s}]+)\s*\}\}/g;

export const resolveParameterInserts = (
  prose: unknown,
  params: CatalogParam[] = []
): ResolvedProse => {
  if (typeof prose !== 'string' || !prose) {
    return { plainText: '', segments: [] };
  }

  const parametersById = new Map<string, CatalogParam>();
  params.forEach((param) => {
    if (param.id && !parametersById.has(param.id)) {
      parametersById.set(param.id, param);
    }
  });

  const segments: ResolvedProse['segments'] = [];
  let cursor = 0;

  for (const match of prose.matchAll(INSERT_PARAM_PATTERN)) {
    const matchIndex = match.index ?? cursor;
    if (matchIndex > cursor) {
      segments.push({ kind: 'text', text: prose.slice(cursor, matchIndex) });
    }

    const original = match[0];
    const parameterId = match[1];
    const raw = parametersById.get(parameterId);
    const values = raw?.values ?? [];
    const firstValue = values.find((value) => value.trim().length > 0);
    const label = raw?.label?.trim() || undefined;
    const text = firstValue ?? label ?? `[${parameterId}]`;

    segments.push({
      kind: 'parameter',
      text,
      original,
      parameterId,
      label,
      values,
      resolved: Boolean(raw),
      raw
    });
    cursor = matchIndex + original.length;
  }

  if (cursor < prose.length) {
    segments.push({ kind: 'text', text: prose.slice(cursor) });
  }

  return {
    plainText: segments.map((segment) => segment.text).join(''),
    segments
  };
};
