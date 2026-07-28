import React from 'react';

interface SearchBarProps {
  query: string;
  groupFilter: string;
  groups: string[];
  onQueryChange: (value: string) => void;
  onGroupChange: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ query, groupFilter, groups, onQueryChange, onGroupChange }) => (
  <div className="panel">
    <div className="search-row">
      <label className="input-row">
        <span>Suche</span>
        <input
          type="search"
          placeholder="ID, Titel, Inhalte, Metadaten"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="Anforderungen durchsuchen"
        />
      </label>
      <label className="input-row">
        <span>Bereich</span>
        <select value={groupFilter} onChange={(e) => onGroupChange(e.target.value)} aria-label="Bereich">
          <option value="">Alle Bereiche</option>
          {groups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </label>
    </div>
    <div className="notice" style={{ marginTop: '0.75rem' }}>
      Tastaturnavigation: Trefferliste fokussieren, mit <kbd>↑</kbd>/
      <kbd>↓</kbd> navigieren und mit <kbd>Enter</kbd> öffnen.
    </div>
  </div>
);

export default SearchBar;
