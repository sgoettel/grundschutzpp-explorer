import {
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from '@testing-library/react';
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

const catalogWithMetadata = {
  catalog: {
    ...catalog.catalog,
    metadata: {
      title: 'Anwenderkatalog Grundschutz++',
      version: '2026-07-26',
      'last-modified': '2026-07-26T10:33:02Z',
      'oscal-version': '1.1.3',
      parties: [
        {
          uuid: 'bsi-party',
          type: 'person',
          name: 'Bundesamt für Sicherheit in der Informationstechnik'
        }
      ],
      'responsible-parties': [
        {
          'role-id': 'creator',
          'party-uuids': ['bsi-party']
        }
      ],
      links: [
        {
          href: '#resource-1',
          rel: 'reference',
          text: 'BSI IT-Grundschutz Edition 2023'
        }
      ]
    },
    'back-matter': {
      resources: [
        {
          uuid: 'resource-1',
          title: 'BSI IT-Grundschutz Edition 2023',
          rlinks: [{ href: 'https://www.bsi.bund.de/grundschutz' }]
        }
      ]
    }
  }
};

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

const openCatalogProvenance = (): HTMLElement => {
  const summary = screen.getByText('Herkunftsnachweis');
  const details = summary.closest('details');

  expect(details).not.toBeNull();
  expect(details).not.toHaveAttribute('open');
  fireEvent.click(summary);

  return screen.getByRole('region', { name: 'Herkunftsnachweis' });
};

describe('App catalog navigation', () => {
  it('presents the product and its controls consistently in German', async () => {
    window.location.hash = '#/';
    vi.mocked(loadCatalog).mockResolvedValue(null);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => catalog
      })
    );

    render(<App />);

    await screen.findByRole('button', { name: 'Organisation' });
    expect(
      screen.getByRole('heading', { name: 'Grundschutz++ Explorer' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Referenzansicht des aktuellen Grundschutz++-Katalogs.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('searchbox', { name: 'Anforderungen durchsuchen' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Bereich' })
    ).toHaveDisplayValue('Alle Bereiche');
    expect(
      screen.getByText(/Tastaturnavigation: Trefferliste fokussieren/)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText('Technische Einstellungen'));

    expect(
      screen.getByRole('heading', { name: 'Einstellungen' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Katalog-URL' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Abrufen und aufbereiten' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Cache leeren' })
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Anforderungen durchsuchen' }),
      { target: { value: 'ohne Treffer' } }
    );

    expect(
      screen.getByRole('button', { name: 'Alle Treffer auswählen (0)' })
    ).toBeInTheDocument();
    expect(screen.getByText('Keine Treffer')).toBeInTheDocument();
    expect(
      screen.getByText('Wähle eine Anforderung aus, um Details anzuzeigen.')
    ).toBeInTheDocument();
    expect(screen.getByText(/Datenquelle:/)).toBeInTheDocument();
    expect(screen.getByText(/Ansicht teilen:/)).toBeInTheDocument();
  });

  it('loads the curated BSI catalog automatically when no cache exists', async () => {
    window.location.hash = '#/';
    vi.mocked(loadCatalog).mockResolvedValue(null);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => catalog
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        'https://raw.githubusercontent.com/BSI-Bund/Stand-der-Technik-Bibliothek/main/control_layer/Grundschutz++/Grundschutz++-resolved_catalog.json'
      )
    );
    expect(
      await screen.findByRole('button', { name: 'Organisation' })
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Online-Stand erfolgreich geprüft'
    );
  });

  it('uses the practice hierarchy when the search is empty', async () => {
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
        json: async () => catalog
      })
    );

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Praktiken' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'Organisation' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Alle Treffer auswählen/ })
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

  it('shows the cached catalog while checking the online update', async () => {
    window.location.hash = '#/';
    vi.mocked(loadCatalog).mockResolvedValue({
      url: 'https://example.test/catalog.json',
      fetchedAt: 1,
      payload: catalog
    });
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));

    render(<App />);

    expect(
      await screen.findByRole('button', { name: 'Organisation' })
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Gespeicherter Katalogstand – Aktualisierung wird geprüft'
    );
  });

  it('keeps catalog URL and cache controls outside the primary path', async () => {
    window.location.hash = '#/';
    vi.mocked(loadCatalog).mockResolvedValue(null);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => catalog
      })
    );

    render(<App />);

    expect(
      await screen.findByRole('button', { name: 'Organisation' })
    ).toBeInTheDocument();
    const summary = screen.getByText('Technische Einstellungen');
    const technicalSettings = summary.closest('details');
    expect(technicalSettings).not.toBeNull();
    expect(technicalSettings).not.toHaveAttribute('open');
    expect(
      screen.getByRole('textbox', { name: 'Katalog-URL' })
    ).not.toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Cache leeren' })
    ).not.toBeVisible();

    fireEvent.click(summary);

    expect(technicalSettings).toHaveAttribute('open');
    expect(
      screen.getByRole('textbox', { name: 'Katalog-URL' })
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Cache leeren' })
    ).toBeVisible();
  });

  it('keeps the cached catalog when the online check fails', async () => {
    window.location.hash = '#/';
    vi.mocked(loadCatalog).mockResolvedValue({
      url: 'https://example.test/catalog.json',
      fetchedAt: 1,
      payload: catalog
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        'Gespeicherter Katalogstand – Online-Stand konnte nicht geprüft werden'
      );
    });
    expect(
      screen.getByRole('button', { name: 'Organisation' })
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

    expect(
      await screen.findByText(
        'Der Katalog enthält keine verarbeitbaren Anforderungen.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Online-Katalog konnte nicht zuverlässig verarbeitet werden'
    );
    expect(saveCatalog).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Organisation' })
    ).toBeInTheDocument();
  });

  it('shows the curated catalog provenance', async () => {
    window.location.hash = '#/';
    vi.mocked(loadCatalog).mockResolvedValue(null);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => catalogWithMetadata
      })
    );

    render(<App />);

    const compactProvenance = await screen.findByText(
      'Kuratierte BSI-Quelle · Version 2026-07-26 · Online-Stand erfolgreich geprüft'
    );
    const provenanceDetails = compactProvenance.closest('details');
    expect(provenanceDetails).not.toBeNull();
    expect(provenanceDetails).not.toHaveAttribute('open');
    expect(
      within(provenanceDetails as HTMLElement).getByRole('heading', {
        name: 'Herkunftsnachweis',
        level: 3
      })
    ).toBeVisible();
    expect(
      within(provenanceDetails as HTMLElement).getByText(
        'Anwenderkatalog Grundschutz++'
      )
    ).not.toBeVisible();

    fireEvent.click(screen.getByText('Herkunftsnachweis'));

    const provenance = screen.getByRole('region', {
      name: 'Herkunftsnachweis'
    });
    expect(provenanceDetails).toHaveAttribute('open');
    expect(
      within(provenance).getByText('Kuratierte BSI-Quelle')
    ).toBeInTheDocument();
    expect(
      within(provenance).getByText('Anwenderkatalog Grundschutz++')
    ).toBeInTheDocument();
    expect(
      within(provenance).getByText(
        'Bundesamt für Sicherheit in der Informationstechnik'
      )
    ).toBeInTheDocument();
    expect(
      within(provenance).getByText(
        'control_layer/Grundschutz++/Grundschutz++-resolved_catalog.json'
      )
    ).toBeInTheDocument();
    expect(within(provenance).getByText('Abrufzeit')).toBeInTheDocument();
    expect(
      within(provenance).getByRole('link', { name: 'BSI-Repository' })
    ).toHaveAttribute(
      'href',
      'https://github.com/BSI-Bund/Stand-der-Technik-Bibliothek'
    );
    expect(
      within(provenance).getByRole('link', {
        name: 'BSI IT-Grundschutz Edition 2023'
      })
    ).toHaveAttribute('href', 'https://www.bsi.bund.de/grundschutz');
    expect(
      within(provenance).getByRole('heading', {
        name: 'Aus dem BSI-Repository'
      })
    ).toBeInTheDocument();
    expect(
      within(provenance).getByRole('link', { name: 'CC BY-SA 4.0' })
    ).toHaveAttribute(
      'href',
      'https://github.com/BSI-Bund/Stand-der-Technik-Bibliothek/blob/main/LICENSE'
    );
    expect(
      within(provenance).getByText(
        'Bundesamt für Sicherheit in der Informationstechnik (BSI), Stand-der-Technik-Bibliothek'
      )
    ).toBeInTheDocument();
  });

  it('uses one cache identity and a short hash for legacy curated share URLs', async () => {
    const legacyUrl =
      'https://raw.githubusercontent.com/BSI-Bund/Stand-der-Technik-Bibliothek/refs/heads/main/control_layer/Grundschutz%2B%2B/Grundschutz%2B%2B-resolved_catalog.json';
    const curatedUrl =
      'https://raw.githubusercontent.com/BSI-Bund/Stand-der-Technik-Bibliothek/main/control_layer/Grundschutz++/Grundschutz++-resolved_catalog.json';
    window.location.hash =
      `#/?url=${encodeURIComponent(legacyUrl)}` +
      '&id=ORG.1&practice=practice-organisation&topic=topic-regelungen';
    vi.mocked(loadCatalog).mockResolvedValue(null);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => catalogWithMetadata
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(curatedUrl));
    expect(loadCatalog).toHaveBeenCalledWith(curatedUrl);
    expect(saveCatalog).toHaveBeenCalledWith(curatedUrl, catalogWithMetadata);
    expect(
      within(openCatalogProvenance()).getByText('Kuratierte BSI-Quelle')
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(window.location.hash).toBe(
        '#/?id=ORG.1&practice=practice-organisation&topic=topic-regelungen'
      )
    );
  });

  it('labels and caches a custom source separately', async () => {
    const customUrl = 'https://custom.example/catalog.json';
    window.location.hash =
      '#/?url=https%3A%2F%2Fcustom.example%2Fcatalog.json';
    vi.mocked(loadCatalog).mockResolvedValue(null);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => catalogWithMetadata
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Benutzerdefinierte Quelle erfolgreich geprüft'
      )
    );
    const provenance = openCatalogProvenance();
    expect(
      within(provenance).getByText('Benutzerdefinierte Quelle')
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(customUrl);
    expect(loadCatalog).toHaveBeenCalledWith(customUrl);
    expect(saveCatalog).toHaveBeenCalledWith(customUrl, catalogWithMetadata);
    expect(
      screen.queryByText('Online-Stand erfolgreich geprüft')
    ).not.toBeInTheDocument();
  });

  it('applies an edited custom URL only after the fetch action', async () => {
    const customUrl = 'https://custom.example/catalog.json';
    window.location.hash = '#/';
    vi.mocked(loadCatalog).mockResolvedValue(null);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => catalogWithMetadata
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Online-Stand erfolgreich geprüft'
      )
    );
    fetchMock.mockClear();
    fireEvent.click(screen.getByText('Technische Einstellungen'));

    fireEvent.change(screen.getByRole('textbox', { name: 'Katalog-URL' }), {
      target: { value: customUrl }
    });

    expect(
      screen.getByRole('textbox', { name: 'Katalog-URL' })
    ).toHaveValue(customUrl);
    expect(
      within(openCatalogProvenance()).getByText('Kuratierte BSI-Quelle')
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole('button', { name: 'Abrufen und aufbereiten' })
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(customUrl));
    expect(
      await screen.findByText('Benutzerdefinierte Quelle')
    ).toBeInTheDocument();
  });

  it('normalizes an edited legacy BSI URL in the settings', async () => {
    const legacyUrl =
      'https://raw.githubusercontent.com/BSI-Bund/Stand-der-Technik-Bibliothek/refs/heads/main/control_layer/Grundschutz%2B%2B/Grundschutz%2B%2B-resolved_catalog.json';
    const curatedUrl =
      'https://raw.githubusercontent.com/BSI-Bund/Stand-der-Technik-Bibliothek/main/control_layer/Grundschutz++/Grundschutz++-resolved_catalog.json';
    window.location.hash = '#/';
    vi.mocked(loadCatalog).mockResolvedValue(null);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => catalogWithMetadata
      })
    );

    render(<App />);

    await screen.findByRole('button', { name: 'Organisation' });
    fireEvent.click(screen.getByText('Technische Einstellungen'));
    fireEvent.change(screen.getByRole('textbox', { name: 'Katalog-URL' }), {
      target: { value: legacyUrl }
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Abrufen und aufbereiten' })
    );

    await waitFor(() => expect(saveCatalog).toHaveBeenCalledTimes(2));
    expect(
      screen.getByRole('textbox', { name: 'Katalog-URL' })
    ).toHaveValue(curatedUrl);
    expect(window.location.hash).toBe('#/');
  });

  it('does not present the previous source when a new uncached source fails', async () => {
    const customUrl = 'https://custom.example/unavailable.json';
    window.location.hash = '#/';
    vi.mocked(loadCatalog).mockResolvedValue(null);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => catalogWithMetadata
      })
      .mockRejectedValueOnce(new Error('offline'));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    expect(
      await screen.findByRole('button', { name: 'Organisation' })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText('Technische Einstellungen'));

    fireEvent.change(screen.getByRole('textbox', { name: 'Katalog-URL' }), {
      target: { value: customUrl }
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Abrufen und aufbereiten' })
    );

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Online-Katalog konnte nicht geladen werden'
      )
    );
    expect(
      screen.queryByRole('button', { name: 'Organisation' })
    ).not.toBeInTheDocument();
    expect(
      within(openCatalogProvenance()).queryByText(
        'Anwenderkatalog Grundschutz++'
      )
    ).not.toBeInTheDocument();
  });
});
