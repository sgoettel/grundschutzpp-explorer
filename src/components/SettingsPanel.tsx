import React from 'react';
import {
  CATALOG_REPOSITORY_URL,
  CATALOG_SOURCE_PATH
} from '../config';

interface SettingsProps {
  catalogUrl: string;
  activeCatalogUrl: string;
  onChangeUrl: (url: string) => void;
  onFetch: () => void;
  onClearCache: () => void;
  isFetching: boolean;
  lastUpdated?: number;
  catalogStatus?: string;
  isCuratedSource: boolean;
  catalogMeta?: {
    title?: string;
    version?: string;
    lastModified?: string;
    oscalVersion?: string;
    publisher?: string;
  };
}


const SettingsPanel: React.FC<SettingsProps> = ({
  catalogUrl,
  activeCatalogUrl,
  onChangeUrl,
  onFetch,
  onClearCache,
  isFetching,
  lastUpdated,
  catalogMeta,
  catalogStatus,
  isCuratedSource
}) => {
  const formatMaybeDate = (value?: string): string | undefined => {
    if (!value) return undefined;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
  };

  const lastModifiedLabel = formatMaybeDate(catalogMeta?.lastModified);

  return (
    <div className="panel" aria-labelledby="settings-heading">
<div
  className="header"
  style={{
    marginBottom: '0.5rem',
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  }}
>
  <h2 id="settings-heading">Settings</h2>


  <div
    style={{
      marginLeft: 'auto',
      display: 'flex',
      gap: '0.5rem',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      alignItems: 'center',
    }}
  >
    {lastUpdated && (
      <span className="badge">Cached {new Date(lastUpdated).toLocaleString()}</span>
    )}

    {catalogMeta?.version && (
      <span className="badge">
        Catalog v{catalogMeta.version}
        {lastModifiedLabel ? ` · last-modified ${lastModifiedLabel}` : ''}
      </span>
    )}

    {catalogMeta?.oscalVersion && <span className="badge">OSCAL {catalogMeta.oscalVersion}</span>}
  </div>
</div>




      <div className="settings-grid">
        <label className="input-row">
          <span>Catalog URL</span>
          <input
            type="url"
            value={catalogUrl}
            onChange={(e) => onChangeUrl(e.target.value)}
            placeholder="https://.../catalog.json"
            aria-label="Catalog URL"
          />
        </label>
      </div>
      <div className="actions" style={{ marginTop: '0.75rem' }}>
        <button type="button" onClick={onFetch} disabled={isFetching}>
          {isFetching ? 'Fetching…' : 'Fetch & Index'}
        </button>
        <button type="button" onClick={onClearCache} disabled={isFetching}>
          Clear cache
        </button>
        <span className="notice" aria-live="polite">
          Paste a custom URL and press Fetch to reload. Data is cached locally for offline reuse.
        </span>
      </div>

      <section
        className="catalog-provenance"
        aria-labelledby="catalog-provenance-heading"
      >
        <div className="header">
          <h3 id="catalog-provenance-heading">Herkunftsnachweis</h3>
          <span className="badge">
            {isCuratedSource
              ? 'Kuratierte BSI-Quelle'
              : 'Benutzerdefinierte Quelle'}
          </span>
        </div>

        <div className="catalog-provenance-grid">
          <div>
            <h4>
              {isCuratedSource
                ? 'Aus den BSI-Quelldaten'
                : 'Aus den Quelldaten'}
            </h4>
            <dl>
              <dt>Katalogtitel</dt>
              <dd>{catalogMeta?.title ?? 'Nicht angegeben'}</dd>
              <dt>Version</dt>
              <dd>{catalogMeta?.version ?? 'Nicht angegeben'}</dd>
              <dt>Letzte Änderung</dt>
              <dd>{lastModifiedLabel ?? 'Nicht angegeben'}</dd>
              <dt>OSCAL-Version</dt>
              <dd>{catalogMeta?.oscalVersion ?? 'Nicht angegeben'}</dd>
              <dt>Herausgeber</dt>
              <dd>{catalogMeta?.publisher ?? 'Nicht angegeben'}</dd>
            </dl>
          </div>

          <div>
            <h4>Explorer-Angaben</h4>
            <dl>
              <dt>Abrufzeit</dt>
              <dd>
                {lastUpdated
                  ? new Date(lastUpdated).toLocaleString()
                  : 'Noch nicht abgerufen'}
              </dd>
              <dt>Aufbereitungsstatus</dt>
              <dd>{catalogStatus || 'Katalog wird vorbereitet'}</dd>
            </dl>
          </div>

          <div>
            <h4>Quelle</h4>
            <dl>
              {isCuratedSource ? (
                <>
                  <dt>Repository</dt>
                  <dd>
                    <a
                      href={CATALOG_REPOSITORY_URL}
                      target="_blank"
                      rel="noreferrer"
                    >
                      BSI-Repository
                    </a>
                  </dd>
                  <dt>Quellpfad</dt>
                  <dd>
                    <a
                      href={activeCatalogUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {CATALOG_SOURCE_PATH}
                    </a>
                  </dd>
                </>
              ) : (
                <>
                  <dt>Benutzerdefinierte URL</dt>
                  <dd>
                    <a
                      href={activeCatalogUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {activeCatalogUrl}
                    </a>
                  </dd>
                </>
              )}
            </dl>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsPanel;
