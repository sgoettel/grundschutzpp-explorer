export interface CatalogProp {
  name?: string;
  value?: string;
  ns?: string;
  [key: string]: unknown;
}

export interface CatalogParam {
  id?: string;
  label?: string;
  prose?: string;
  values?: string[];
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
  controls?: CatalogControl[];
  [key: string]: unknown;
}

export interface CatalogGroup {
  id?: string;
  title?: string;
  controls?: CatalogControl[];
  groups?: CatalogGroup[];
  [key: string]: unknown;
}

export interface CatalogRoot {
  catalog?: {
    title?: string;
    groups?: CatalogGroup[];
    controls?: CatalogControl[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ControlRecord {
  id: string;
  title: string;
  groupPath: string[];
  fullText: string;
  control: CatalogControl;
  metadata: ControlMetadataProjection;
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

export interface CatalogParsingResult {
  source: CatalogRoot | null;
  controls: ControlRecord[];
  warnings: string[];
}
