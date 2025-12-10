import React from 'react';

interface SettingsProps {
  catalogUrl: string;
  onChangeUrl: (url: string) => void;
  onFetch: () => void;
  onClearCache: () => void;
  isFetching: boolean;
  lastUpdated?: number;
}

const SettingsPanel: React.FC<SettingsProps> = ({
  catalogUrl,
  onChangeUrl,
  onFetch,
  onClearCache,
  isFetching,
  lastUpdated
}) => {
  return (
    <div className="panel" aria-labelledby="settings-heading">
      <div className="header" style={{ marginBottom: '0.5rem' }}>
        <h2 id="settings-heading">Settings</h2>
        {lastUpdated && <span className="badge">Cached {new Date(lastUpdated).toLocaleString()}</span>}
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
