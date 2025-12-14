export interface CatalogControl {
  id?: string;
  title?: string;
  class?: string;
  props?: Array<{ name?: string; value?: string }>;
  params?: Array<{ id?: string; label?: string; prose?: string }>;
  parts?: Array<{ id?: string; name?: string; title?: string; prose?: string }>;
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
}

export interface CatalogParsingResult {
  controls: ControlRecord[];
  warnings: string[];
}
