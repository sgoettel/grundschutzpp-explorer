import { useEffect, useRef } from 'react';

interface SearchBarProps {
  query: string;
  groupFilter: string;
  groups: string[];
  onQueryChange: (value: string) => void;
  onGroupChange: (value: string) => void;
  catalogStatus?: string;
  isFetching?: boolean;
  isCatalogPanelOpen?: boolean;
  isNavigationOpen?: boolean;
  onToggleCatalogPanel?: () => void;
  onToggleNavigation?: () => void;
}

const SearchBar = ({
  query,
  groupFilter,
  groups,
  onQueryChange,
  onGroupChange,
  catalogStatus,
  isFetching = false,
  isCatalogPanelOpen = false,
  isNavigationOpen = false,
  onToggleCatalogPanel,
  onToggleNavigation
}: SearchBarProps) => {
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;

      if (event.key === '/' && !isEditing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  const compactStatus = isFetching
    ? catalogStatus?.startsWith('Gespeicherter Katalogstand')
      ? 'Aktualisierung wird geprüft'
      : 'Katalog wird geladen'
    : catalogStatus?.includes('erfolgreich geprüft')
      ? 'Katalog geprüft'
      : catalogStatus || 'Katalog wird vorbereitet';

  return (
    <header className="search-strip">
      <button
        type="button"
        className="navigation-toggle"
        onClick={onToggleNavigation}
        aria-label={isNavigationOpen ? 'Register schließen' : 'Register öffnen'}
        aria-expanded={isNavigationOpen}
        aria-controls="practice-register"
      >
        ☰
      </button>

      <form
        className="search-form"
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <span className="search-icon" aria-hidden="true">
          ⌕
        </span>
        <input
          ref={searchRef}
          type="search"
          placeholder="Anforderung, ID oder Begriff suchen"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          aria-label="Anforderungen durchsuchen"
        />
        {query ? (
          <button
            type="button"
            className="search-clear"
            onClick={() => onQueryChange('')}
            aria-label="Suche leeren"
          >
            ✕
          </button>
        ) : (
          <kbd className="search-shortcut" aria-label="Taste Schrägstrich">
            /
          </kbd>
        )}
      </form>

      <label className="scope-select">
        <span>Bereich</span>
        <select
          value={groupFilter}
          onChange={(event) => onGroupChange(event.target.value)}
          aria-label="Bereich"
        >
          <option value="">Alle Bereiche</option>
          {groups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </label>

      <div className="catalog-strip-status" aria-live="polite">
        <span
          className={`status-dot${catalogStatus?.includes('erfolgreich geprüft') ? ' is-ok' : ''}`}
          aria-hidden="true"
        />
        <span>{compactStatus}</span>
      </div>

      <button
        type="button"
        className={`text-action catalog-panel-trigger${isCatalogPanelOpen ? ' is-active' : ''}`}
        onClick={onToggleCatalogPanel}
        aria-expanded={isCatalogPanelOpen}
        aria-controls="catalog-panel"
        aria-label={
          isCatalogPanelOpen ? 'Katalogstand schließen' : 'Katalogstand öffnen'
        }
      >
        Katalogstand
      </button>
    </header>
  );
};

export default SearchBar;
