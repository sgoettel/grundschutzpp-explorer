import React, { useEffect, useRef, useState } from 'react';
import { ControlRecord } from '../lib/types';

interface ResultsProps {
  results: ControlRecord[];
  selectedId?: string;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggleSelected: (id: string) => void;
}

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
      {results.map((record) => {
        const isSelected = selectedIds.has(record.id);
        return (
          <div key={record.id} className="result-item" data-result>
            <input
              type="checkbox"
              aria-label={`Select ${record.title}`}
              checked={isSelected}
              onChange={() => onToggleSelected(record.id)}
            />
            <div>
              <button type="button" onClick={() => onSelect(record.id)} aria-current={selectedId === record.id}>
                <strong>{record.title}</strong>
                <div className="badge" style={{ marginLeft: '0.35rem' }}>{record.id}</div>
              </button>
              <div style={{ fontSize: '0.9rem', color: '#475569' }}>{record.groupPath.join(' › ')}</div>
              <div style={{ fontSize: '0.9rem', color: '#334155' }}>{record.fullText.slice(0, 160)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ResultsList;
