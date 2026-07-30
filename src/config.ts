export const CATALOG_REPOSITORY_URL =
  'https://github.com/BSI-Bund/Stand-der-Technik-Bibliothek';

export const PROJECT_REPOSITORY_URL =
  'https://github.com/sgoettel/grundschutzpp-explorer';

export const AI_ASSISTED_DEVELOPMENT_URL =
  `${PROJECT_REPOSITORY_URL}/blob/main/AI_ASSISTED_DEVELOPMENT.md`;

export const CATALOG_LICENSE_URL =
  `${CATALOG_REPOSITORY_URL}/blob/main/LICENSE`;

export const CATALOG_SOURCE_PATH =
  'control_layer/Grundschutz++/Grundschutz++-resolved_catalog.json';

export const DEFAULT_CATALOG_URL =
  `https://raw.githubusercontent.com/BSI-Bund/Stand-der-Technik-Bibliothek/main/${CATALOG_SOURCE_PATH}`;

const RAW_REPOSITORY_PATH =
  '/BSI-Bund/Stand-der-Technik-Bibliothek';

const curatedSourcePaths = new Set([
  `${RAW_REPOSITORY_PATH}/main/${CATALOG_SOURCE_PATH}`,
  `${RAW_REPOSITORY_PATH}/refs/heads/main/${CATALOG_SOURCE_PATH}`
]);

export const canonicalizeCatalogUrl = (value: string): string => {
  const url = value.trim();

  try {
    const parsed = new URL(url);
    const decodedPath = decodeURIComponent(parsed.pathname);

    if (
      parsed.origin === 'https://raw.githubusercontent.com' &&
      curatedSourcePaths.has(decodedPath)
    ) {
      return DEFAULT_CATALOG_URL;
    }
  } catch {
    // Benutzerdefinierte Eingaben werden unverändert weitergereicht.
  }

  return url;
};

export const isCuratedCatalogUrl = (url: string): boolean =>
  canonicalizeCatalogUrl(url) === DEFAULT_CATALOG_URL;
