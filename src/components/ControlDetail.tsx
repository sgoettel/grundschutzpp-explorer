import React from 'react';
import { CatalogControl, ControlRecord } from '../lib/types';
import IdBadge from './IdBadge';

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

const EFFORT_SHORT: Record<string, string> = {
  '0': 'zwingend/nicht bewertet',
  '1': 'Quick Win (z.B. selber Tag)',
  '2': 'i.d.R. ≤ 1 Woche',
  '3': 'Wochen–Monate',
  '4': 'längerfristig/Experten',
  '5': 'komplex/Planung',
};

const getPropValue = (control: CatalogControl, name: string): string | undefined => {
  const value = control.props?.find((prop) => prop?.name === name)?.value;
  if (value === undefined || value === null) return undefined;
  return typeof value === 'string' ? value : String(value);
};

const splitTags = (raw?: string | null) =>
  raw?.split(',').map((tag) => tag.trim()).filter(Boolean) ?? [];

// --- A) Resolve OSCAL prose inserts (currently only insert:param) ---
const INSERT_PARAM_RX = /\{\{\s*insert:\s*param\s*,\s*([^\s\}]+)\s*\}\}/g;

const buildParamLabelMap = (params?: CatalogControl['params']): Map<string, string> => {
  const map = new Map<string, string>();
  (params ?? []).forEach((p) => {
    if (!p?.id) return;
    const label = p.label === undefined || p.label === null ? '' : String(p.label);
    map.set(p.id, label);
  });
  return map;
};

const resolveParamInserts = (
  prose: unknown,
  paramLabelById: Map<string, string>,
  usedParamIds: Set<string>
): string => {
  if (typeof prose !== 'string' || !prose) return '';

  return prose.replace(INSERT_PARAM_RX, (_m, paramId: string) => {
    usedParamIds.add(paramId);
    const label = paramLabelById.get(paramId);
    // Keep it readable: use label when available, otherwise show the param id.
    return label && label.trim().length > 0 ? label : `[${paramId}]`;
  });
};


// Properties (Metadaten) mit Labels rendern
const renderProps = (props?: CatalogControl['props']) => {
  if (!props?.length) return null;
  const hidden = new Set(['alt-identifier', 'effort_level', 'tags']);
  const visibleProps = props.filter((prop) => prop?.name && !hidden.has(prop.name));
  if (!visibleProps.length) return null;

  return (
    <ul>
      {visibleProps.map((prop, idx) => {
        const key = prop.name ?? '';
        const label = (PROP_LABELS[key] ?? key) || 'Eigenschaft';
        const rawValue = prop.value;
        const value = rawValue === undefined || rawValue === null ? '–' : String(rawValue);
        return (
          <li key={idx}>
            <strong>{label}:</strong> {value}
          </li>
        );
      })}
    </ul>
  );
};

// Show only placeholders that are actually used via {{ insert: param, ... }}.
// Keep param ids hidden behind a native <details> toggle
const renderParams = (
  params: CatalogControl['params'] | undefined,
  usedParamIds: Set<string>
) => {
  if (!params?.length) return null;

  const visible = params.filter(
    (p): p is NonNullable<typeof p> & { id: string } => {
      const id = p?.id;
      return typeof id === 'string' && usedParamIds.has(id);
    }
  );


  if (!visible.length) return null;


  return (
    <ul>
      {visible.map((param) => {
        const label = param.label === undefined || param.label === null
          ? ''
          : String(param.label).trim();
        const shownLabel = label.length > 0 ? label : (param.id ?? '—');

        return (
          <li key={param.id}>
            <strong>{shownLabel}</strong>{' '}
            <span style={{ opacity: 0.75 }}>(Platzhalter)</span>

            <details style={{ display: 'inline-block', marginLeft: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', opacity: 0.75 }}>
                technische Details
              </summary>
              <div style={{ marginTop: '0.25rem' }}>
                <span style={{ opacity: 0.8 }}>Param-ID:</span>{' '}
                <code>{param.id}</code>{' '}
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(String(param.id))}
                  style={{ marginLeft: '0.5rem' }}
                >
                  Copy
                </button>
              </div>
            </details>
          </li>
        );
      })}
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
  const otherParts = parts.filter((p) => p !== statement && p !== guidance);

  const altIdentifier = getPropValue(raw, 'alt-identifier');
  const tags = splitTags(getPropValue(raw, 'tags'));
  const effortValue = getPropValue(raw, 'effort_level');
  const effortLegend = effortValue ? EFFORT_SHORT[effortValue] ?? 'unbekannt' : undefined;

  // --- B) Use resolved prose for display ---
  // Track which params are actually referenced via {{ insert: param, ... }}
  const usedParamIds = new Set<string>();
  const paramLabelById = buildParamLabelMap(raw.params);

  // Resolve prose once (so we don't "use" params multiple times during render)
  const statementText = resolveParamInserts(statement?.prose, paramLabelById, usedParamIds);
  const guidanceText = resolveParamInserts(guidance?.prose, paramLabelById, usedParamIds);

  const otherPartItems = otherParts.map((part) => ({
    part,
    prose: resolveParamInserts(part.prose, paramLabelById, usedParamIds),
  }));

  const paramsBlock = renderParams(raw.params, usedParamIds);


  // --- C) Avoid empty "Eigenschaften" section ---
  const propsList = renderProps(raw.props);

  return (
    <div className="detail" aria-live="polite">
      <h3>
        {control.title} <IdBadge id={control.id} />
      </h3>


      {tags.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.25rem',
            marginBottom: '0.25rem',
          }}
        >
          {tags.map((tag) => (
            <span className="badge" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {(altIdentifier || effortValue) && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            marginBottom: '0.5rem',
          }}
        >
          {altIdentifier ? (
            <div style={{ opacity: 0.8, fontSize: '0.9em' }}>
              <strong>GUID:</strong> <code>{altIdentifier}</code>
            </div>
          ) : null}
          {effortValue ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.95em',
              }}
            >
              <span className="badge">Aufwandsstufe {effortValue}</span>
              <span style={{ opacity: 0.85 }}>{effortLegend}</span>
            </div>
          ) : null}
        </div>
      )}

      {control.groupPath.length > 0 && (
        <div style={{ marginBottom: '0.5rem' }}>
          Pfad: {control.groupPath.join(' › ')}
        </div>
      )}

      {statementText && (
        <section>
          <h4>Statement</h4>
          <p>{statementText}</p>
        </section>
      )}

      {guidanceText && (
        <section>
          <h4>Guidance</h4>
          <p>{guidanceText}</p>
        </section>
      )}

      {otherPartItems.length > 0 && (
        <section>
          <h4>Weitere Teile</h4>
          <ul>
            {otherPartItems.map(({ part, prose }, idx) => (
              <li key={part.id ?? `${control.id}-part-${idx}`}>
                <strong>{part.name || part.title || 'Part'}:</strong>{' '}
                {prose || '–'}
              </li>
            ))}
          </ul>
        </section>
      )}



      {paramsBlock ? (
        <section>
          <h4>Platzhalter</h4>
          <div style={{ opacity: 0.8, marginBottom: '0.25rem' }}>
            müssen organisationsspezifisch konkretisiert werden
          </div>
          {paramsBlock}
        </section>
      ) : null}


      {propsList ? (
        <section>
          <h4>Eigenschaften</h4>
          {propsList}
        </section>
      ) : null}
    </div>
  );
};

export default ControlDetail;

