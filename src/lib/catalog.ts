import { CatalogControl, CatalogGroup, CatalogParsingResult, CatalogRoot, ControlRecord } from './types';

interface ParseContext {
  warnings: string[];
}

const DEFAULT_UNKNOWN_TITLE = 'Untitled control';

const collectText = (control: CatalogControl): string => {
  const textParts: string[] = [];

  // title comes in flattenControls at the begining
  if (control.class) {
    textParts.push(control.class);
  }

  // - alt-identifier, effort_level only in metadata
  control.props?.forEach((prop) => {
    if (prop.name === 'tags' && prop.value) {
      textParts.push(prop.value);
    }
  });

  control.params?.forEach((param) => {
    if (param.label) textParts.push(param.label);
    if (param.prose) textParts.push(param.prose);
  });

control.parts?.forEach((part) => {
  if (part.title) textParts.push(part.title);

  // part.name contains OSCAL structure tokens (e.g. "statement", "guidance").
  // therefore we skip them (case-insensitiv).
  const name = typeof part.name === 'string' ? part.name.toLowerCase() : '';
  if (name && name !== 'statement' && name !== 'guidance') {
    textParts.push(part.name as string);
  }

  if (part.prose) textParts.push(part.prose);
});


  return textParts.join(' ').trim();
};


const ensureId = (control: CatalogControl, ctx: ParseContext): string => {
  if (control.id) return String(control.id);
  const generated = `control-${Math.random().toString(36).slice(2)}`;
  ctx.warnings.push('Encountered control without ID; generated synthetic ID.');
  return generated;
};

const flattenControls = (
  controls: CatalogControl[] | undefined,
  groupPath: string[],
  ctx: ParseContext
): ControlRecord[] => {
  if (!controls?.length) return [];
  return controls.flatMap((control) => {
    const id = ensureId(control, ctx);
    const title = control.title?.trim() || id || DEFAULT_UNKNOWN_TITLE;
    const fullText = [title, collectText(control)].filter(Boolean).join(' ');
    const current: ControlRecord = {
      id,
      title,
      groupPath,
      fullText,
      control
    };

    const nested = flattenControls(control.controls, [...groupPath, title], ctx);
    return [current, ...nested];
  });
};

const walkGroup = (group: CatalogGroup, path: string[], ctx: ParseContext): ControlRecord[] => {
  const nextPath = group.title ? [...path, group.title] : path;
  const current = flattenControls(group.controls, nextPath, ctx);
  const nested = group.groups?.flatMap((child) => walkGroup(child, nextPath, ctx)) ?? [];
  return [...current, ...nested];
};

export const parseCatalog = (input: unknown): CatalogParsingResult => {
  const ctx: ParseContext = { warnings: [] };
  try {
    const maybeRoot = input as CatalogRoot;
    if (!maybeRoot || typeof maybeRoot !== 'object' || !('catalog' in maybeRoot)) {
      throw new Error('Missing "catalog" root property');
    }
    const catalog = maybeRoot.catalog;
    if (!catalog || typeof catalog !== 'object') {
      throw new Error('Invalid catalog structure');
    }

    const controls = [
      ...flattenControls(catalog.controls, [], ctx),
      ...(catalog.groups?.flatMap((group) => walkGroup(group, [], ctx)) ?? [])
    ];

    return { controls, warnings: ctx.warnings };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parsing error';
    return { controls: [], warnings: [message] };
  }
};
