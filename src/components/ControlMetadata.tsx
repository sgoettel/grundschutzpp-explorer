import { useId } from 'react';
import type { ControlRecord, ProjectedProp } from '../lib/types';

interface ControlMetadataProps {
  record: ControlRecord;
}

const KNOWN_PROP_LABELS: Record<string, string> = {
  sec_level: 'Sicherheitsniveau',
  modal_verb: 'Modalverb',
  action_word: 'Handlungswort',
  result: 'Ergebnis',
  result_specification: 'Ergebnisspezifikation',
  documentation: 'Dokumentation',
  'alt-identifier': 'Technische Kennung',
  effort_level: 'Aufwandsstufe',
  tags: 'Tags'
};

const sourceLevelLabel = (prop: ProjectedProp): string =>
  prop.sourceLevel === 'part' ? 'Part' : 'Control';

const SourceDetails = ({ prop }: { prop: ProjectedProp }) => (
  <details className="metadata-source-details">
    <summary>Herkunft</summary>
    <dl>
      <dt>Namespace</dt>
      <dd>{prop.namespace ?? '–'}</dd>
      <dt>Ursprungsebene</dt>
      <dd>{sourceLevelLabel(prop)}</dd>
      <dt>Logischer Quellpfad</dt>
      <dd>{prop.sourcePath}</dd>
    </dl>
  </details>
);

const ControlMetadata = ({ record }: ControlMetadataProps) => {
  const headingId = useId();
  const fallbackHeadingId = useId();
  const controlClass = record.control.class?.trim();
  const { known, unknown } = record.metadata;

  if (!controlClass && !known.length && !unknown.length) {
    return null;
  }

  return (
    <section
      aria-labelledby={headingId}
      className="control-metadata metadata-section"
    >
      <h4 id={headingId}>Metadaten</h4>

      {controlClass ? (
        <div className="metadata-item">
          <strong>Technische Klassifikation</strong>
          <span>{controlClass}</span>
        </div>
      ) : null}

      {known.length ? (
        <ul className="metadata-list">
          {known.map((prop, index) => {
            const label =
              (prop.name && KNOWN_PROP_LABELS[prop.name]) ??
              prop.name ??
              'Metadatum';

            return (
              <li key={`${prop.sourcePath}-${prop.name ?? 'prop'}-${index}`}>
                <div className="metadata-item">
                  <strong>{label}</strong>
                  <span>{prop.value ?? '–'}</span>
                </div>
                <SourceDetails prop={prop} />
              </li>
            );
          })}
        </ul>
      ) : null}

      {unknown.length ? (
        <section
          aria-labelledby={fallbackHeadingId}
          className="metadata-fallback metadata-section"
        >
          <h5 id={fallbackHeadingId}>
            Weitere Metadaten (noch nicht fachlich eingeordnet)
          </h5>
          <ul className="metadata-list">
            {unknown.map((prop, index) => (
              <li key={`${prop.sourcePath}-${prop.name ?? 'prop'}-${index}`}>
                <strong>Metadatum</strong>
                <dl>
                  <dt>Name</dt>
                  <dd>{prop.name ?? '–'}</dd>
                  <dt>Wert</dt>
                  <dd>{prop.value ?? '–'}</dd>
                  <dt>Namespace</dt>
                  <dd>{prop.namespace ?? '–'}</dd>
                  <dt>Ursprungsebene</dt>
                  <dd>{sourceLevelLabel(prop)}</dd>
                  <dt>Logischer Quellpfad</dt>
                  <dd>{prop.sourcePath}</dd>
                </dl>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
};

export default ControlMetadata;
