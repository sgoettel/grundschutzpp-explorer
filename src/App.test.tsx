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

const crossPracticeCatalog = {
  catalog: {
    groups: [
      ...catalog.catalog.groups,
      {
        id: 'practice-risiko',
        title: 'Risikomanagement',
        groups: [
          {
            id: 'topic-risiken',
            title: 'Risiken',
            controls: [
              {
                id: 'RISK.1',
                title: 'Risiken behandeln',
                parts: [
                  {
                    name: 'statement',
                    prose: 'Die Organisation behandelt erkannte Risiken.'
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

const duplicateTopicCatalog = {
  catalog: {
    groups: [
      {
        id: 'practice-governance',
        title: 'Governance und Compliance',
        groups: [
          {
            id: 'topic-governance-basics',
            title: 'Grundlagen',
            controls: [
              {
                id: 'GOV.1',
                title: 'Verantwortung festlegen'
              },
              {
                id: 'GOV.2',
                title: 'Vorgaben dokumentieren'
              }
            ]
          }
        ]
      },
      {
        id: 'practice-operations',
        title: 'Sicherer Betrieb',
        groups: [
          {
            id: 'topic-operations-basics',
            title: 'Grundlagen',
            controls: [
              {
                id: 'OPS.1',
                title: 'Abläufe dokumentieren'
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

const openCatalogProvenance = (): HTMLElement => {
  const existingPanel = screen.queryByRole('complementary', {
    name: 'Katalogstand'
  });
  if (existingPanel) return existingPanel;

  fireEvent.click(
    screen.getByRole('button', { name: 'Katalogstand öffnen' })
  );
  return screen.getByRole('complementary', { name: 'Katalogstand' });
};

describe('App catalog navigation', () => {
  it('uses the approved register, search strip, start view, and catalog panel', async () => {
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

    expect(
      await screen.findByRole('navigation', { name: 'Register' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Anwenderkatalog Grundschutz++',
        level: 1
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Katalogstand öffnen' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('complementary', { name: 'Katalogstand' })
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Katalogstand öffnen' })
    );

    const panel = screen.getByRole('complementary', {
      name: 'Katalogstand'
    });
    expect(
      within(panel).getByRole('textbox', { name: 'Katalog-URL' })
    ).toBeInTheDocument();
    expect(
      within(panel).getByRole('button', { name: 'Cache leeren' })
    ).toBeInTheDocument();
    expect(
      within(panel).getByRole('button', { name: 'Katalogstand schließen' })
    ).toBeInTheDocument();
  });

  it('moves focus into transient panels and restores it when they close', async () => {
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
    const navigationTrigger = screen.getByRole('button', {
      name: 'Register öffnen'
    });
    navigationTrigger.focus();
    fireEvent.click(navigationTrigger);

    expect(navigationTrigger).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Zur Ausgangsansicht' })
      ).toHaveFocus()
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(navigationTrigger).toHaveFocus());

    const catalogTrigger = screen.getByRole('button', {
      name: 'Katalogstand öffnen'
    });
    catalogTrigger.focus();
    fireEvent.click(catalogTrigger);
    const closeButton = within(
      screen.getByRole('complementary', { name: 'Katalogstand' })
    ).getByRole('button', { name: 'Katalogstand schließen' });
    await waitFor(() => expect(closeButton).toHaveFocus());

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(catalogTrigger).toHaveFocus());
  });

  it('restores focus only after a narrow overlay releases the workspace', async () => {
    window.location.hash = '#/';
    vi.mocked(loadCatalog).mockResolvedValue(null);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => catalog
      })
    );
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })
    );
    const nativeFocus = HTMLElement.prototype.focus;
    const focusSpy = vi
      .spyOn(HTMLElement.prototype, 'focus')
      .mockImplementation(function (this: HTMLElement) {
        if (this.inert) return;
        for (
          let parent = this.parentElement;
          parent;
          parent = parent.parentElement
        ) {
          if (parent.inert) return;
        }
        nativeFocus.call(this);
      });

    render(<App />);

    await screen.findByRole('button', {
      name: 'Organisation',
      hidden: true
    });
    const navigationTrigger = screen.getByRole('button', {
      name: 'Register öffnen'
    });
    const navigationRail = screen
      .getByRole('navigation', { name: 'Register', hidden: true })
      .closest('aside') as HTMLElement;
    await waitFor(() => expect(navigationRail.inert).toBe(true));

    navigationTrigger.focus();
    fireEvent.click(navigationTrigger);
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Zur Ausgangsansicht' })
      ).toHaveFocus()
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(navigationTrigger).toHaveFocus());
    focusSpy.mockRestore();
  });

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
      screen.getByRole('heading', { name: 'Anwenderkatalog Grundschutz++' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Wählen Sie links eine Praktik oder suchen Sie direkt/
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('searchbox', { name: 'Anforderungen durchsuchen' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Bereich' })
    ).toHaveDisplayValue('Alle Bereiche');
    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Anforderungen durchsuchen' }),
      { target: { value: 'ohne Treffer' } }
    );

    expect(
      screen.getByRole('heading', {
        name: '0 Treffer für „ohne Treffer“'
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Keine Treffer')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Auswählen' }));
    expect(
      screen.getByRole('button', { name: 'Alle Treffer auswählen (0)' })
    ).toBeInTheDocument();

    const panel = openCatalogProvenance();
    expect(
      within(panel).getByRole('button', {
        name: 'Abrufen und aufbereiten'
      })
    ).toBeInTheDocument();
    expect(
      within(panel).getByText(
        'Unabhängiges Community-Projekt, keine offizielle BSI-Anwendung.'
      )
    ).toBeInTheDocument();
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

  it('reconciles the register path when search results cross practices', async () => {
    window.location.hash = '#/';
    vi.mocked(loadCatalog).mockResolvedValue(null);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => crossPracticeCatalog
      })
    );

    render(<App />);

    const searchbox = await screen.findByRole('searchbox', {
      name: 'Anforderungen durchsuchen'
    });
    fireEvent.change(searchbox, { target: { value: 'Regelungen festlegen' } });
    fireEvent.click(
      await screen.findByRole('button', {
        name: /ORG\.1.*Regelungen festlegen/
      })
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Organisation' })
      ).toHaveAttribute('aria-expanded', 'true')
    );

    fireEvent.change(searchbox, { target: { value: 'Risiken behandeln' } });
    await waitFor(() =>
      expect(window.location.hash).toContain('q=Risiken+behandeln')
    );
    const historyLengthBeforeSelection = window.history.length;
    fireEvent.click(
      await screen.findByRole('button', {
        name: /RISK\.1.*Risiken behandeln/
      })
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Risikomanagement' })
      ).toHaveAttribute('aria-expanded', 'true');
      expect(
        screen.getByRole('button', { name: 'Organisation' })
      ).toHaveAttribute('aria-expanded', 'false');
      expect(window.location.hash).toContain('practice=practice-risiko');
      expect(window.location.hash).toContain('topic=topic-risiken');
      expect(window.history.length - historyLengthBeforeSelection).toBe(1);
    });
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
      await screen.findByRole('heading', {
        name: 'Anwenderkatalog Grundschutz++'
      })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'Organisation' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Alle Treffer auswählen/ })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Organisation' }));
    expect(
      screen.getByRole('heading', { name: '1 Anforderungen' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Regelungen' }));
    expect(
      screen.getByRole('button', { name: /Regelungen festlegen.*ORG\.1/ })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Regelungen festlegen.*ORG\.1/ })
    );
    expect(
      screen.getByRole('heading', { name: 'Regelungen festlegen', level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByText('ORG.1')).toBeInTheDocument();
  });

  it('keeps an equally named topic scoped to its selected practice while browsing and searching', async () => {
    window.location.hash = '#/';
    vi.mocked(loadCatalog).mockResolvedValue(null);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => duplicateTopicCatalog
      })
    );

    render(<App />);

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Governance und Compliance'
      })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Grundlagen' }));

    expect(
      screen.getByRole('heading', { name: '2 Anforderungen' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /GOV\.1.*Verantwortung festlegen/
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: /OPS\.1.*Abläufe dokumentieren/
      })
    ).not.toBeInTheDocument();

    fireEvent.change(
      screen.getByRole('searchbox', {
        name: 'Anforderungen durchsuchen'
      }),
      { target: { value: 'dokumentieren' } }
    );

    expect(
      screen.getByRole('heading', {
        name: '1 Treffer für „dokumentieren“'
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /GOV\.2.*Vorgaben dokumentieren/
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: /OPS\.1.*Abläufe dokumentieren/
      })
    ).not.toBeInTheDocument();
  });

  it('clears result selection when the visible result context changes', async () => {
    window.location.hash = '#/';
    vi.mocked(loadCatalog).mockResolvedValue(null);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => duplicateTopicCatalog
      })
    );

    render(<App />);

    const searchbox = await screen.findByRole('searchbox', {
      name: 'Anforderungen durchsuchen'
    });
    fireEvent.change(searchbox, { target: { value: 'dokumentieren' } });
    fireEvent.click(screen.getByRole('button', { name: 'Auswählen' }));
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'Vorgaben dokumentieren auswählen'
      })
    );
    expect(screen.getByText('Ausgewählt: 1')).toBeInTheDocument();

    fireEvent.change(searchbox, { target: { value: 'Verantwortung' } });

    expect(
      screen.getByRole('button', { name: 'Auswählen' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByText(/Ausgewählt:/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Auswählen' }));
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'Verantwortung festlegen auswählen'
      })
    );
    fireEvent.change(screen.getByRole('combobox', { name: 'Bereich' }), {
      target: { value: 'Sicherer Betrieb' }
    });

    expect(
      screen.getByRole('button', { name: 'Auswählen' })
    ).toBeInTheDocument();
    expect(screen.queryByText(/Ausgewählt:/)).not.toBeInTheDocument();
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
    expect(
      screen.queryByRole('textbox', { name: 'Katalog-URL' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cache leeren' })
    ).not.toBeInTheDocument();

    const panel = openCatalogProvenance();

    expect(
      within(panel).getByRole('textbox', { name: 'Katalog-URL' })
    ).toBeVisible();
    expect(
      within(panel).getByRole('button', { name: 'Cache leeren' })
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

    await screen.findByRole('button', { name: 'Organisation' });
    expect(
      screen.queryByRole('complementary', { name: 'Katalogstand' })
    ).not.toBeInTheDocument();

    const provenance = openCatalogProvenance();
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
        name: 'Herkunft'
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
    const panel = openCatalogProvenance();

    fireEvent.change(
      within(panel).getByRole('textbox', { name: 'Katalog-URL' }),
      { target: { value: customUrl } }
    );

    expect(
      within(panel).getByRole('textbox', { name: 'Katalog-URL' })
    ).toHaveValue(customUrl);
    expect(
      within(openCatalogProvenance()).getByText('Kuratierte BSI-Quelle')
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(
      within(panel).getByRole('button', { name: 'Abrufen und aufbereiten' })
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
    const panel = openCatalogProvenance();
    fireEvent.change(
      within(panel).getByRole('textbox', { name: 'Katalog-URL' }),
      { target: { value: legacyUrl } }
    );
    fireEvent.click(
      within(panel).getByRole('button', { name: 'Abrufen und aufbereiten' })
    );

    await waitFor(() => expect(saveCatalog).toHaveBeenCalledTimes(2));
    expect(
      within(panel).getByRole('textbox', { name: 'Katalog-URL' })
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
    const panel = openCatalogProvenance();

    fireEvent.change(
      within(panel).getByRole('textbox', { name: 'Katalog-URL' }),
      { target: { value: customUrl } }
    );
    fireEvent.click(
      within(panel).getByRole('button', { name: 'Abrufen und aufbereiten' })
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
