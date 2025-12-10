import React, { useEffect, useMemo, useState } from 'react';
import SettingsPanel from './components/SettingsPanel';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import ControlDetail from './components/ControlDetail';
import Progress from './components/Progress';
import { DEFAULT_CATALOG_URL } from './config';
import { buildIndex } from './lib/search';
import { parseCatalog } from './lib/catalog';
import { exportCsv, exportMarkdown } from './lib/exporters';
import { clearCache, loadCatalog, saveCatalog } from './lib/storage';
import { ControlRecord } from './lib/types';

interface HashState {
  url?: string;
  q?: string;
  group?: string;
  id?: string;
}

const readHash = (): HashState => {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const params = new URLSearchParams(raw.startsWith('?') ? raw.slice(1) : raw);
  const result: HashState = {};
  params.forEach((value, key) => {
    if (value) (result as Record<string, string>)[key] = value;
  });
  return result;
};

const writeHash = (state: HashState) => {
  const params = new URLSearchParams();
  if (state.url) params.set('url', state.url);
  if (state.q) params.set('q', state.q);
  if (state.group) params.set('group', state.group);
  if (state.id) params.set('id', state.id);
  const hash = params.toString();
  window.location.hash = hash ? `/?${hash}` : '#/';
};

const App: React.FC = () => {
  const initialHash = readHash();
  const [catalogUrl, setCatalogUrl] = useState(initialHash.url || DEFAULT_CATALOG_URL);
  const [query, setQuery] = useState(initialHash.q || '');
  const [groupFilter, setGroupFilter] = useState(initialHash.group || '');
  const [controls, setControls] = useState<ControlRecord[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [isFetching, setIsFetching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | undefined>(undefined);
  const [searchResults, setSearchResults] = useState<ControlRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(initialHash.id);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const controlMap = useMemo(() => {
    const map = new Map<string, ControlRecord>();
    controls.forEach((c) => map.set(c.id, c));
    return map;
  }, [controls]);

  useEffect(() => {
    const onHashChange = () => {
      const state = readHash();
      if (state.url) setCatalogUrl(state.url);
      if (state.q !== undefined) setQuery(state.q);
      if (state.group !== undefined) setGroupFilter(state.group);
      if (state.id !== undefined) setSelectedId(state.id);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    writeHash({ url: catalogUrl, q: query, group: groupFilter, id: selectedId });
  }, [catalogUrl, query, groupFilter, selectedId]);

  useEffect(() => {
    const restoreFromCache = async () => {
      const cached = await loadCatalog(catalogUrl);
      if (cached) {
        setLastUpdated(cached.fetchedAt);
        const parsed = parseCatalog(cached.payload);
        setWarnings(parsed.warnings);
        setControls(parsed.controls);
      }
    };
    restoreFromCache();
  }, [catalogUrl]);

  useEffect(() => {
    if (!controls.length) {
      setSearchResults([]);
      return;
    }
    const { query: runQuery } = buildIndex(controls);
    const results = runQuery(query, groupFilter ? { group: groupFilter } : undefined);
    const mapped = results
      .map((res) => controlMap.get(String(res.id)))
      .filter((record): record is ControlRecord => Boolean(record));
    setSearchResults(mapped);
  }, [controls, query, groupFilter, controlMap]);

  const groups = useMemo(() => {
    const allPaths = new Set<string>();
    controls.forEach((c) => c.groupPath.forEach((p) => allPaths.add(p)));
    return Array.from(allPaths).sort();
  }, [controls]);

  const selectedRecord = useMemo(() => controlMap.get(selectedId ?? ''), [controlMap, selectedId]);

  const fetchAndIndex = async () => {
    setIsFetching(true);
    setError(null);
    setWarnings([]);
    setStatus('Downloading catalog…');
    try {
      const response = await fetch(catalogUrl);
      if (!response.ok) throw new Error(`Failed to download catalog (${response.status})`);
      const payload = await response.json();
      await saveCatalog(catalogUrl, payload);
      setStatus('Parsing catalog…');
      const parsed = parseCatalog(payload);
      setWarnings(parsed.warnings);
      if (!parsed.controls.length) {
        throw new Error('Catalog parsed but no controls were found.');
      }
      setControls(parsed.controls);
      setLastUpdated(Date.now());
      setStatus('Indexing…');
      const { query: runQuery } = buildIndex(parsed.controls);
      const results = runQuery(query, groupFilter ? { group: groupFilter } : undefined);
      const mapped = results
        .map((res) => parsed.controls.find((c) => c.id === String(res.id)))
        .filter((record): record is ControlRecord => Boolean(record));
      setSearchResults(mapped);
    } catch (err) {
      const cached = await loadCatalog(catalogUrl);
      if (cached) {
        const parsed = parseCatalog(cached.payload);
        setWarnings(parsed.warnings.concat('Live fetch failed; loaded cached copy.'));
        setControls(parsed.controls);
        setLastUpdated(cached.fetchedAt);
      }
      setError(err instanceof Error ? err.message : 'Unknown error while fetching catalog');
    } finally {
      setStatus('');
      setIsFetching(false);
    }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds(new Set(searchResults.map((r) => r.id)));
  };

  const recordsForExport = selectedIds.size
    ? searchResults.filter((r) => selectedIds.has(r.id))
    : searchResults;

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(href);
  };

  const handleExportCsv = () => {
    downloadFile(exportCsv(recordsForExport), 'grundschutz-controls.csv', 'text/csv;charset=utf-8');
  };

  const handleExportMarkdown = () => {
    downloadFile(exportMarkdown(recordsForExport), 'grundschutz-controls.md', 'text/markdown');
  };

  return (
    <div className="app-shell">
      <header className="header">
        <div>
          <h1>Grundschutz++ OSCAL Explorer</h1>
          <p>Fetch, search, and export controls directly in the browser.</p>
        </div>
        <a href="https://github.com/BSI-Bund/grundschutz" target="_blank" rel="noreferrer">
          Upstream repository
        </a>
      </header>

      <SettingsPanel
        catalogUrl={catalogUrl}
        onChangeUrl={setCatalogUrl}
        onFetch={fetchAndIndex}
        onClearCache={() => clearCache().then(() => setWarnings(['Cache cleared.']))}
        isFetching={isFetching}
        lastUpdated={lastUpdated}
      />

      {status && <Progress label={status} />}
      {error && <div className="notice error">{error}</div>}
      {warnings.length > 0 && (
        <div className="notice" role="alert">
          {warnings.map((w, idx) => (
            <div key={idx}>{w}</div>
          ))}
        </div>
      )}

      <SearchBar
        query={query}
        groupFilter={groupFilter}
        groups={groups}
        onQueryChange={setQuery}
        onGroupChange={setGroupFilter}
      />

      <div className="actions" style={{ margin: '0.75rem 0' }}>
        <button type="button" onClick={selectAllVisible} disabled={!searchResults.length}>
          Select all filtered ({searchResults.length})
        </button>
        <button type="button" onClick={() => setSelectedIds(new Set())} disabled={!selectedIds.size}>
          Clear selection
        </button>
        <button type="button" onClick={handleExportCsv} disabled={!searchResults.length}>
          Export CSV
        </button>
        <button type="button" onClick={handleExportMarkdown} disabled={!searchResults.length}>
          Export Markdown
        </button>
        <span aria-live="polite">Selected: {selectedIds.size || 'none'}</span>
      </div>

      <div className="results">
        <ResultsList
          results={searchResults}
          selectedId={selectedId}
          selectedIds={selectedIds}
          onSelect={setSelectedId}
          onToggleSelected={toggleSelected}
        />
        <ControlDetail control={selectedRecord} />
      </div>

      <footer>
        <div>
          Data source: <a href="https://github.com/BSI-Bund/grundschutz" target="_blank" rel="noreferrer">BSI Grundschutz</a>. Please review upstream licensing before reuse.
        </div>
        <div>Shareable view: copy the URL after adjusting filters; state is encoded in the hash.</div>
      </footer>
    </div>
  );
};

export default App;
