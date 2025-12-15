import React from 'react';

interface SettingsProps {
  catalogUrl: string;
  onChangeUrl: (url: string) => void;
  onFetch: () => void;
  onClearCache: () => void;
  isFetching: boolean;
  lastUpdated?: number;
  catalogMeta?: {
    title?: string;
    version?: string;
    lastModified?: string;
    oscalVersion?: string;
  };
}


const SettingsPanel: React.FC<SettingsProps> = ({
  catalogUrl,
  onChangeUrl,
  onFetch,
  onClearCache,
  isFetching,
  lastUpdated,
  catalogMeta,
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
    </div>
  );
};

export default SettingsPanel;
