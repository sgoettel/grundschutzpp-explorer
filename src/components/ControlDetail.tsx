import React from 'react';
import { ControlRecord } from '../lib/types';
import ControlMetadata from './ControlMetadata';
import IdBadge from './IdBadge';
import ResolvedProse from './ResolvedProse';

interface DetailProps {
  control?: ControlRecord;
}

const ControlDetail: React.FC<DetailProps> = ({ control }) => {
  if (!control) {
    return <div className="detail">Select a control to see details.</div>;
  }

  const raw = control.control;

  const parts = raw.parts ?? [];
  const statement = parts.find((p) => p.name === 'statement');
  const guidance = parts.find((p) => p.name === 'guidance');
  const otherParts = parts.filter((p) => p !== statement && p !== guidance);

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

      {statement?.prose && (
        <section>
          <h4>Anforderung</h4>
          <ResolvedProse prose={statement.prose} params={raw.params} />
        </section>
      )}

      {guidance?.prose && (
        <section>
          <h4>Umsetzungshinweis</h4>
          <ResolvedProse prose={guidance.prose} params={raw.params} />
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
    </div>
  );
};

export default ControlDetail;
