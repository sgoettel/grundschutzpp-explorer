import {
  CatalogControl,
  CatalogGroup,
  CatalogParsingResult,
  CatalogPart,
  CatalogProp,
  CatalogRoot,
  ControlMetadataProjection,
  ControlRecord,
  PracticeRecord,
  ProjectedProp
} from './types';
import { resolveParameterInserts } from './parameters';

interface ParseContext {
  warnings: string[];
}

const DEFAULT_UNKNOWN_TITLE = 'Untitled control';

const KNOWN_PROP_NAMES = new Set([
  'action_word',
  'alt-identifier',
  'documentation',
  'effort_level',
  'modal_verb',
  'result',
  'result_specification',
  'sec_level',
  'tags'
]);

const projectProp = (
  prop: CatalogProp,
  sourceLevel: ProjectedProp['sourceLevel'],
  sourcePath: string
): ProjectedProp => ({
  name: prop.name,
  value: prop.value,
  namespace: prop.ns,
  sourceLevel,
  sourcePath,
  raw: prop
});

const partPathSegment = (part: CatalogPart): string => {
  const label = part.name?.trim() || part.title?.trim() || part.id?.trim();
  return label ? `${label}-Part` : 'Part';
};

const addProjectedProp = (
  projection: ControlMetadataProjection,
  prop: CatalogProp,
  sourceLevel: ProjectedProp['sourceLevel'],
  path: string[]
): void => {
  const target = prop.name && KNOWN_PROP_NAMES.has(prop.name)
    ? projection.known
    : projection.unknown;
  target.push(projectProp(prop, sourceLevel, path.join(' → ')));
};

const projectPartProps = (
  parts: CatalogPart[] | undefined,
  parentPath: string[],
  projection: ControlMetadataProjection
): void => {
  parts?.forEach((part) => {
    const partPath = [...parentPath, partPathSegment(part)];
    part.props?.forEach((prop) => {
      addProjectedProp(projection, prop, 'part', [...partPath, 'Prop']);
    });
    projectPartProps(part.parts, partPath, projection);
  });
};

const projectMetadata = (control: CatalogControl): ControlMetadataProjection => {
  const projection: ControlMetadataProjection = { known: [], unknown: [] };
  control.props?.forEach((prop) => {
    addProjectedProp(projection, prop, 'control', ['Control', 'Prop']);
  });
  projectPartProps(control.parts, ['Control'], projection);
  return projection;
};

const collectPartText = (
  parts: CatalogPart[] | undefined,
  params: CatalogControl['params']
): string[] =>
  parts?.flatMap((part) => {
    const current = [
      part.title,
      resolveParameterInserts(part.prose, params).plainText
    ].filter((value): value is string => Boolean(value));

    return [...current, ...collectPartText(part.parts, params)];
  }) ?? [];

const collectText = (
  control: CatalogControl,
  metadata: ControlMetadataProjection
): string => {
  const metadataValues = metadata.known
    .map((prop) => prop.value)
    .filter((value): value is string => Boolean(value));

  return [
    ...collectPartText(control.parts, control.params),
    ...metadataValues
  ].join(' ').trim();
};

const collectControlIds = (
  controls: CatalogControl[] | undefined
): string[] =>
  controls?.flatMap((control) => [
    ...(control.id ? [String(control.id)] : []),
    ...collectControlIds(control.controls)
  ]) ?? [];

const collectGroupControlIds = (group: CatalogGroup): string[] => [
  ...collectControlIds(group.controls),
  ...(group.groups?.flatMap(collectGroupControlIds) ?? [])
];

const groupDescription = (group: CatalogGroup): string | undefined => {
  const prose = group.parts
    ?.map((part) => part.prose?.trim())
    .filter((value): value is string => Boolean(value));

  return prose?.length ? prose.join('\n\n') : undefined;
};

const projectPractices = (
  groups: CatalogGroup[] | undefined
): PracticeRecord[] =>
  groups?.map((practice, practiceIndex) => ({
    id: practice.id?.trim() || `practice-${practiceIndex + 1}`,
    title: practice.title?.trim() || `Praktik ${practiceIndex + 1}`,
    description: groupDescription(practice),
    directControlIds: collectControlIds(practice.controls),
    topics:
      practice.groups?.map((topic, topicIndex) => ({
        id: topic.id?.trim() ||
          `practice-${practiceIndex + 1}-topic-${topicIndex + 1}`,
        title: topic.title?.trim() || `Thema ${topicIndex + 1}`,
        description: groupDescription(topic),
        controlIds: collectGroupControlIds(topic),
        raw: topic
      })) ?? [],
    raw: practice
  })) ?? [];

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
    const metadata = projectMetadata(control);
    const fullText = [title, collectText(control, metadata)]
      .filter(Boolean)
      .join(' ');
    const current: ControlRecord = {
      id,
      title,
      groupPath,
      fullText,
      control,
      metadata
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
    const practices = projectPractices(catalog.groups);

    return { source: maybeRoot, controls, practices, warnings: ctx.warnings };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parsing error';
    return { source: null, controls: [], practices: [], warnings: [message] };
  }
};
