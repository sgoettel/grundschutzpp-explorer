import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';
import { loadCatalog } from './lib/storage';

vi.mock('./lib/storage', () => ({
  clearCache: vi.fn(),
  loadCatalog: vi.fn(),
  saveCatalog: vi.fn()
}));

const catalog = {
  catalog: {
    groups: [
      {
        id: 'practice-organisation',
        title: 'Organisation',
        groups: [
          {
            id: 'topic-regelungen',
            title: 'Regelungen',
            controls: [
              {
                id: 'ORG.1',
                title: 'Regelungen festlegen',
                parts: [
                  {
                    name: 'statement',
                    prose: 'Die Organisation legt verbindliche Regelungen fest.'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
};

describe('App catalog navigation', () => {
  it('uses the practice hierarchy when the search is empty', async () => {
    window.location.hash = '#/';
    vi.mocked(loadCatalog).mockResolvedValue({
      url: 'https://example.test/catalog.json',
      fetchedAt: 1,
      payload: catalog
    });

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Praktiken' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Select all filtered/ })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Organisation' }));
    expect(
      screen.getByRole('heading', { name: 'Themen in Organisation' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Regelungen' }));
    expect(
      screen.getByRole('heading', { name: 'Regelungen' })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Regelungen festlegen.*ORG\.1/ })
    );
    expect(
      screen.getByRole('heading', { name: /Regelungen festlegen.*ORG\.1/ })
    ).toBeInTheDocument();
  });
});
