import React, { useEffect, useRef, useState } from 'react';
import { CatalogControl, ControlRecord } from '../lib/types';
import IdBadge from './IdBadge';

interface ResultsProps {
  results: ControlRecord[];
  selectedId?: string;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggleSelected: (id: string) => void;
}

const PREVIEW_MAX_CHARS = 160;

const normalizePreviewText = (input: string): string =>
  input.replace(/\s+/g, ' ').trim();

const sliceWithEllipsis = (text: string, maxLen: number = PREVIEW_MAX_CHARS): string => {
  const normalized = normalizePreviewText(text);
  if (normalized.length <= maxLen) return normalized;

  const cut = normalized.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  const finalCut = lastSpace > Math.floor(maxLen * 0.6) ? cut.slice(0, lastSpace) : cut;

  return `${finalCut.trimEnd()}…`;
};

const INSERT_PARAM_RX = /\{\{\s*insert:\s*param\s*,\s*([^\s\}]+)\s*\}\}/g;

const buildParamLabelMap = (params?: CatalogControl['params']): Map<string, string> => {
  const map = new Map<string, string>();
  (params ?? []).forEach((p) => {
    if (!p?.id) return;
    const label = p.label === undefined || p.label === null ? '' : String(p.label);
    map.set(p.id, label);
  });
  return map;
};

const resolveParamInsertsPreview = (prose: unknown, control: CatalogControl): string => {
  if (typeof prose !== 'string' || !prose) return '';
  const labelById = buildParamLabelMap(control.params);

  return prose.replace(INSERT_PARAM_RX, (_m, paramId: string) => {
    const label = labelById.get(paramId);
    return label && label.trim().length > 0 ? label : `[${paramId}]`;
  });
};

const pickPrimaryProseForPreview = (control: CatalogControl): unknown => {
  const parts = control.parts ?? [];
  return (
    parts.find((p) => p?.name === 'statement')?.prose ??
    parts.find((p) => p?.name === 'guidance')?.prose ??
    ''
  );
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
                <span style={{ marginLeft: '0.35rem' }}>
                  <IdBadge id={record.id} />
                </span>

                {record.control.class && String(record.control.class) !== 'normal-SdT' && (
                  <span className="badge" style={{ marginLeft: '0.35rem' }}>
                    {String(record.control.class)}
                  </span>
                )}


              </button>
              <div style={{ fontSize: '0.9rem', color: '#475569' }}>{record.groupPath.join(' › ')}</div>
              <div style={{ fontSize: '0.9rem', color: '#334155' }}>
                {sliceWithEllipsis(
                  resolveParamInsertsPreview(pickPrimaryProseForPreview(record.control), record.control) ||
                  record.fullText ||
                  ''
                )}
              </div>


            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ResultsList;
