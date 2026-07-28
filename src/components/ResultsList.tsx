import React, { useEffect, useRef, useState } from 'react';
import type { SearchField, SearchHit } from '../lib/search';
import IdBadge from './IdBadge';

interface ResultsProps {
  results: SearchHit[];
  selectedId?: string;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggleSelected: (id: string) => void;
}

const SEARCH_FIELD_LABELS: Record<SearchField, string> = {
  id: 'ID',
  title: 'Titel',
  path: 'Pfad',
  requirement: 'Anforderung',
  guidance: 'Umsetzungshinweis',
  metadata: 'Metadaten'
};

const hitReason = (hit: SearchHit): string => {
  const additionalFields = hit.matchedFields
    .slice(1)
    .map((field) => SEARCH_FIELD_LABELS[field]);
  const additional = additionalFields.length
    ? ` · außerdem: ${additionalFields.join(', ')}`
    : '';

  return `Treffer in ${SEARCH_FIELD_LABELS[hit.primaryField]}${additional}`;
};

const ResultsList: React.FC<ResultsProps> = ({ results, selectedId, selectedIds, onSelect, onToggleSelected }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(0);

  useEffect(() => {
    setFocusIndex(0);
  }, [results]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!containerRef.current || !containerRef.current.contains(document.activeElement)) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setFocusIndex((idx) => Math.min(idx + 1, results.length - 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setFocusIndex((idx) => Math.max(idx - 1, 0));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const target = results[focusIndex];
        if (target) onSelect(target.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [results, focusIndex, onSelect]);

  useEffect(() => {
    const node = containerRef.current?.querySelectorAll('[data-result]')[focusIndex] as
      | HTMLElement
      | undefined;
    node?.scrollIntoView({ block: 'nearest' });
  }, [focusIndex, results]);

  return (
    <div className="result-list" tabIndex={0} ref={containerRef} aria-label="Search results">
      {results.length === 0 && <div className="notice" style={{ margin: '0.75rem' }}>No results</div>}
      {results.map((hit) => {
        const isSelected = selectedIds.has(hit.id);
        return (
          <div key={hit.id} className="result-item" data-result>
            <input
              type="checkbox"
              aria-label={`Select ${hit.title}`}
              checked={isSelected}
              onChange={() => onToggleSelected(hit.id)}
            />
            <div>
              <button type="button" onClick={() => onSelect(hit.id)} aria-current={selectedId === hit.id}>
                <strong>{hit.title}</strong>
                <span style={{ marginLeft: '0.35rem' }}>
                  <IdBadge id={hit.id} />
                </span>

                {hit.control.class && String(hit.control.class) !== 'normal-SdT' && (
                  <span className="badge" style={{ marginLeft: '0.35rem' }}>
                    {String(hit.control.class)}
                  </span>
                )}


              </button>
              <div style={{ fontSize: '0.9rem', color: '#475569' }}>{hit.groupPath.join(' › ')}</div>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                {hitReason(hit)}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#334155' }}>
                {hit.snippet}
              </div>


            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ResultsList;
