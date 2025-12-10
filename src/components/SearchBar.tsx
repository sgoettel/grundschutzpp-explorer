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
          placeholder="Titel, Prosa, Stichwörter"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="Search controls"
        />
      </label>
      <label className="input-row">
        <span>Group filter</span>
        <select value={groupFilter} onChange={(e) => onGroupChange(e.target.value)} aria-label="Group filter">
          <option value="">All groups</option>
          {groups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </label>
    </div>
    <div className="notice" style={{ marginTop: '0.75rem' }}>
      Keyboard navigation: focus result list and use <kbd>↑</kbd>/<kbd>↓</kbd> to move, <kbd>Enter</kbd> to open.
    </div>
  </div>
);

export default SearchBar;
