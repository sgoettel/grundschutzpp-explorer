import React from 'react';
import { CatalogControl, ControlRecord } from '../lib/types';

interface DetailProps {
  control?: ControlRecord;
}

// Map internal OSCAL property names to human-readable labels
const PROP_LABELS: Record<string, string> = {
  'alt-identifier': 'Alt-ID',
  effort_level: 'Aufwandsstufe',
  tags: 'Tags',
  target_objects: 'Zielobjekte',
  documentation: 'Dokumentation',
  ergebnis: 'Ergebnis',
  präzisierung: 'Präzisierung',
  handlungsworte: 'Handlungswort',
  modalverb: 'Modalverb'
};

// Build a readable main text from the prose parts only
const buildMainText = (raw: CatalogControl): string => {
  const proseParts =
    raw.parts
      ?.map((p) => p.prose?.trim())
      .filter((p): p is string => Boolean(p)) ?? [];
  return proseParts.join('\n\n');
};

const renderParams = (params?: CatalogControl['params']) => {
  if (!params?.length) return null;
  return (
    <ul>
      {params.map((param, idx) => (
        <li key={idx}>
          {param.label || param.id || 'Parameter'}
        </li>
      ))}
    </ul>
  );
};

const renderProps = (props?: CatalogControl['props']) => {
  if (!props?.length) return null;
  return (
    <ul>
      {props.map((prop, idx) => {
        const name = prop.name || '';
        const label = PROP_LABELS[name] || name || 'Eigenschaft';
        const value = prop.value ?? '';
        return (
          <li key={idx}>
            <strong>{label}:</strong> {value || '–'}
          </li>
        );
      })}
    </ul>
  );
};

const ControlDetail: React.FC<DetailProps> = ({ control }) => {
  if (!control) return <div className="detail">Select a control to see details.</div>;

  const raw = control.control;
  const mainText = buildMainText(raw);

  return (
    <div className="detail" aria-live="polite">
      <h3>
        {control.title} <span className="badge">{control.id}</span>
      </h3>

      {control.groupPath.length > 0 && (
        <div style={{ marginBottom: '0.5rem' }}>
          Pfad: {control.groupPath.join(' › ')}
        </div>
      )}

      {mainText && <p>{mainText}</p>}

      {raw.parts?.length ? (
        <section>
          <h4>Parts</h4>
          <ul>
            {raw.parts.map((part, idx) => (
              <li key={idx}>
                <strong>{part.name || part.title || 'Part'}:</strong>{' '}
                {part.prose || '–'}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {raw.params?.length ? (
        <section>
          <h4>Parameter</h4>
          {renderParams(raw.params)}
        </section>
      ) : null}

      {raw.props?.length ? (
        <section>
          <h4>Properties</h4>
          {renderProps(raw.props)}
        </section>
      ) : null}
    </div>
  );
};

export default ControlDetail;

