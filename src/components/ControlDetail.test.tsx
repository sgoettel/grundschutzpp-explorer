import { render, screen, within } from '@testing-library/react';
import type { ControlRecord } from '../lib/types';
import ControlDetail from './ControlDetail';

describe('ControlDetail', () => {
  it('renders resolved parameter values with traceable source details', () => {
    const record: ControlRecord = {
      id: 'APP.1',
      title: 'Fristen festlegen',
      groupPath: ['Organisation', 'Regelungen'],
      fullText: '',
      control: {
        params: [
          {
            id: 'p-frist',
            label: 'festgelegte Frist',
            values: ['30 Tage', '60 Tage']
          }
        ],
        parts: [
          {
            name: 'statement',
            prose: 'Die Frist beträgt {{ insert: param, p-frist }}.'
          }
        ]
      },
      metadata: { known: [], unknown: [] }
    };

    render(<ControlDetail control={record} />);

    expect(
      screen.getByText('30 Tage', { selector: 'mark' })
    ).toHaveClass('parameter-value');
    expect(
      screen.getByText('{{ insert: param, p-frist }}')
    ).toBeInTheDocument();
    expect(screen.getByText('p-frist')).toBeInTheDocument();
    expect(screen.getByText('festgelegte Frist')).toBeInTheDocument();
    expect(screen.getByText('60 Tage')).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Breadcrumb' })
    ).toHaveTextContent(
      'Organisation › Regelungen › Fristen festlegen'
    );
    expect(
      screen.queryByRole('heading', { name: 'Konkretisierungen' })
    ).not.toBeInTheDocument();
  });

  it('separates technical classification and exposes projected metadata', () => {
    const record: ControlRecord = {
      id: 'APP.2',
      title: 'Metadaten prüfen',
      groupPath: ['Organisation', 'Regelungen'],
      fullText: '',
      control: { class: 'normal-SdT' },
      metadata: {
        known: [
          {
            name: 'sec_level',
            value: 'Basis',
            namespace: 'https://bsi.bund.de/ns/grundschutz-plusplus',
            sourceLevel: 'control',
            sourcePath: 'Control → Prop',
            raw: { name: 'sec_level', value: 'Basis' }
          },
          {
            name: 'modal_verb',
            value: 'MUSS',
            sourceLevel: 'part',
            sourcePath: 'Control → statement-Part → Prop',
            raw: { name: 'modal_verb', value: 'MUSS' }
          }
        ],
        unknown: [
          {
            name: 'future_part_prop',
            value: 'zukünftiger Wert',
            namespace: 'https://example.test/future',
            sourceLevel: 'part',
            sourcePath: 'Control → statement-Part → item-Part → Prop',
            raw: {
              name: 'future_part_prop',
              value: 'zukünftiger Wert'
            }
          }
        ]
      }
    };

    render(<ControlDetail control={record} />);

    const metadata = screen.getByRole('region', { name: 'Metadaten' });
    expect(within(metadata).getByText('Sicherheitsniveau')).toBeInTheDocument();
    expect(within(metadata).getByText('Basis')).toBeInTheDocument();
    expect(
      within(metadata).getByText('Technische Klassifikation')
    ).toBeInTheDocument();
    expect(within(metadata).getByText('normal-SdT')).toBeInTheDocument();
    expect(within(metadata).getByText('Modalverb')).toBeInTheDocument();
    expect(within(metadata).getByText('MUSS')).toBeInTheDocument();

    const fallback = screen.getByRole('region', {
      name: 'Weitere Metadaten (noch nicht fachlich eingeordnet)'
    });
    expect(within(fallback).getByText('future_part_prop')).toBeInTheDocument();
    expect(within(fallback).getByText('zukünftiger Wert')).toBeInTheDocument();
    expect(
      within(fallback).getByText('https://example.test/future')
    ).toBeInTheDocument();
    expect(within(fallback).getByText('Part')).toBeInTheDocument();
    expect(
      within(fallback).getByText(
        'Control → statement-Part → item-Part → Prop'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/Niveau normal-SdT/)).not.toBeInTheDocument();
  });

  it('renders every direct and nested statement and guidance in its fachlich section', () => {
    const record: ControlRecord = {
      id: 'APP.3',
      title: 'Vollständige Inhalte',
      groupPath: ['Organisation', 'Regelungen'],
      fullText: '',
      control: {
        parts: [
          {
            name: 'statement',
            prose: 'Erste Anforderung.',
            parts: [
              {
                name: 'item',
                title: 'Vertiefung',
                prose: 'Verschachtelte Anforderung.'
              }
            ]
          },
          {
            name: 'statement',
            prose: 'Zweite Anforderung.'
          },
          {
            name: 'guidance',
            prose: 'Erster Umsetzungshinweis.',
            parts: [
              {
                name: 'item',
                prose: 'Verschachtelter Umsetzungshinweis.'
              }
            ]
          },
          {
            name: 'guidance',
            prose: 'Zweiter Umsetzungshinweis.'
          }
        ]
      },
      metadata: { known: [], unknown: [] }
    };

    render(<ControlDetail control={record} />);

    const requirementSection = screen
      .getByRole('heading', { name: 'Anforderung' })
      .closest('section');
    const guidanceSection = screen
      .getByRole('heading', { name: 'Umsetzungshinweis' })
      .closest('section');

    expect(requirementSection).not.toBeNull();
    expect(guidanceSection).not.toBeNull();

    const requirements = within(requirementSection as HTMLElement);
    expect(requirements.getByText('Erste Anforderung.')).toBeInTheDocument();
    expect(requirements.getByText('Zweite Anforderung.')).toBeInTheDocument();
    expect(
      requirements.getByText('Verschachtelte Anforderung.')
    ).toBeInTheDocument();
    expect(
      requirements.getByRole('heading', { name: 'Vertiefung' })
    ).toBeInTheDocument();

    const guidance = within(guidanceSection as HTMLElement);
    expect(
      guidance.getByText('Erster Umsetzungshinweis.')
    ).toBeInTheDocument();
    expect(
      guidance.getByText('Zweiter Umsetzungshinweis.')
    ).toBeInTheDocument();
    expect(
      guidance.getByText('Verschachtelter Umsetzungshinweis.')
    ).toBeInTheDocument();
  });

  it('renders required and related controls with resolved titles and traceable origin', () => {
    const record: ControlRecord = {
      id: 'CTRL-A',
      title: 'Ausgangsanforderung',
      groupPath: ['Organisation', 'Regelungen'],
      fullText: '',
      control: {},
      metadata: { known: [], unknown: [] },
      relationships: [
        {
          kind: 'required',
          targetId: 'CTRL-B',
          targetTitle: 'Benötigte Anforderung',
          sourcePath: 'Control → Link',
          raw: { href: '#CTRL-B', rel: 'required' }
        },
        {
          kind: 'related',
          targetId: 'CTRL-MISSING',
          sourcePath: 'Control → Link',
          raw: { href: '#CTRL-MISSING', rel: 'related' }
        }
      ]
    };

    render(<ControlDetail control={record} />);

    const relationships = screen.getByRole('region', {
      name: 'Beziehungen'
    });
    expect(
      within(relationships).getByText('Erforderliche Anforderungen')
    ).toBeInTheDocument();
    expect(
      within(relationships).getByText('Benötigte Anforderung')
    ).toBeInTheDocument();
    expect(within(relationships).getByText('CTRL-B')).toBeInTheDocument();
    expect(
      within(relationships).getByText('Verwandte Anforderungen')
    ).toBeInTheDocument();
    expect(
      within(relationships).getByText('CTRL-MISSING')
    ).toBeInTheDocument();
    expect(
      within(relationships).getByText(
        'BSI-Quelldaten · vom Explorer aufgelöst'
      )
    ).toBeInTheDocument();
    expect(
      within(relationships).getAllByText('Control → Link')
    ).toHaveLength(2);
  });

  it('labels the verified target, threat, and security-objective metadata fachlich', () => {
    const namesAndValues = [
      ['target_object_categories', 'Daten'],
      ['threats', 'G 0.18'],
      ['confidentiality', '2'],
      ['integrity', '1'],
      ['availability', '1'],
      ['authenticity', '0']
    ];
    const record: ControlRecord = {
      id: 'META.1',
      title: 'Fachmetadaten',
      groupPath: ['Organisation', 'Regelungen'],
      fullText: '',
      control: {},
      metadata: {
        known: namesAndValues.map(([name, value]) => ({
          name,
          value,
          sourceLevel: 'control',
          sourcePath: 'Control → Prop',
          raw: { name, value }
        })),
        unknown: []
      }
    };

    render(<ControlDetail control={record} />);

    const metadata = screen.getByRole('region', { name: 'Metadaten' });
    [
      'Zielobjektkategorien',
      'Gefährdungen',
      'Vertraulichkeit',
      'Integrität',
      'Verfügbarkeit',
      'Authentizität'
    ].forEach((label) => {
      expect(within(metadata).getByText(label)).toBeInTheDocument();
    });
    expect(within(metadata).getByText('Daten')).toBeInTheDocument();
    expect(within(metadata).getByText('G 0.18')).toBeInTheDocument();
  });
});
