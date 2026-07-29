import { fireEvent, render, screen } from '@testing-library/react';
import type { SearchHit } from '../lib/search';
import ResultsList from './ResultsList';
import { vi } from 'vitest';

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

  it('moves real focus between result actions with the arrow keys', () => {
    const first: SearchHit = {
      id: 'GS-1',
      title: 'Erste Anforderung',
      groupPath: ['Organisation', 'Regelungen'],
      fullText: 'Erste Anforderung',
      control: {},
      metadata: { known: [], unknown: [] },
      score: 10,
      primaryField: 'title',
      matchedFields: ['title'],
      snippet: 'Erste Anforderung'
    };
    const second: SearchHit = {
      ...first,
      id: 'GS-2',
      title: 'Zweite Anforderung',
      fullText: 'Zweite Anforderung',
      snippet: 'Zweite Anforderung'
    };
    const onSelect = vi.fn();

    render(
      <ResultsList
        results={[first, second]}
        selectedIds={new Set()}
        selectionMode={false}
        onSelect={onSelect}
        onToggleSelected={() => undefined}
      />
    );

    const firstAction = screen.getByRole('button', {
      name: /Erste Anforderung/
    });
    const secondAction = screen.getByRole('button', {
      name: /Zweite Anforderung/
    });
    firstAction.focus();
    fireEvent.keyDown(firstAction, { key: 'ArrowDown' });

    expect(secondAction).toHaveFocus();
    fireEvent.keyDown(secondAction, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('GS-2');
  });
});
