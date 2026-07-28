import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SettingsPanel from './components/SettingsPanel';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import ControlDetail from './components/ControlDetail';
import PracticeNavigator from './components/PracticeNavigator';
import Progress from './components/Progress';
import { DEFAULT_CATALOG_URL } from './config';
import { buildIndex } from './lib/search';
import type { SearchHit } from './lib/search';
import { parseCatalog } from './lib/catalog';
import { exportCsv, exportMarkdown } from './lib/exporters';
import { clearCache, loadCatalog, saveCatalog } from './lib/storage';
import type { ControlRecord, PracticeRecord } from './lib/types';

interface HashState {
  url?: string;
  q?: string;
  group?: string;
  id?: string;
  practice?: string;
  topic?: string;
}

type CatalogMeta = {
  title?: string;
  version?: string;
  lastModified?: string;
  oscalVersion?: string;
  publisher?: string;
};

const recordsFrom = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === 'object'
      )
    : [];

const extractCatalogMeta = (payload: unknown): CatalogMeta => {
  const root = payload as {
    catalog?: { metadata?: Record<string, unknown> };
    metadata?: Record<string, unknown>;
  } | null;

  // Support both shapes:
  // 1) { catalog: { metadata: ... } }
  // 2) { metadata: ... }  (falls irgendwo schon "catalog" direkt gecached/übergeben wird)
  const catalog = root?.catalog ?? root;
  const meta = catalog?.metadata;

  if (!meta || typeof meta !== 'object') return {};

  const creatorPartyIds = new Set(
    recordsFrom(meta['responsible-parties'])
      .filter((responsibleParty) => responsibleParty['role-id'] === 'creator')
      .flatMap((responsibleParty) =>
        Array.isArray(responsibleParty['party-uuids'])
          ? responsibleParty['party-uuids'].filter(
              (uuid): uuid is string => typeof uuid === 'string'
            )
          : []
      )
  );
  const publisher = recordsFrom(meta.parties).find(
    (party) =>
      typeof party.uuid === 'string' && creatorPartyIds.has(party.uuid)
  )?.name;

  return {
    title: typeof meta.title === 'string' ? meta.title : undefined,
    version: typeof meta.version === 'string' ? meta.version : undefined,
    lastModified: typeof meta['last-modified'] === 'string' ? meta['last-modified'] : undefined,
    oscalVersion: typeof meta['oscal-version'] === 'string' ? meta['oscal-version'] : undefined,
    publisher: typeof publisher === 'string' ? publisher : undefined
  };
};



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
  if (state.practice) params.set('practice', state.practice);
  if (state.topic) params.set('topic', state.topic);
  const hash = params.toString();
  window.location.hash = hash ? `/?${hash}` : '#/';
};

const App: React.FC = () => {
  const initialHash = readHash();
  const [catalogUrl, setCatalogUrl] = useState(initialHash.url || DEFAULT_CATALOG_URL);
  const [catalogUrlDraft, setCatalogUrlDraft] = useState(catalogUrl);
  const [query, setQuery] = useState(initialHash.q || '');
  const [groupFilter, setGroupFilter] = useState(initialHash.group || '');
  const [controls, setControls] = useState<ControlRecord[]>([]);
  const [practices, setPractices] = useState<PracticeRecord[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [isFetching, setIsFetching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | undefined>(undefined);
  const [catalogMeta, setCatalogMeta] = useState<CatalogMeta>({});
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(initialHash.id);
  const [selectedPracticeId, setSelectedPracticeId] = useState<
    string | undefined
  >(initialHash.practice);
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(
    initialHash.topic
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const controlMap = useMemo(() => {
    const map = new Map<string, ControlRecord>();
    controls.forEach((c) => map.set(c.id, c));
    return map;
  }, [controls]);

  useEffect(() => {
    const onHashChange = () => {
      const state = readHash();
      if (state.url) {
        setCatalogUrl(state.url);
        setCatalogUrlDraft(state.url);
      }
      setQuery(state.q ?? '');
      setGroupFilter(state.group ?? '');
      setSelectedId(state.id);
      setSelectedPracticeId(state.practice);
      setSelectedTopicId(state.topic);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    writeHash({
      url: catalogUrl,
      q: query,
      group: groupFilter,
      id: selectedId,
      practice: selectedPracticeId,
      topic: selectedTopicId
    });
  }, [
    catalogUrl,
    query,
    groupFilter,
    selectedId,
    selectedPracticeId,
    selectedTopicId
  ]);

  const fetchAndIndex = useCallback(async (hasCachedCatalog = false) => {
    let processingStarted = false;
    setIsFetching(true);
    setError(null);
    setWarnings([]);
    setStatus(
      hasCachedCatalog
        ? 'Gespeicherter Katalogstand – Aktualisierung wird geprüft'
        : 'Kein gespeicherter Katalog – Online-Katalog wird geladen'
    );
    try {
      const response = await fetch(catalogUrl);
      if (!response.ok) {
        throw new Error(`Failed to download catalog (${response.status})`);
      }
      processingStarted = true;
      const payload = await response.json();

      const parsed = parseCatalog(payload);
      if (!parsed.controls.length) {
        throw new Error('Catalog parsed but no controls were found.');
      }
      buildIndex(parsed.controls);

      await saveCatalog(catalogUrl, payload);
      setCatalogMeta(extractCatalogMeta(payload));
      setWarnings(parsed.warnings);
      setControls(parsed.controls);
      setPractices(parsed.practices);
      setLastUpdated(Date.now());
      setStatus(
        catalogUrl === DEFAULT_CATALOG_URL
          ? 'Online-Stand erfolgreich geprüft'
          : 'Benutzerdefinierte Quelle erfolgreich geprüft'
      );
    } catch (err) {
      const cached = await loadCatalog(catalogUrl);
      if (cached) {
        setCatalogMeta(extractCatalogMeta(cached.payload));
        const parsed = parseCatalog(cached.payload);
        setWarnings(
          parsed.warnings.concat('Live fetch failed; loaded cached copy.')
        );
        setControls(parsed.controls);
        setPractices(parsed.practices);
        setLastUpdated(cached.fetchedAt);
      }
      setStatus(
        processingStarted
          ? 'Online-Katalog konnte nicht zuverlässig verarbeitet werden'
          : cached
            ? 'Gespeicherter Katalogstand – Online-Stand konnte nicht geprüft werden'
            : 'Online-Katalog konnte nicht geladen werden'
      );
      setError(
        err instanceof Error ? err.message : 'Unknown error while fetching catalog'
      );
    } finally {
      setIsFetching(false);
    }
  }, [catalogUrl]);

  useEffect(() => {
    const restoreFromCache = async () => {
      setCatalogMeta({});
      setLastUpdated(undefined);
      const cached = await loadCatalog(catalogUrl);
      if (cached) {
        setLastUpdated(cached.fetchedAt);
        setCatalogMeta(extractCatalogMeta(cached.payload));
        const parsed = parseCatalog(cached.payload);
        setWarnings(parsed.warnings);
        setControls(parsed.controls);
        setPractices(parsed.practices);
      }
      await fetchAndIndex(Boolean(cached));
    };
    void restoreFromCache();
  }, [catalogUrl, fetchAndIndex]);


  useEffect(() => {
    if (!controls.length) {
      setSearchResults([]);
      return;
    }


    const { query: runQuery } = buildIndex(controls);
    const results = runQuery(query, groupFilter ? { group: groupFilter } : undefined);
    setSearchResults(results);
  }, [controls, query, groupFilter]);


  const groups = useMemo(() => {
    const allPaths = new Set<string>();
    controls.forEach((c) => c.groupPath.forEach((p) => allPaths.add(p)));
    return Array.from(allPaths).sort();
  }, [controls]);

  const selectedRecord = useMemo(() => controlMap.get(selectedId ?? ''), [controlMap, selectedId]);

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

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setSelectedPracticeId(undefined);
      setSelectedTopicId(undefined);
    }
  };

  const handleSelectPractice = (practiceId: string) => {
    setSelectedPracticeId(practiceId || undefined);
    setSelectedTopicId(undefined);
  };

  const handleSelectTopic = (practiceId: string, topicId: string) => {
    setSelectedPracticeId(practiceId);
    setSelectedTopicId(topicId || undefined);
  };

  const handleCatalogFetch = () => {
    const nextUrl = catalogUrlDraft.trim();
    if (nextUrl && nextUrl !== catalogUrl) {
      setCatalogUrl(nextUrl);
      return;
    }
    void fetchAndIndex(Boolean(lastUpdated));
  };

  const isSearchMode = Boolean(query.trim() || groupFilter);

  return (
    <div className="app-shell">
        <header className="header">
          <div>
            <h1>Grundschutz++ OSCAL Explorer</h1>
            <p>Fetch, search, and export controls directly in the browser.</p>
          </div>
        </header>


      <SettingsPanel
        catalogUrl={catalogUrlDraft}
        activeCatalogUrl={catalogUrl}
        onChangeUrl={setCatalogUrlDraft}
        onFetch={handleCatalogFetch}
        onClearCache={() =>
          clearCache()
            .then(() => setWarnings(['Cache cleared.']))
            .catch((err) =>
              setWarnings([
                err instanceof Error && err.message.includes('blocked')
                  ? 'Cache not fully cleared (blocked). Close other tabs and try again.'
                  : 'Cache could not be fully cleared. Please try again.',
              ])
            )
        }
        isFetching={isFetching}
        lastUpdated={lastUpdated}
        catalogMeta={catalogMeta}
        catalogStatus={status}
        isCuratedSource={catalogUrl === DEFAULT_CATALOG_URL}
      />


      {status &&
        (isFetching ? (
          <Progress label={status} />
        ) : (
          <div className="notice" role="status" aria-live="polite">
            {status}
          </div>
        ))}
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
        onQueryChange={handleQueryChange}
        onGroupChange={setGroupFilter}
      />

      {isSearchMode ? (
        <>
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
        </>
      ) : (
        <div className={`results${selectedRecord ? '' : ' single-column'}`}>
          <PracticeNavigator
            practices={practices}
            controls={controls}
            selectedPracticeId={selectedPracticeId}
            selectedTopicId={selectedTopicId}
            onSelectPractice={handleSelectPractice}
            onSelectTopic={handleSelectTopic}
            onSelectControl={setSelectedId}
          />
          {selectedRecord ? <ControlDetail control={selectedRecord} /> : null}
        </div>
      )}

        <footer>
          <div>
            Data source:{' '}
            <a
              href="https://github.com/BSI-Bund/Stand-der-Technik-Bibliothek"
              target="_blank"
              rel="noreferrer"
            >
              BSI "Stand der Technik Bibliothek" (Grundschutz++ Kompendium)
            </a>
            . Please review BSI licensing before reuse.
          </div>
          <div>
            Shareable view: copy the URL after adjusting filters; state is encoded in the hash.
          </div>
        </footer>


    </div>
  );
};

export default App;
