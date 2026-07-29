import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import SearchBar from './SearchBar';

describe('SearchBar', () => {
  it('focuses the central search with slash and clears it with its own action', () => {
    const onQueryChange = vi.fn();

    render(
      <SearchBar
        query="Netzverkehr"
        groupFilter=""
        groups={[]}
        onQueryChange={onQueryChange}
        onGroupChange={() => undefined}
      />
    );

    const searchbox = screen.getByRole('searchbox', {
      name: 'Anforderungen durchsuchen'
    });
    fireEvent.keyDown(window, { key: '/' });
    expect(searchbox).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Suche leeren' }));
    expect(onQueryChange).toHaveBeenCalledWith('');
  });
});
