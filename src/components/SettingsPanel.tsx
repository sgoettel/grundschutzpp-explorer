import React from 'react';
import {
  CATALOG_LICENSE_URL,
  CATALOG_REPOSITORY_URL,
  CATALOG_SOURCE_PATH
} from '../config';
import type { CatalogReference } from '../lib/types';

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
  catalogReferences: CatalogReference[];
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
  isCuratedSource,
  catalogReferences
}) => {
  const formatMaybeDate = (value?: string): string | undefined => {
    if (!value) return undefined;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString('de-DE');
  };

  const lastModifiedLabel = formatMaybeDate(catalogMeta?.lastModified);

  return (
    <div className="panel">
      <details className="technical-settings">
        <summary>Technische Einstellungen</summary>
        <div
          className="header"
          style={{
            margin: '0.75rem 0 0.5rem',
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}
        >
          <h2 id="settings-heading">Einstellungen</h2>

          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
              alignItems: 'center'
            }}
          >
            {lastUpdated && (
              <span className="badge">
                Gespeichert {new Date(lastUpdated).toLocaleString('de-DE')}
              </span>
            )}

            {catalogMeta?.version && (
              <span className="badge">
                Katalogversion {catalogMeta.version}
                {lastModifiedLabel
                  ? ` · letzte Änderung ${lastModifiedLabel}`
                  : ''}
              </span>
            )}

            {catalogMeta?.oscalVersion && (
              <span className="badge">OSCAL {catalogMeta.oscalVersion}</span>
            )}
          </div>
        </div>

        <div className="settings-grid">
          <label className="input-row">
            <span>Katalog-URL</span>
            <input
              type="url"
              value={catalogUrl}
              onChange={(e) => onChangeUrl(e.target.value)}
              placeholder="https://.../catalog.json"
              aria-label="Katalog-URL"
            />
          </label>
        </div>
        <div className="actions" style={{ marginTop: '0.75rem' }}>
          <button type="button" onClick={onFetch} disabled={isFetching}>
            {isFetching ? 'Abruf läuft…' : 'Abrufen und aufbereiten'}
          </button>
          <button type="button" onClick={onClearCache} disabled={isFetching}>
            Cache leeren
          </button>
          <span className="notice" aria-live="polite">
            Eine eigene URL kann hier abgerufen werden. Erfolgreich
            aufbereitete Kataloge werden lokal gespeichert.
          </span>
        </div>
      </details>

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
                  ? new Date(lastUpdated).toLocaleString('de-DE')
                  : 'Noch nicht abgerufen'}
              </dd>
              <dt>Aufbereitungsstatus</dt>
              <dd>{catalogStatus || 'Katalog wird vorbereitet'}</dd>
            </dl>
          </div>

          <div>
            <h4>
              {isCuratedSource ? 'Aus dem BSI-Repository' : 'Quelle'}
            </h4>
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
                  <dt>Lizenz</dt>
                  <dd>
                    <a
                      href={CATALOG_LICENSE_URL}
                      target="_blank"
                      rel="noreferrer"
                    >
                      CC BY-SA 4.0
                    </a>
                  </dd>
                  <dt>Namensnennung</dt>
                  <dd>
                    Bundesamt für Sicherheit in der Informationstechnik
                    (BSI), Stand-der-Technik-Bibliothek
                  </dd>
                  {catalogReferences.length ? (
                    <>
                      <dt>Fachliche Referenz</dt>
                      <dd>
                        <ul>
                          {catalogReferences.map((reference, index) => (
                            <li key={`${reference.title}-${index}`}>
                              {reference.href ? (
                                <a
                                  href={reference.href}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {reference.title}
                                </a>
                              ) : (
                                reference.title
                              )}
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </>
                  ) : null}
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
