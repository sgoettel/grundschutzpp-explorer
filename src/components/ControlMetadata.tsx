import { useId } from 'react';
import { metadataLabel } from '../lib/metadata';
import type { ControlRecord, ProjectedProp } from '../lib/types';

interface ControlMetadataProps {
  record: ControlRecord;
}

const sourceLevelLabel = (prop: ProjectedProp): string =>
  prop.sourceLevel === 'part' ? 'Part' : 'Control';

const isCompactMetadataValue = (value: string): boolean => {
  const normalized = value.trim();

  if (!normalized || normalized.length > 40) {
    return false;
  }

  return (
    normalized === '–' ||
    /^[+-]?\d+(?:[.,]\d+)?(?:\s*%)?$/.test(normalized) ||
    /^[A-ZÄÖÜ0-9]+$/u.test(normalized) ||
    /^[A-ZÄÖÜ]{1,6}\s\d+(?:\.\d+)+$/u.test(normalized) ||
    /^[\p{L}\p{N}]+(?:[._:/+-][\p{L}\p{N}]+)+$/u.test(normalized)
  );
};

const DisclosureMarker = () => (
  <span className="disclosure-marker" aria-hidden="true">
    ›
  </span>
);

const SourceDetails = ({ prop }: { prop: ProjectedProp }) => (
  <details className="metadata-source-details">
    <summary>
      <DisclosureMarker />
      <span>Herkunft</span>
    </summary>
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
  const fallbackHeadingId = useId();
  const controlClass = record.control.class?.trim();
  const { known, unknown } = record.metadata;

  if (!controlClass && !known.length && !unknown.length) {
    return null;
  }

  return (
    <section
      aria-label="Metadaten"
      id="merkmale"
      className="control-metadata metadata-section"
    >
      <h4 className="section-label">Merkmale</h4>

      {controlClass ? (
        <div className="metadata-item technical-metadata">
          <strong>Technische Klassifikation</strong>
          <span>{controlClass}</span>
        </div>
      ) : null}

      {known.length ? (
        <ul className="metadata-list">
          {known.map((prop, index) => {
            const label = metadataLabel(prop.name);
            const value = prop.value ?? '–';

            return (
              <li key={`${prop.sourcePath}-${prop.name ?? 'prop'}-${index}`}>
                <div className="metadata-item">
                  <strong>{label}</strong>
                  <span
                    className={`metadata-value ${
                      isCompactMetadataValue(value)
                        ? 'is-compact'
                        : 'is-textual'
                    }`}
                  >
                    {value}
                  </span>
                </div>
                <SourceDetails prop={prop} />
              </li>
            );
          })}
        </ul>
      ) : null}

      {unknown.length ? (
        <details className="metadata-fallback metadata-section">
          <summary>
            <DisclosureMarker />
            <span id={fallbackHeadingId} role="heading" aria-level={5}>
              Weitere Metadaten (noch nicht fachlich eingeordnet)
            </span>
          </summary>
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
        </details>
      ) : null}
    </section>
  );
};

export default ControlMetadata;
