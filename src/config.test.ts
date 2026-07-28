import { describe, expect, it } from 'vitest';
import {
  canonicalizeCatalogUrl,
  DEFAULT_CATALOG_URL,
  isCuratedCatalogUrl
} from './config';

describe('catalog source identity', () => {
  it('maps the legacy refs URL with encoded plus signs to the curated source', () => {
    const legacyUrl =
      'https://raw.githubusercontent.com/BSI-Bund/Stand-der-Technik-Bibliothek/refs/heads/main/control_layer/Grundschutz%2B%2B/Grundschutz%2B%2B-resolved_catalog.json';

    expect(canonicalizeCatalogUrl(legacyUrl)).toBe(DEFAULT_CATALOG_URL);
    expect(isCuratedCatalogUrl(legacyUrl)).toBe(true);
  });

  it('does not treat a different raw GitHub path as the curated source', () => {
    const customUrl =
      'https://raw.githubusercontent.com/BSI-Bund/Stand-der-Technik-Bibliothek/main/control_layer/other/catalog.json';

    expect(canonicalizeCatalogUrl(customUrl)).toBe(customUrl);
    expect(isCuratedCatalogUrl(customUrl)).toBe(false);
  });
});
