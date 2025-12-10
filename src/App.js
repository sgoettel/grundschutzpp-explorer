import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
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
const readHash = () => {
    const raw = window.location.hash.replace(/^#\/?/, '');
    const params = new URLSearchParams(raw.startsWith('?') ? raw.slice(1) : raw);
    const result = {};
    params.forEach((value, key) => {
        if (value)
            result[key] = value;
    });
    return result;
};
const writeHash = (state) => {
    const params = new URLSearchParams();
    if (state.url)
        params.set('url', state.url);
    if (state.q)
        params.set('q', state.q);
    if (state.group)
        params.set('group', state.group);
    if (state.id)
        params.set('id', state.id);
    const hash = params.toString();
    window.location.hash = hash ? `/?${hash}` : '#/';
};
const App = () => {
    const initialHash = readHash();
    const [catalogUrl, setCatalogUrl] = useState(initialHash.url || DEFAULT_CATALOG_URL);
    const [query, setQuery] = useState(initialHash.q || '');
    const [groupFilter, setGroupFilter] = useState(initialHash.group || '');
    const [controls, setControls] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(undefined);
    const [searchResults, setSearchResults] = useState([]);
    const [selectedId, setSelectedId] = useState(initialHash.id);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const controlMap = useMemo(() => {
        const map = new Map();
        controls.forEach((c) => map.set(c.id, c));
        return map;
    }, [controls]);
    useEffect(() => {
        const onHashChange = () => {
            const state = readHash();
            if (state.url)
                setCatalogUrl(state.url);
            if (state.q !== undefined)
                setQuery(state.q);
            if (state.group !== undefined)
                setGroupFilter(state.group);
            if (state.id !== undefined)
                setSelectedId(state.id);
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
            .filter((record) => Boolean(record));
        setSearchResults(mapped);
    }, [controls, query, groupFilter, controlMap]);
    const groups = useMemo(() => {
        const allPaths = new Set();
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
            if (!response.ok)
                throw new Error(`Failed to download catalog (${response.status})`);
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
                .filter((record) => Boolean(record));
            setSearchResults(mapped);
        }
        catch (err) {
            const cached = await loadCatalog(catalogUrl);
            if (cached) {
                const parsed = parseCatalog(cached.payload);
                setWarnings(parsed.warnings.concat('Live fetch failed; loaded cached copy.'));
                setControls(parsed.controls);
                setLastUpdated(cached.fetchedAt);
            }
            setError(err instanceof Error ? err.message : 'Unknown error while fetching catalog');
        }
        finally {
            setStatus('');
            setIsFetching(false);
        }
    };
    const toggleSelected = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id))
                next.delete(id);
            else
                next.add(id);
            return next;
        });
    };
    const selectAllVisible = () => {
        setSelectedIds(new Set(searchResults.map((r) => r.id)));
    };
    const recordsForExport = selectedIds.size
        ? searchResults.filter((r) => selectedIds.has(r.id))
        : searchResults;
    const downloadFile = (content, filename, mime) => {
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
    return (_jsxs("div", { className: "app-shell", children: [_jsxs("header", { className: "header", children: [_jsxs("div", { children: [_jsx("h1", { children: "Grundschutz++ OSCAL Explorer" }), _jsx("p", { children: "Fetch, search, and export controls directly in the browser." })] }), _jsx("a", { href: "https://github.com/BSI-Bund/grundschutz", target: "_blank", rel: "noreferrer", children: "Upstream repository" })] }), _jsx(SettingsPanel, { catalogUrl: catalogUrl, onChangeUrl: setCatalogUrl, onFetch: fetchAndIndex, onClearCache: () => clearCache().then(() => setWarnings(['Cache cleared.'])), isFetching: isFetching, lastUpdated: lastUpdated }), status && _jsx(Progress, { label: status }), error && _jsx("div", { className: "notice error", children: error }), warnings.length > 0 && (_jsx("div", { className: "notice", role: "alert", children: warnings.map((w, idx) => (_jsx("div", { children: w }, idx))) })), _jsx(SearchBar, { query: query, groupFilter: groupFilter, groups: groups, onQueryChange: setQuery, onGroupChange: setGroupFilter }), _jsxs("div", { className: "actions", style: { margin: '0.75rem 0' }, children: [_jsxs("button", { type: "button", onClick: selectAllVisible, disabled: !searchResults.length, children: ["Select all filtered (", searchResults.length, ")"] }), _jsx("button", { type: "button", onClick: () => setSelectedIds(new Set()), disabled: !selectedIds.size, children: "Clear selection" }), _jsx("button", { type: "button", onClick: handleExportCsv, disabled: !searchResults.length, children: "Export CSV" }), _jsx("button", { type: "button", onClick: handleExportMarkdown, disabled: !searchResults.length, children: "Export Markdown" }), _jsxs("span", { "aria-live": "polite", children: ["Selected: ", selectedIds.size || 'none'] })] }), _jsxs("div", { className: "results", children: [_jsx(ResultsList, { results: searchResults, selectedId: selectedId, selectedIds: selectedIds, onSelect: setSelectedId, onToggleSelected: toggleSelected }), _jsx(ControlDetail, { control: selectedRecord })] }), _jsxs("footer", { children: [_jsxs("div", { children: ["Data source: ", _jsx("a", { href: "https://github.com/BSI-Bund/grundschutz", target: "_blank", rel: "noreferrer", children: "BSI Grundschutz" }), ". Please review upstream licensing before reuse."] }), _jsx("div", { children: "Shareable view: copy the URL after adjusting filters; state is encoded in the hash." })] })] }));
};
export default App;
