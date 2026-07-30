import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import CatalogOverview from './components/CatalogOverview';
import ControlDetail from './components/ControlDetail';
import PracticeNavigator from './components/PracticeNavigator';
import ResultsList from './components/ResultsList';
import SearchBar from './components/SearchBar';
import SettingsPanel from './components/SettingsPanel';
import {
  canonicalizeCatalogUrl,
  DEFAULT_CATALOG_URL,
  isCuratedCatalogUrl
} from './config';
import { parseCatalog } from './lib/catalog';
import { exportCsv, exportMarkdown } from './lib/exporters';
import { buildIndex } from './lib/search';
import type { SearchHit } from './lib/search';
import { clearCache, loadCatalog, saveCatalog } from './lib/storage';
import type {
  CatalogReference,
  ControlRecord,
  PracticeRecord
} from './lib/types';

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
    lastModified:
      typeof meta['last-modified'] === 'string'
        ? meta['last-modified']
        : undefined,
    oscalVersion:
      typeof meta['oscal-version'] === 'string'
        ? meta['oscal-version']
        : undefined,
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

const TechnicalErrorDetails = ({ message }: { message: string }) => (
  <details className="catalog-error-details">
    <summary>
      <span className="disclosure-marker" aria-hidden="true">
        ▸
      </span>{' '}
      Technische Details
    </summary>
    <code>{message}</code>
  </details>
);

const App = () => {
  const initialHash = readHash();
  const [catalogUrl, setCatalogUrl] = useState(() =>
    canonicalizeCatalogUrl(initialHash.url || DEFAULT_CATALOG_URL)
  );
  const [catalogUrlDraft, setCatalogUrlDraft] = useState(catalogUrl);
  const [query, setQuery] = useState(initialHash.q || '');
  const [groupFilter, setGroupFilter] = useState(initialHash.group || '');
  const [controls, setControls] = useState<ControlRecord[]>([]);
  const [practices, setPractices] = useState<PracticeRecord[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [isFetching, setIsFetching] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number>();
  const [catalogMeta, setCatalogMeta] = useState<CatalogMeta>({});
  const [catalogReferences, setCatalogReferences] = useState<
    CatalogReference[]
  >([]);
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(
    initialHash.id
  );
  const [selectedPracticeId, setSelectedPracticeId] = useState<
    string | undefined
  >(initialHash.practice);
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(
    initialHash.topic
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCatalogPanelOpen, setIsCatalogPanelOpen] = useState(false);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);
  const navigationReturnFocusRef = useRef<HTMLElement | null>(null);
  const panelReturnFocusRef = useRef<HTMLElement | null>(null);
  const navigationRailRef = useRef<HTMLElement | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const isCuratedSource = isCuratedCatalogUrl(catalogUrl);

  const controlMap = useMemo(
    () => new Map(controls.map((control) => [control.id, control])),
    [controls]
  );
  const selectedRecord = useMemo(
    () => controlMap.get(selectedId ?? ''),
    [controlMap, selectedId]
  );
  const selectedTopicControlIds = useMemo(() => {
    if (!groupFilter || !selectedPracticeId || !selectedTopicId) {
      return undefined;
    }

    const practice = practices.find(
      (item) => item.id === selectedPracticeId
    );
    const topic = practice?.topics.find(
      (item) => item.id === selectedTopicId
    );

    return topic ? new Set(topic.controlIds) : undefined;
  }, [groupFilter, practices, selectedPracticeId, selectedTopicId]);

  useEffect(() => {
    const onHashChange = () => {
      const state = readHash();
      const nextCatalogUrl = canonicalizeCatalogUrl(
        state.url || DEFAULT_CATALOG_URL
      );
      setCatalogUrl(nextCatalogUrl);
      setCatalogUrlDraft(nextCatalogUrl);
      setQuery(state.q ?? '');
      setGroupFilter(state.group ?? '');
      setSelectedId(state.id);
      setSelectedPracticeId(state.practice);
      setSelectedTopicId(state.topic);
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    writeHash({
      url: isCuratedSource ? undefined : catalogUrl,
      q: query,
      group: groupFilter,
      id: selectedId,
      practice: selectedPracticeId,
      topic: selectedTopicId
    });
  }, [
    catalogUrl,
    isCuratedSource,
    query,
    groupFilter,
    selectedId,
    selectedPracticeId,
    selectedTopicId
  ]);

  const fetchAndIndex = useCallback(
    async (hasCachedCatalog = false) => {
      let processingStarted = false;
      setIsFetching(true);
      setError(null);
      setErrorDetails(null);
      setWarnings([]);
      setStatus(
        hasCachedCatalog
          ? 'Gespeicherter Katalogstand – Aktualisierung wird geprüft'
          : 'Kein gespeicherter Katalog – Online-Katalog wird geladen'
      );

      try {
        const response = await fetch(catalogUrl);
        if (!response.ok) {
          throw new Error(
            `Katalog konnte nicht abgerufen werden (HTTP ${response.status}).`
          );
        }
        processingStarted = true;
        const payload = await response.json();
        const parsed = parseCatalog(payload);

        if (!parsed.controls.length) {
          throw new Error(
            'Der Katalog enthält keine verarbeitbaren Anforderungen.'
          );
        }

        buildIndex(parsed.controls);
        await saveCatalog(catalogUrl, payload);
        setCatalogMeta(extractCatalogMeta(payload));
        setWarnings(parsed.warnings);
        setControls(parsed.controls);
        setPractices(parsed.practices);
        setCatalogReferences(parsed.references);
        setLastUpdated(Date.now());
        setStatus(
          isCuratedCatalogUrl(catalogUrl)
            ? 'Online-Stand erfolgreich geprüft'
            : 'Benutzerdefinierte Quelle erfolgreich geprüft'
        );
      } catch (caughtError) {
        const cached = await loadCatalog(catalogUrl);
        if (cached) {
          setCatalogMeta(extractCatalogMeta(cached.payload));
          const parsed = parseCatalog(cached.payload);
          setWarnings(
            parsed.warnings.concat(
              'Online-Abruf fehlgeschlagen; gespeicherter Katalogstand wird verwendet.'
            )
          );
          setControls(parsed.controls);
          setPractices(parsed.practices);
          setCatalogReferences(parsed.references);
          setLastUpdated(cached.fetchedAt);
        }
        setStatus(
          processingStarted
            ? 'Online-Katalog konnte nicht zuverlässig verarbeitet werden'
            : cached
              ? 'Gespeicherter Katalogstand – Online-Stand konnte nicht geprüft werden'
              : 'Online-Katalog konnte nicht geladen werden'
        );
        setErrorDetails(
          caughtError instanceof Error
            ? caughtError.message
            : 'Unbekannter Fehler beim Abrufen des Katalogs'
        );
        setError(
          cached
            ? processingStarted
              ? 'Der Online-Katalog konnte nicht zuverlässig verarbeitet werden. Der gespeicherte Katalogstand bleibt verfügbar.'
              : 'Der Online-Stand konnte nicht geprüft werden. Der gespeicherte Katalogstand bleibt verfügbar.'
            : processingStarted
              ? 'Der Online-Katalog konnte nicht zuverlässig verarbeitet werden. Prüfe die Katalogquelle und versuche es erneut.'
              : 'Der Online-Katalog konnte nicht geladen werden. Prüfe die Verbindung oder die Katalogquelle und versuche es erneut.'
        );
      } finally {
        setIsFetching(false);
      }
    },
    [catalogUrl]
  );

  useEffect(() => {
    const restoreFromCache = async () => {
      setIsFetching(true);
      setError(null);
      setErrorDetails(null);
      setCatalogMeta({});
      setCatalogReferences([]);
      setLastUpdated(undefined);
      setControls([]);
      setPractices([]);
      setWarnings([]);
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      const cached = await loadCatalog(catalogUrl);
      if (cached) {
        setLastUpdated(cached.fetchedAt);
        setCatalogMeta(extractCatalogMeta(cached.payload));
        const parsed = parseCatalog(cached.payload);
        setWarnings(parsed.warnings);
        setControls(parsed.controls);
        setPractices(parsed.practices);
        setCatalogReferences(parsed.references);
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
    const results = runQuery(
      query,
      groupFilter ? { group: groupFilter } : undefined
    );
    setSearchResults(
      selectedTopicControlIds
        ? results.filter((result) => selectedTopicControlIds.has(result.id))
        : results
    );
  }, [controls, groupFilter, query, selectedTopicControlIds]);

  useEffect(() => {
    if (!selectedRecord) return;
    const [practiceTitle, topicTitle] = selectedRecord.groupPath;
    const practice = practices.find((item) => item.title === practiceTitle);
    const topic = practice?.topics.find((item) => item.title === topicTitle);
    if (selectedPracticeId !== practice?.id) {
      setSelectedPracticeId(practice?.id);
    }
    if (selectedTopicId !== topic?.id) {
      setSelectedTopicId(topic?.id);
    }
  }, [
    practices,
    selectedPracticeId,
    selectedRecord,
    selectedTopicId
  ]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(max-width: 1023px)');
    const syncViewport = () => setIsNarrowViewport(media.matches);
    syncViewport();
    media.addEventListener('change', syncViewport);
    return () => media.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => {
    if (isNavigationOpen) {
      document
        .querySelector<HTMLElement>('#practice-register button')
        ?.focus();
      return;
    }
    navigationReturnFocusRef.current?.focus();
    navigationReturnFocusRef.current = null;
  }, [isNavigationOpen]);

  useEffect(() => {
    if (isCatalogPanelOpen) {
      document
        .querySelector<HTMLElement>(
          '#catalog-panel [aria-label="Katalogstand schließen"]'
        )
        ?.focus();
      return;
    }
    panelReturnFocusRef.current?.focus();
    panelReturnFocusRef.current = null;
  }, [isCatalogPanelOpen]);

  useLayoutEffect(() => {
    if (navigationRailRef.current) {
      navigationRailRef.current.inert =
        isNarrowViewport && (!isNavigationOpen || isCatalogPanelOpen);
    }
    if (workspaceRef.current) {
      workspaceRef.current.inert =
        isNarrowViewport && (isNavigationOpen || isCatalogPanelOpen);
    }
  }, [isCatalogPanelOpen, isNarrowViewport, isNavigationOpen]);

  useEffect(() => {
    const closeTransientPanels = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsCatalogPanelOpen(false);
      setIsNavigationOpen(false);
    };
    window.addEventListener('keydown', closeTransientPanels);
    return () => window.removeEventListener('keydown', closeTransientPanels);
  }, []);

  const groups = useMemo(() => {
    const allPaths = new Set<string>();
    controls.forEach((control) =>
      control.groupPath.forEach((path) => allPaths.add(path))
    );
    return Array.from(allPaths).sort();
  }, [controls]);

  const toggleSelected = (id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds(new Set(searchResults.map((result) => result.id)));
  };

  const resetResultSelection = () => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const recordsForExport = selectedIds.size
    ? searchResults.filter((result) => selectedIds.has(result.id))
    : searchResults;

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(href);
  };

  const handleExportCsv = () => {
    downloadFile(
      exportCsv(recordsForExport),
      'grundschutz-controls.csv',
      'text/csv;charset=utf-8'
    );
  };

  const handleExportMarkdown = () => {
    downloadFile(
      exportMarkdown(recordsForExport),
      'grundschutz-controls.md',
      'text/markdown'
    );
  };

  const handleQueryChange = (value: string) => {
    resetResultSelection();
    setQuery(value);
    setSelectedId(undefined);
    if (!value.trim() && !groupFilter) {
      setSelectedPracticeId(undefined);
      setSelectedTopicId(undefined);
    }
  };

  const handleGroupChange = (value: string) => {
    resetResultSelection();
    setGroupFilter(value);
    setSelectedId(undefined);
    if (!value) {
      setSelectedPracticeId(undefined);
      setSelectedTopicId(undefined);
      return;
    }

    const practice = practices.find((item) => item.title === value);
    const topicMatch = practices
      .flatMap((item) =>
        item.topics.map((topic) => ({ practice: item, topic }))
      )
      .find(({ topic }) => topic.title === value);
    setSelectedPracticeId(practice?.id ?? topicMatch?.practice.id);
    setSelectedTopicId(topicMatch?.topic.id);
  };

  const handleSelectPractice = (practiceId: string) => {
    resetResultSelection();
    const practice = practices.find((item) => item.id === practiceId);
    setSelectedPracticeId(practiceId);
    setSelectedTopicId(undefined);
    setSelectedId(undefined);
    setGroupFilter(practice?.title ?? '');
    setIsNavigationOpen(false);
  };

  const handleSelectTopic = (practiceId: string, topicId: string) => {
    resetResultSelection();
    const practice = practices.find((item) => item.id === practiceId);
    const topic = practice?.topics.find((item) => item.id === topicId);
    setSelectedPracticeId(practiceId);
    setSelectedTopicId(topicId);
    setSelectedId(undefined);
    setGroupFilter(topic?.title ?? practice?.title ?? '');
    setIsNavigationOpen(false);
  };

  const handleSelectControl = (controlId: string) => {
    resetResultSelection();
    const control = controlMap.get(controlId);
    const [practiceTitle, topicTitle] = control?.groupPath ?? [];
    const practice = practices.find((item) => item.title === practiceTitle);
    const topic = practice?.topics.find((item) => item.title === topicTitle);
    setSelectedId(controlId);
    setSelectedPracticeId(practice?.id);
    setSelectedTopicId(topic?.id);
    setIsNavigationOpen(false);
  };

  const handleToggleNavigation = () => {
    if (!isNavigationOpen) {
      navigationReturnFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    }
    setIsNavigationOpen((current) => !current);
  };

  const handleOpenCatalogPanel = () => {
    if (!isCatalogPanelOpen) {
      panelReturnFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    }
    setIsCatalogPanelOpen(true);
  };

  const handleToggleCatalogPanel = () => {
    if (isCatalogPanelOpen) {
      setIsCatalogPanelOpen(false);
      return;
    }
    handleOpenCatalogPanel();
  };

  const handleNavigateHome = () => {
    resetResultSelection();
    setQuery('');
    setGroupFilter('');
    setSelectedId(undefined);
    setSelectedPracticeId(undefined);
    setSelectedTopicId(undefined);
    setIsNavigationOpen(false);
  };

  const resetCatalogContext = () => {
    resetResultSelection();
    setQuery('');
    setGroupFilter('');
    setSelectedId(undefined);
    setSelectedPracticeId(undefined);
    setSelectedTopicId(undefined);
  };

  const handleCatalogFetch = () => {
    const nextUrl = canonicalizeCatalogUrl(catalogUrlDraft);
    setCatalogUrlDraft(nextUrl);
    if (nextUrl && nextUrl !== catalogUrl) {
      resetCatalogContext();
      setIsFetching(true);
      setCatalogUrl(nextUrl);
      return;
    }
    void fetchAndIndex(Boolean(lastUpdated));
  };

  const isSearchMode = Boolean(query.trim() || groupFilter);
  const isInitialCatalogLoading = isFetching && !controls.length;
  const hasCatalogLoadError =
    Boolean(error) && !controls.length && !isFetching;
  const resultHeading = query.trim()
    ? `${searchResults.length} Treffer für „${query.trim()}“`
    : `${searchResults.length} Anforderungen`;

  return (
    <div
      className={`explorer-shell${isCatalogPanelOpen ? ' is-panel-open' : ''}`}
    >
      <aside
        ref={navigationRailRef}
        id="practice-register"
        className={`navigation-rail${isNavigationOpen ? ' is-open' : ''}`}
        aria-hidden={
          isNarrowViewport && (!isNavigationOpen || isCatalogPanelOpen)
            ? true
            : undefined
        }
      >
        <PracticeNavigator
          practices={practices}
          controls={controls}
          selectedPracticeId={selectedPracticeId}
          selectedTopicId={selectedTopicId}
          selectedControlId={selectedId}
          onSelectPractice={handleSelectPractice}
          onSelectTopic={handleSelectTopic}
          onSelectControl={handleSelectControl}
          onNavigateHome={handleNavigateHome}
        />
      </aside>

      {isNavigationOpen ? (
        <button
          type="button"
          className="navigation-backdrop"
          onClick={() => setIsNavigationOpen(false)}
          aria-label="Register schließen"
        />
      ) : null}

      <div
        ref={workspaceRef}
        className="workspace"
        aria-hidden={
          isNarrowViewport && (isNavigationOpen || isCatalogPanelOpen)
            ? true
            : undefined
        }
      >
        <SearchBar
          query={query}
          groupFilter={groupFilter}
          groups={groups}
          onQueryChange={handleQueryChange}
          onGroupChange={handleGroupChange}
          catalogStatus={status}
          isFetching={isFetching}
          isCatalogPanelOpen={isCatalogPanelOpen}
          isNavigationOpen={isNavigationOpen}
          onToggleCatalogPanel={handleToggleCatalogPanel}
          onToggleNavigation={handleToggleNavigation}
        />

        <div className="status-messages">
          {status ? (
            <div role="status" aria-live="polite">
              {status}
            </div>
          ) : null}
          {error && controls.length ? (
            <div className="error-message">
              <p>{error}</p>
              {errorDetails ? (
                <TechnicalErrorDetails message={errorDetails} />
              ) : null}
            </div>
          ) : null}
          {warnings.length ? (
            <div className="warning-message" role="alert">
              {warnings.map((warning, index) => (
                <div key={`${warning}-${index}`}>{warning}</div>
              ))}
            </div>
          ) : null}
        </div>

        <main
          className={`main-content${selectedRecord ? ' detail-view' : ''}${isSearchMode && !selectedRecord ? ' search-view' : ''}`}
        >
          {isInitialCatalogLoading ? (
            <section
              className="catalog-state catalog-loading-state"
              aria-labelledby="catalog-loading-heading"
            >
              <h1 id="catalog-loading-heading">Katalog wird geladen</h1>
              <p>
                Der Katalog wird vorbereitet. Anforderungen und Praktiken
                erscheinen, sobald die Quelle verfügbar ist.
              </p>
            </section>
          ) : hasCatalogLoadError ? (
            <section
              className="catalog-state catalog-error-state"
              aria-labelledby="catalog-error-heading"
            >
              <h1 id="catalog-error-heading">
                Katalog konnte nicht geladen werden
              </h1>
              <p>{error}</p>
              {errorDetails ? (
                <TechnicalErrorDetails message={errorDetails} />
              ) : null}
            </section>
          ) : selectedRecord ? (
            <ControlDetail control={selectedRecord} />
          ) : isSearchMode ? (
            <section
              className="search-results-view"
              aria-labelledby="results-heading"
            >
              <div className="results-heading">
                <h1 id="results-heading">{resultHeading}</h1>
                {groupFilter ? (
                  <button
                    type="button"
                    className="active-filter"
                    onClick={() => handleGroupChange('')}
                    aria-label={`Bereichsfilter ${groupFilter} entfernen`}
                  >
                    in {groupFilter} ✕
                  </button>
                ) : null}
                <div className="result-actions">
                  <button
                    type="button"
                    className="text-action"
                    onClick={() =>
                      setIsSelectionMode((current) => {
                        if (current) setSelectedIds(new Set());
                        return !current;
                      })
                    }
                  >
                    {isSelectionMode ? 'Auswahl beenden' : 'Auswählen'}
                  </button>
                  <button
                    type="button"
                    className="text-action"
                    onClick={handleOpenCatalogPanel}
                  >
                    Exportieren
                  </button>
                </div>
              </div>

              {isSelectionMode ? (
                <div className="selection-actions">
                  <button
                    type="button"
                    onClick={selectAllVisible}
                    disabled={!searchResults.length}
                  >
                    Alle Treffer auswählen ({searchResults.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    disabled={!selectedIds.size}
                  >
                    Auswahl aufheben
                  </button>
                  <span aria-live="polite">
                    Ausgewählt: {selectedIds.size || 'keine'}
                  </span>
                </div>
              ) : null}

              <ResultsList
                results={searchResults}
                query={query}
                selectedId={selectedId}
                selectedIds={selectedIds}
                selectionMode={isSelectionMode}
                onSelect={handleSelectControl}
                onToggleSelected={toggleSelected}
              />
            </section>
          ) : (
            <CatalogOverview
              practices={practices}
              title={catalogMeta.title}
              onSelectPractice={handleSelectPractice}
            />
          )}
        </main>
      </div>

      {isCatalogPanelOpen ? (
        <SettingsPanel
          catalogUrl={catalogUrlDraft}
          activeCatalogUrl={catalogUrl}
          onChangeUrl={setCatalogUrlDraft}
          onFetch={handleCatalogFetch}
          onClearCache={() =>
            clearCache()
              .then(() => setWarnings(['Cache wurde geleert.']))
              .catch((caughtError) =>
                setWarnings([
                  caughtError instanceof Error &&
                  caughtError.message.includes('blocked')
                    ? 'Cache konnte nicht vollständig geleert werden. Bitte andere Explorer-Tabs schließen und erneut versuchen.'
                    : 'Cache konnte nicht vollständig geleert werden. Bitte erneut versuchen.'
                ])
              )
          }
          onClose={() => setIsCatalogPanelOpen(false)}
          onExportCsv={handleExportCsv}
          onExportMarkdown={handleExportMarkdown}
          exportDisabled={!searchResults.length}
          isFetching={isFetching}
          lastUpdated={lastUpdated}
          catalogMeta={catalogMeta}
          catalogReferences={catalogReferences}
          catalogStatus={status}
          isCuratedSource={isCuratedSource}
          requirementCount={controls.length}
        />
      ) : null}
    </div>
  );
};

export default App;
