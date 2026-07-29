import {
  CATALOG_LICENSE_URL,
  CATALOG_REPOSITORY_URL,
  CATALOG_SOURCE_PATH
} from '../config';
import type { CatalogReference } from '../lib/types';

interface SettingsPanelProps {
  catalogUrl: string;
  activeCatalogUrl: string;
  onChangeUrl: (url: string) => void;
  onFetch: () => void;
  onClearCache: () => void;
  onClose: () => void;
  onExportCsv: () => void;
  onExportMarkdown: () => void;
  exportDisabled: boolean;
  isFetching: boolean;
  lastUpdated?: number;
  catalogStatus?: string;
  isCuratedSource: boolean;
  catalogReferences: CatalogReference[];
  requirementCount: number;
  catalogMeta?: {
    title?: string;
    version?: string;
    lastModified?: string;
    oscalVersion?: string;
    publisher?: string;
  };
}

const formatDate = (value?: string): string | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('de-DE');
};

const ValueRow = ({
  label,
  children,
  mono = false
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) => (
  <div className="panel-value-row">
    <dt>{label}</dt>
    <dd className={mono ? 'mono' : undefined}>{children}</dd>
  </div>
);

const SettingsPanel = ({
  catalogUrl,
  activeCatalogUrl,
  onChangeUrl,
  onFetch,
  onClearCache,
  onClose,
  onExportCsv,
  onExportMarkdown,
  exportDisabled,
  isFetching,
  lastUpdated,
  catalogMeta,
  catalogStatus,
  isCuratedSource,
  catalogReferences,
  requirementCount
}: SettingsPanelProps) => {
  const sourceLabel = isCuratedSource
    ? 'Kuratierte BSI-Quelle'
    : 'Benutzerdefinierte Quelle';
  const lastModified = formatDate(catalogMeta?.lastModified);
  const fetchedAt = lastUpdated
    ? new Date(lastUpdated).toLocaleString('de-DE')
    : 'Noch nicht abgerufen';

  return (
    <aside
      id="catalog-panel"
      className="catalog-panel"
      aria-labelledby="catalog-panel-heading"
    >
      <header className="catalog-panel-header">
        <h2 id="catalog-panel-heading">Katalogstand</h2>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Katalogstand schließen"
        >
          ✕
        </button>
      </header>

      <div className="catalog-panel-body">
        <section aria-labelledby="catalog-source-heading">
          <h3 className="section-label" id="catalog-source-heading">
            Katalogquelle
          </h3>
          <label className="catalog-url-field">
            <span>Katalog-URL</span>
            <input
              type="url"
              value={catalogUrl}
              onChange={(event) => onChangeUrl(event.target.value)}
              placeholder="https://…/catalog.json"
              aria-label="Katalog-URL"
            />
          </label>
          <div className="panel-actions">
            <button type="button" onClick={onFetch} disabled={isFetching}>
              {isFetching ? 'Abruf läuft…' : 'Abrufen und aufbereiten'}
            </button>
            <button type="button" onClick={onClearCache} disabled={isFetching}>
              Cache leeren
            </button>
          </div>
          <p className="panel-status" aria-live="polite">
            Zuletzt abgerufen {fetchedAt} · {catalogStatus || 'Katalog wird vorbereitet'}.
          </p>
        </section>

        <section aria-labelledby="catalog-data-heading">
          <h3 className="section-label" id="catalog-data-heading">
            Katalog
          </h3>
          <dl className="panel-values">
            <ValueRow label="Quelle">{sourceLabel}</ValueRow>
            <ValueRow label="Katalogtitel">
              {catalogMeta?.title ?? 'Nicht angegeben'}
            </ValueRow>
            <ValueRow label="Katalogversion" mono>
              {catalogMeta?.version ?? 'Nicht angegeben'}
            </ValueRow>
            <ValueRow label="Letzte Änderung" mono>
              {lastModified ?? 'Nicht angegeben'}
            </ValueRow>
            <ValueRow label="OSCAL-Version" mono>
              {catalogMeta?.oscalVersion ?? 'Nicht angegeben'}
            </ValueRow>
            <ValueRow label="Herausgeber">
              {catalogMeta?.publisher ?? 'Nicht angegeben'}
            </ValueRow>
            <ValueRow label="Abrufzeit" mono>
              {fetchedAt}
            </ValueRow>
            <ValueRow label="Status">
              {catalogStatus || 'Katalog wird vorbereitet'}
            </ValueRow>
            <ValueRow label="Anforderungen" mono>
              {requirementCount.toLocaleString('de-DE')}
            </ValueRow>
          </dl>
        </section>

        <section aria-labelledby="catalog-provenance-heading">
          <h3 className="section-label" id="catalog-provenance-heading">
            Herkunft
          </h3>
          <dl className="panel-values">
            {isCuratedSource ? (
              <>
                <ValueRow label="Repository">
                  <a
                    href={CATALOG_REPOSITORY_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    BSI-Repository
                  </a>
                </ValueRow>
                <ValueRow label="Quellpfad" mono>
                  <a
                    href={activeCatalogUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {CATALOG_SOURCE_PATH}
                  </a>
                </ValueRow>
                <ValueRow label="Lizenz">
                  <a
                    href={CATALOG_LICENSE_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    CC BY-SA 4.0
                  </a>
                </ValueRow>
                <ValueRow label="Namensnennung">
                  Bundesamt für Sicherheit in der Informationstechnik (BSI),
                  Stand-der-Technik-Bibliothek
                </ValueRow>
              </>
            ) : (
              <ValueRow label="Benutzerdefinierte URL" mono>
                <a href={activeCatalogUrl} target="_blank" rel="noreferrer">
                  {activeCatalogUrl}
                </a>
              </ValueRow>
            )}

            {catalogReferences.map((reference, index) => (
              <ValueRow
                label={index === 0 ? 'Fachliche Referenz' : 'Weitere Referenz'}
                key={`${reference.title}-${index}`}
              >
                {reference.href ? (
                  <a href={reference.href} target="_blank" rel="noreferrer">
                    {reference.title}
                  </a>
                ) : (
                  reference.title
                )}
              </ValueRow>
            ))}
          </dl>
        </section>

        <section aria-labelledby="catalog-export-heading">
          <h3 className="section-label" id="catalog-export-heading">
            Export
          </h3>
          <div className="panel-actions export-actions">
            <button
              type="button"
              onClick={onExportCsv}
              disabled={exportDisabled}
            >
              CSV
            </button>
            <button
              type="button"
              onClick={onExportMarkdown}
              disabled={exportDisabled}
            >
              Markdown
            </button>
          </div>
          <p className="panel-status">
            Exportiert die aktuelle Auswahl, sonst die aktuellen
            Suchergebnisse.
          </p>
        </section>

        <p className="community-note">
          Unabhängiges Community-Projekt, keine offizielle BSI-Anwendung.
        </p>
      </div>
    </aside>
  );
};

export default SettingsPanel;
