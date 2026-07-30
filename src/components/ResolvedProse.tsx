import { Fragment } from 'react';
import type { CatalogParam } from '../lib/types';
import { resolveParameterInserts } from '../lib/parameters';

interface ResolvedProseProps {
  prose: unknown;
  params?: CatalogParam[];
}

const ResolvedProse = ({ prose, params }: ResolvedProseProps) => {
  const resolved = resolveParameterInserts(prose, params);

  if (!resolved.segments.length) {
    return null;
  }

  return (
    <div className="resolved-prose">
      {resolved.segments.map((segment, index) => {
        if (segment.kind === 'text') {
          return <Fragment key={`text-${index}`}>{segment.text}</Fragment>;
        }

        return (
          <Fragment key={`parameter-${index}`}>
            <mark className="parameter-value">{segment.text}</mark>
            <details className="parameter-details">
              <summary aria-label={`Parameterdetails zu ${segment.parameterId}`}>
                <span className="disclosure-marker" aria-hidden="true">
                  ›
                </span>
                <span>Parameterdetails</span>
              </summary>
              <dl>
                <dt>Ursprüngliche OSCAL-Anweisung</dt>
                <dd>
                  <code>{segment.original}</code>
                </dd>
                <dt>Parameter-ID</dt>
                <dd>
                  <code>{segment.parameterId}</code>
                </dd>
                <dt>Label</dt>
                <dd>{segment.label ?? '–'}</dd>
                <dt>Values</dt>
                <dd>
                  {segment.values.length ? (
                    <ul>
                      {segment.values.map((value, valueIndex) => (
                        <li key={`${segment.parameterId}-${valueIndex}`}>
                          {value}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    '–'
                  )}
                </dd>
              </dl>
            </details>
          </Fragment>
        );
      })}
    </div>
  );
};

export default ResolvedProse;
