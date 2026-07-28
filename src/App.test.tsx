import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import App from './App';
import { loadCatalog, saveCatalog } from './lib/storage';

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

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

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

  it('keeps the working cache when an online catalog has no controls', async () => {
    window.location.hash = '#/';
    vi.mocked(loadCatalog).mockResolvedValue({
      url: 'https://example.test/catalog.json',
      fetchedAt: 1,
      payload: catalog
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ catalog: {} })
      })
    );

    render(<App />);

    expect(
      await screen.findByRole('button', { name: 'Organisation' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fetch & Index' }));

    expect(
      await screen.findByText('Catalog parsed but no controls were found.')
    ).toBeInTheDocument();
    expect(saveCatalog).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Organisation' })
    ).toBeInTheDocument();
  });
});
