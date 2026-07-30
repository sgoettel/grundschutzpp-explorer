import { useEffect, useRef, useState } from 'react';
import type { SearchField, SearchHit } from '../lib/search';
import IdBadge from './IdBadge';

interface ResultsProps {
  results: SearchHit[];
  query?: string;
  selectedId?: string;
  selectedIds: Set<string>;
  selectionMode?: boolean;
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

const HighlightedText = ({
  text,
  query
}: {
  text: string;
  query?: string;
}) => {
  const term = query?.trim();
  if (!term) return <>{text}</>;

  const index = text.toLocaleLowerCase('de').indexOf(
    term.toLocaleLowerCase('de')
  );
  if (index < 0) return <>{text}</>;

  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + term.length)}</mark>
      {text.slice(index + term.length)}
    </>
  );
};

const ResultsList = ({
  results,
  query,
  selectedId,
  selectedIds,
  selectionMode = true,
  onSelect,
  onToggleSelected
}: ResultsProps) => {
  const resultActionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [focusIndex, setFocusIndex] = useState(0);
  const [hasResultFocus, setHasResultFocus] = useState(false);

  useEffect(() => {
    setFocusIndex(0);
    setHasResultFocus(false);
  }, [results]);

  useEffect(() => {
    const node = resultActionRefs.current[focusIndex]?.closest(
      '[data-result]'
    );
    if (typeof node?.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'nearest' });
    }
  }, [focusIndex, results]);

  const moveFocus = (index: number) => {
    setFocusIndex(index);
    resultActionRefs.current[index]?.focus();
  };

  const handleResultKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveFocus(Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveFocus(Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = results[index];
      if (target) onSelect(target.id);
    }
  };

  return (
    <div className="result-list" role="list" aria-label="Suchergebnisse">
      {results.length === 0 ? (
        <p className="empty-results">Keine Treffer</p>
      ) : null}

      {results.map((hit, index) => {
        const isSelected = selectedIds.has(hit.id);
        const isActive =
          selectedId === hit.id ||
          (hasResultFocus && focusIndex === index);

        return (
          <article
            key={hit.id}
            className={`result-item${isActive ? ' is-active' : ''}`}
            data-result
            role="listitem"
          >
            {selectionMode ? (
              <input
                type="checkbox"
                aria-label={`${hit.title} auswählen`}
                checked={isSelected}
                onChange={() => onToggleSelected(hit.id)}
              />
            ) : null}

            <div className="result-content">
              <button
                ref={(node) => {
                  resultActionRefs.current[index] = node;
                }}
                type="button"
                className="result-open"
                onClick={() => onSelect(hit.id)}
                onFocus={() => {
                  setFocusIndex(index);
                  setHasResultFocus(true);
                }}
                onKeyDown={(event) => handleResultKeyDown(event, index)}
                tabIndex={focusIndex === index ? 0 : -1}
                aria-current={selectedId === hit.id ? 'true' : undefined}
              >
                <span className="result-title-line">
                  <IdBadge id={hit.id} />
                  <strong>{hit.title}</strong>
                </span>
                <span className="result-snippet">
                  <HighlightedText text={hit.snippet} query={query} />
                </span>
              </button>

              <p className="result-path">{hit.groupPath.join(' › ')}</p>
              <p className="result-reason">{hitReason(hit)}</p>

              {hit.control.class &&
              String(hit.control.class) !== 'normal-SdT' ? (
                <span className="technical-classification">
                  {String(hit.control.class)}
                </span>
              ) : null}
            </div>
          </article>
        );
      })}

      {results.length ? (
        <p className="keyboard-note">↑ ↓ navigieren, ↵ öffnet.</p>
      ) : null}
    </div>
  );
};

export default ResultsList;
