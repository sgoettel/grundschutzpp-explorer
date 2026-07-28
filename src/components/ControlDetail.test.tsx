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
});
