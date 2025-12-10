import React from 'react';
import { ControlRecord } from '../lib/types';

interface DetailProps {
  control?: ControlRecord;
}

const renderList = (items?: Array<{ name?: string; value?: string; label?: string; prose?: string }>) => {
  if (!items?.length) return null;
  return (
    <ul>
      {items.map((item, idx) => (
        <li key={idx}>{item.value || item.label || item.prose || item.name}</li>
      ))}
    </ul>
  );
};

const ControlDetail: React.FC<DetailProps> = ({ control }) => {
  if (!control) return <div className="detail">Select a control to see details.</div>;

  const { control: raw } = control;
  return (
    <div className="detail" aria-live="polite">
      <h3>
        {control.title} <span className="badge">{control.id}</span>
      </h3>
      {control.groupPath.length > 0 && <div style={{ marginBottom: '0.5rem' }}>Pfad: {control.groupPath.join(' › ')}</div>}
      <p>{control.fullText || 'Keine Prosa gefunden.'}</p>
      {raw.parts?.length ? (
        <section>
          <h4>Parts</h4>
          <ul>
            {raw.parts.map((part, idx) => (
              <li key={idx}>
                <strong>{part.name || part.title}</strong>: {part.prose}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {raw.params?.length ? (
        <section>
          <h4>Parameter</h4>
          {renderList(raw.params)}
        </section>
      ) : null}
      {raw.props?.length ? (
        <section>
          <h4>Properties</h4>
          {renderList(raw.props)}
        </section>
      ) : null}
    </div>
  );
};

export default ControlDetail;
