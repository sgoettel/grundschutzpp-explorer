export interface CatalogProp {
  name?: string;
  value?: string;
  ns?: string;
  remarks?: string;
  [key: string]: unknown;
}

export interface CatalogParam {
  id?: string;
  label?: string;
  prose?: string;
  values?: string[];
  [key: string]: unknown;
}

export interface CatalogLink {
  href?: string;
  rel?: string;
  text?: string;
  [key: string]: unknown;
}

export interface CatalogResourceLink {
  href?: string;
  [key: string]: unknown;
}

export interface CatalogResource {
  uuid?: string;
  title?: string;
  rlinks?: CatalogResourceLink[];
  [key: string]: unknown;
}

export interface CatalogPart {
  id?: string;
  name?: string;
  title?: string;
  prose?: string;
  props?: CatalogProp[];
  parts?: CatalogPart[];
  remarks?: string;
  [key: string]: unknown;
}

export interface CatalogControl {
  id?: string;
  title?: string;
  class?: string;
  props?: CatalogProp[];
  params?: CatalogParam[];
  parts?: CatalogPart[];
  links?: CatalogLink[];
  controls?: CatalogControl[];
  [key: string]: unknown;
}

export interface CatalogGroup {
  id?: string;
  title?: string;
  props?: CatalogProp[];
  parts?: CatalogPart[];
  controls?: CatalogControl[];
  groups?: CatalogGroup[];
  [key: string]: unknown;
}

export interface CatalogRoot {
  catalog?: {
    title?: string;
    metadata?: {
      links?: CatalogLink[];
      [key: string]: unknown;
    };
    groups?: CatalogGroup[];
    controls?: CatalogControl[];
    'back-matter'?: {
      resources?: CatalogResource[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ControlRelationship {
  kind: 'required' | 'related';
  targetId: string;
  targetTitle?: string;
  sourcePath: string;
  raw: CatalogLink;
}

export interface ControlRecord {
  id: string;
  title: string;
  groupPath: string[];
  fullText: string;
  control: CatalogControl;
  metadata: ControlMetadataProjection;
  relationships?: ControlRelationship[];
}

export interface ProjectedProp {
  name?: string;
  value?: string;
  namespace?: string;
  sourceLevel: 'control' | 'part';
  sourcePath: string;
  raw: CatalogProp;
}

export interface ControlMetadataProjection {
  known: ProjectedProp[];
  unknown: ProjectedProp[];
}

export interface TopicRecord {
  id: string;
  title: string;
  description?: string;
  controlIds: string[];
  raw: CatalogGroup;
}

export interface PracticeRecord {
  id: string;
  title: string;
  description?: string;
  directControlIds: string[];
  topics: TopicRecord[];
  raw: CatalogGroup;
}

export interface CatalogReference {
  title: string;
  href?: string;
  sourcePath: string;
  rawLink: CatalogLink;
  rawResource?: CatalogResource;
}

export interface CatalogParsingResult {
  source: CatalogRoot | null;
  controls: ControlRecord[];
  practices: PracticeRecord[];
  references: CatalogReference[];
  warnings: string[];
}
