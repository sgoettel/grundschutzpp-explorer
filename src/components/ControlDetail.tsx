import React, { useId } from 'react';
import type {
  CatalogPart,
  ControlRecord,
  ControlRelationship
} from '../lib/types';
import ControlMetadata from './ControlMetadata';
import IdBadge from './IdBadge';
import ResolvedProse from './ResolvedProse';

interface DetailProps {
  control?: ControlRecord;
}

type FachlichContentKind = 'statement' | 'guidance';

interface FachlichContentPart {
  kind: FachlichContentKind;
  part: CatalogPart;
}

const collectFachlichContent = (
  parts: CatalogPart[] | undefined,
  inheritedKind?: FachlichContentKind
): FachlichContentPart[] =>
  parts?.flatMap((part) => {
    const kind =
      part.name === 'statement'
        ? 'statement'
        : part.name === 'guidance'
          ? 'guidance'
          : inheritedKind;
    const hasOwnContent = Boolean(
      (typeof part.prose === 'string' && part.prose.length) ||
        part.title?.trim()
    );
    const current =
      kind && hasOwnContent ? [{ kind, part } satisfies FachlichContentPart] : [];

    return [...current, ...collectFachlichContent(part.parts, kind)];
  }) ?? [];

const RelationshipList = ({
  heading,
  relationships
}: {
  heading: string;
  relationships: ControlRelationship[];
}) => (
  <div>
    <h5>{heading}</h5>
    <ul>
      {relationships.map((relationship, index) => (
        <li key={`${relationship.kind}-${relationship.targetId}-${index}`}>
          {relationship.targetTitle ? (
            <>
              {relationship.targetTitle} <IdBadge id={relationship.targetId} />
            </>
          ) : (
            <IdBadge id={relationship.targetId} />
          )}
          <details className="metadata-source-details">
            <summary>Herkunft</summary>
            <dl>
              <dt>Beziehungsart</dt>
              <dd>{relationship.kind}</dd>
              <dt>Logischer Quellpfad</dt>
              <dd>{relationship.sourcePath}</dd>
            </dl>
          </details>
        </li>
      ))}
    </ul>
  </div>
);

const ControlDetail: React.FC<DetailProps> = ({ control }) => {
  const relationshipsHeadingId = useId();

  if (!control) {
    return <div className="detail">Select a control to see details.</div>;
  }

  const raw = control.control;

  const parts = raw.parts ?? [];
  const fachlichContent = collectFachlichContent(parts);
  const statements = fachlichContent.filter(
    (content) => content.kind === 'statement'
  );
  const guidance = fachlichContent.filter(
    (content) => content.kind === 'guidance'
  );
  const otherParts = parts.filter(
    (part) => part.name !== 'statement' && part.name !== 'guidance'
  );
  const requiredRelationships =
    control.relationships?.filter(
      (relationship) => relationship.kind === 'required'
    ) ?? [];
  const relatedRelationships =
    control.relationships?.filter(
      (relationship) => relationship.kind === 'related'
    ) ?? [];

  return (
    <div className="detail" aria-live="polite">
      <h3>
        {control.title} <IdBadge id={control.id} />
      </h3>


      {control.groupPath.length > 0 && (
        <nav aria-label="Breadcrumb" style={{ margin: '0.25rem 0 0.5rem', opacity: 0.75 }}>
          {control.groupPath.join(' › ')}
        </nav>
      )}

      {statements.length > 0 && (
        <section>
          <h4>Anforderung</h4>
          {statements.map(({ part }, index) => (
            <div
              className="fachlich-content-part"
              key={part.id ?? `statement-${index}`}
            >
              {part.title ? <h5>{part.title}</h5> : null}
              <ResolvedProse prose={part.prose} params={raw.params} />
            </div>
          ))}
        </section>
      )}

      {guidance.length > 0 && (
        <section>
          <h4>Umsetzungshinweis</h4>
          {guidance.map(({ part }, index) => (
            <div
              className="fachlich-content-part"
              key={part.id ?? `guidance-${index}`}
            >
              {part.title ? <h5>{part.title}</h5> : null}
              <ResolvedProse prose={part.prose} params={raw.params} />
            </div>
          ))}
        </section>
      )}

      {otherParts.length > 0 && (
        <section>
          <h4>Weitere Inhalte</h4>
          <ul>
            {otherParts.map((part, idx) => (
              <li key={part.id ?? `${control.id}-part-${idx}`}>
                <strong>{part.name || part.title || 'Part'}:</strong>{' '}
                {part.prose ? (
                  <ResolvedProse prose={part.prose} params={raw.params} />
                ) : (
                  '–'
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <ControlMetadata record={control} />

      {control.relationships?.length ? (
        <section
          aria-labelledby={relationshipsHeadingId}
          className="metadata-section"
        >
          <div className="header">
            <h4 id={relationshipsHeadingId}>Beziehungen</h4>
            <span className="badge">
              BSI-Quelldaten · vom Explorer aufgelöst
            </span>
          </div>
          {requiredRelationships.length ? (
            <RelationshipList
              heading="Erforderliche Anforderungen"
              relationships={requiredRelationships}
            />
          ) : null}
          {relatedRelationships.length ? (
            <RelationshipList
              heading="Verwandte Anforderungen"
              relationships={relatedRelationships}
            />
          ) : null}
        </section>
      ) : null}
    </div>
  );
};

export default ControlDetail;
