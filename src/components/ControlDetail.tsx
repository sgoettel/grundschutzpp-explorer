import React from 'react';
import { CatalogControl, ControlRecord } from '../lib/types';

interface DetailProps {
  control?: ControlRecord;
}

const PROP_LABELS: Record<string, string> = {
  'alt-identifier': 'Alt-ID',
  effort_level: 'Aufwandsstufe',
  tags: 'Tags',
  target_objects: 'Zielobjekte',
  documentation: 'Dokumentation',
  ergebnis: 'Ergebnis',
  präzisierung: 'Präzisierung',
  handlungsworte: 'Handlungswort',
  modalverb: 'Modalverb',
};

// Properties (Metadaten) mit Labels rendern
const renderProps = (props?: CatalogControl['props']) => {
  if (!props?.length) return null;
  return (
    <ul>
      {props.map((prop, idx) => {
        const key = prop.name ?? '';
        const label = (PROP_LABELS[key] ?? key) || 'Eigenschaft';
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

// Parameter mit Label anzeigen (Details können wir später noch ausbauen)
const renderParams = (params?: CatalogControl['params']) => {
  if (!params?.length) return null;
  return (
    <ul>
      {params.map((param) => (
        <li key={param.id}>
          <strong>{param.label || 'Parameter'}:</strong> {param.id}
        </li>
      ))}
    </ul>
  );
};

const ControlDetail: React.FC<DetailProps> = ({ control }) => {
  if (!control) {
    return <div className="detail">Select a control to see details.</div>;
  }

  const raw = control.control;

  const parts = raw.parts ?? [];
  const statement = parts.find((p) => p.name === 'statement');
  const guidance = parts.find((p) => p.name === 'guidance');
  const otherParts = parts.filter(
    (p) => p !== statement && p !== guidance
  );

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

      {statement?.prose && (
        <section>
          <h4>Statement</h4>
          <p>{statement.prose}</p>
        </section>
      )}

      {guidance?.prose && (
        <section>
          <h4>Guidance</h4>
          <p>{guidance.prose}</p>
        </section>
      )}

      {otherParts.length > 0 && (
        <section>
          <h4>Weitere Teile</h4>
          <ul>
            {otherParts.map((part) => (
              <li key={part.id}>
                <strong>{part.name || part.title || 'Part'}:</strong>{' '}
                {part.prose || '–'}
              </li>
            ))}
          </ul>
        </section>
      )}

      {raw.params?.length ? (
        <section>
          <h4>Parameter</h4>
          {renderParams(raw.params)}
        </section>
      ) : null}

      {raw.props?.length ? (
        <section>
          <h4>Eigenschaften</h4>
          {renderProps(raw.props)}
        </section>
      ) : null}
    </div>
  );
};

export default ControlDetail;

