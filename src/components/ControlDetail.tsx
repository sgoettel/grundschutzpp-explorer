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
      kind && hasOwnContent
        ? [{ kind, part } satisfies FachlichContentPart]
        : [];

    return [...current, ...collectFachlichContent(part.parts, kind)];
  }) ?? [];

const RelationshipList = ({
  heading,
  relationships
}: {
  heading: string;
  relationships: ControlRelationship[];
}) => (
  <div className="relationship-group">
    <h5>{heading}</h5>
    <ul>
      {relationships.map((relationship, index) => (
        <li key={`${relationship.kind}-${relationship.targetId}-${index}`}>
          <span>
            {relationship.targetTitle ? (
              <>
                {relationship.targetTitle}{' '}
                <IdBadge id={relationship.targetId} />
              </>
            ) : (
              <IdBadge id={relationship.targetId} />
            )}
          </span>
          <details className="metadata-source-details">
            <summary>
              <span className="disclosure-marker" aria-hidden="true">
                ›
              </span>
              <span>Herkunft</span>
            </summary>
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

const ControlDetail = ({ control }: DetailProps) => {
  if (!control) {
    return (
      <p className="empty-detail">
        Wähle eine Anforderung aus, um Details anzuzeigen.
      </p>
    );
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
  const securityLevel = control.metadata.known.find(
    (prop) => prop.name === 'sec_level'
  )?.value;

  return (
    <article className="control-detail">
      {control.groupPath.length ? (
        <nav className="breadcrumb" aria-label="Navigationspfad">
          {[...control.groupPath, control.title].map((segment, index) => (
            <span key={`${segment}-${index}`}>
              {index ? <span aria-hidden="true"> › </span> : null}
              {segment}
            </span>
          ))}
        </nav>
      ) : null}

      <div className="detail-heading">
        <div>
          <h1>{control.title}</h1>
          <div className="control-identity">
            <IdBadge id={control.id} />
            {securityLevel ? <span>{securityLevel}</span> : null}
          </div>
        </div>
        {control.metadata.known.length || control.metadata.unknown.length ? (
          <a className="text-action detail-origin" href="#merkmale">
            Herkunft
          </a>
        ) : null}
      </div>

      {statements.length ? (
        <section className="prose-section requirement-section">
          <h2 className="section-label">Anforderung</h2>
          {statements.map(({ part }, index) => (
            <div
              className="fachlich-content-part"
              key={part.id ?? `statement-${index}`}
            >
              {part.title ? <h3>{part.title}</h3> : null}
              <ResolvedProse prose={part.prose} params={raw.params} />
            </div>
          ))}
        </section>
      ) : null}

      {guidance.length ? (
        <section className="prose-section guidance-section">
          <h2 className="section-label">Umsetzungshinweis</h2>
          {guidance.map(({ part }, index) => (
            <div
              className="fachlich-content-part"
              key={part.id ?? `guidance-${index}`}
            >
              {part.title ? <h3>{part.title}</h3> : null}
              <ResolvedProse prose={part.prose} params={raw.params} />
            </div>
          ))}
        </section>
      ) : null}

      <ControlMetadata record={control} />

      {otherParts.length ? (
        <section className="additional-section">
          <h2 className="section-label">Weitere Inhalte</h2>
          <ul className="additional-content-list">
            {otherParts.map((part, index) => (
              <li key={part.id ?? `${control.id}-part-${index}`}>
                <strong>{part.name || part.title || 'Inhalt'}:</strong>{' '}
                {part.prose ? (
                  <ResolvedProse prose={part.prose} params={raw.params} />
                ) : (
                  '–'
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {control.relationships?.length ? (
        <section className="relationships-section" aria-label="Beziehungen">
          <h2 className="section-label">Beziehungen</h2>
          <p className="source-note">
            BSI-Quelldaten · vom Explorer aufgelöst
          </p>
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
    </article>
  );
};

export default ControlDetail;
