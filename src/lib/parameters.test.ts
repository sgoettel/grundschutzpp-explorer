import { resolveParameterInserts } from './parameters';
import type { CatalogParam } from './types';

describe('resolveParameterInserts', () => {
  it('inserts the first parameter value and preserves its source details', () => {
    const parameter: CatalogParam = {
      id: 'p-frist',
      label: 'festgelegte Frist',
      values: ['30 Tage', '60 Tage']
    };

    const result = resolveParameterInserts(
      'Die Frist beträgt {{ insert: param, p-frist }}.',
      [parameter]
    );
    const parameterSegment = result.segments[1];

    expect(result.plainText).toBe('Die Frist beträgt 30 Tage.');
    expect(parameterSegment).toMatchObject({
      kind: 'parameter',
      text: '30 Tage',
      original: '{{ insert: param, p-frist }}',
      parameterId: 'p-frist',
      label: 'festgelegte Frist',
      values: ['30 Tage', '60 Tage'],
      resolved: true
    });
    expect(parameterSegment.kind).toBe('parameter');
    if (parameterSegment.kind === 'parameter') {
      expect(parameterSegment.raw).toBe(parameter);
    }
  });

  it('keeps a missing parameter reference readable and traceable', () => {
    const result = resolveParameterInserts(
      'Wert: {{ insert: param, p-missing }}',
      []
    );

    expect(result.plainText).toBe('Wert: [p-missing]');
    expect(result.segments[1]).toMatchObject({
      kind: 'parameter',
      text: '[p-missing]',
      original: '{{ insert: param, p-missing }}',
      parameterId: 'p-missing',
      values: [],
      resolved: false
    });
  });
});
