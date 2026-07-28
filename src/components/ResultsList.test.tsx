import { render, screen } from '@testing-library/react';
import type { SearchHit } from '../lib/search';
import ResultsList from './ResultsList';

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: () => undefined
});

describe('ResultsList', () => {
  it('shows the primary and additional hit fields with the matching snippet', () => {
    const hit: SearchHit = {
      id: 'GS-1',
      title: 'Kryptografie einsetzen',
      groupPath: ['Technik', 'Kryptografie'],
      fullText: 'Verschlüsselung mit sicheren Verfahren umsetzen.',
      control: {
        parts: [
          {
            name: 'guidance',
            prose: 'Allgemeiner Umsetzungshinweis.'
          }
        ]
      },
      metadata: { known: [], unknown: [] },
      score: 12,
      primaryField: 'guidance',
      matchedFields: ['guidance', 'metadata'],
      snippet: 'Verschlüsselung mit sicheren Verfahren umsetzen.'
    };

    render(
      <ResultsList
        results={[hit]}
        selectedIds={new Set()}
        onSelect={() => undefined}
        onToggleSelected={() => undefined}
      />
    );

    expect(
      screen.getByText(
        'Treffer in Umsetzungshinweis · außerdem: Metadaten'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('Verschlüsselung mit sicheren Verfahren umsetzen.')
    ).toBeInTheDocument();
  });
});
