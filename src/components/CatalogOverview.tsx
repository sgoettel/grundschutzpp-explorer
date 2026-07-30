import { useState } from 'react';
import type { PracticeRecord } from '../lib/types';

interface CatalogOverviewProps {
  practices: PracticeRecord[];
  title?: string;
  onSelectPractice: (practiceId: string) => void;
}

const requirementCount = (practice: PracticeRecord): number =>
  new Set([
    ...practice.directControlIds,
    ...practice.topics.flatMap((topic) => topic.controlIds)
  ]).size;

const OverviewColumn = ({
  practices,
  startIndex,
  onSelectPractice,
  expandedPracticeId,
  onToggleDescription
}: {
  practices: PracticeRecord[];
  startIndex: number;
  onSelectPractice: (practiceId: string) => void;
  expandedPracticeId?: string;
  onToggleDescription: (practiceId: string) => void;
}) => (
  <ol className="overview-column" start={startIndex + 1}>
    {practices.map((practice, index) => {
      const isDescriptionOpen = expandedPracticeId === practice.id;

      return (
        <li key={practice.id}>
          <button
            type="button"
            className="overview-row"
            onClick={() => onSelectPractice(practice.id)}
          >
            <span className="overview-number">
              {String(startIndex + index + 1).padStart(2, '0')}
            </span>
            <span className="overview-title">{practice.title}</span>
            <span className="overview-leader" aria-hidden="true" />
            <span className="overview-counts">
              <span className="sr-only">Themen: </span>
              {practice.topics.length}
              <span aria-hidden="true"> · </span>
              <span className="sr-only">Anforderungen: </span>
              {requirementCount(practice)}
            </span>
          </button>
          {practice.description ? (
            <details
              className="overview-description-details"
              open={isDescriptionOpen}
            >
              <summary
                className="overview-description-summary"
                onClick={(event) => {
                  event.preventDefault();
                  onToggleDescription(practice.id);
                }}
              >
                <span
                  className="overview-description-preview"
                  aria-hidden="true"
                >
                  {practice.description}
                </span>
                <span className="disclosure-marker" aria-hidden="true">
                  ›
                </span>
                <span className="overview-description-action">
                  {isDescriptionOpen
                    ? 'Beschreibung schließen'
                    : 'Beschreibung vollständig anzeigen'}
                </span>
              </summary>
              <p className="overview-description-full">
                {practice.description}
              </p>
            </details>
          ) : null}
        </li>
      );
    })}
  </ol>
);

const CatalogOverview = ({
  practices,
  title,
  onSelectPractice
}: CatalogOverviewProps) => {
  const [expandedPracticeId, setExpandedPracticeId] = useState<string>();
  const splitAt = Math.ceil(practices.length / 2);
  const toggleDescription = (practiceId: string) => {
    setExpandedPracticeId((current) =>
      current === practiceId ? undefined : practiceId
    );
  };

  return (
    <section className="catalog-overview" aria-labelledby="overview-heading">
      <h1 id="overview-heading">{title || 'Anwenderkatalog Grundschutz++'}</h1>
      <p className="overview-intro">
        Wählen Sie im Register eine Praktik oder suchen Sie direkt nach einer
        Anforderung. Anforderungen und Umsetzungshinweise erscheinen im Wortlaut
        der BSI-Quelldaten.
      </p>

      <div className="section-heading overview-heading">
        <h2>Inhalt — {practices.length} Praktiken</h2>
        <span>Themen · Anforderungen</span>
      </div>

      <div className="overview-grid">
        <OverviewColumn
          practices={practices.slice(0, splitAt)}
          startIndex={0}
          onSelectPractice={onSelectPractice}
          expandedPracticeId={expandedPracticeId}
          onToggleDescription={toggleDescription}
        />
        <OverviewColumn
          practices={practices.slice(splitAt)}
          startIndex={splitAt}
          onSelectPractice={onSelectPractice}
          expandedPracticeId={expandedPracticeId}
          onToggleDescription={toggleDescription}
        />
      </div>
    </section>
  );
};

export default CatalogOverview;
