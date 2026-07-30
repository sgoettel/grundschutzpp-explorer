import { fireEvent, render, screen } from '@testing-library/react';
import type { PracticeRecord } from '../lib/types';
import CatalogOverview from './CatalogOverview';
import { vi } from 'vitest';

describe('CatalogOverview', () => {
  it('keeps full descriptions locally accessible with at most one open', () => {
    const practices: PracticeRecord[] = [
      {
        id: 'practice-organisation',
        title: 'Organisation',
        description: 'Organisation wirksam und nachvollziehbar gestalten.',
        directControlIds: [],
        topics: [],
        raw: { id: 'practice-organisation', title: 'Organisation' }
      },
      {
        id: 'practice-operations',
        title: 'Betrieb',
        description: 'Den sicheren Betrieb dauerhaft gewährleisten.',
        directControlIds: [],
        topics: [],
        raw: { id: 'practice-operations', title: 'Betrieb' }
      }
    ];
    const onSelectPractice = vi.fn();
    window.location.hash = '#/';

    const { container } = render(
      <CatalogOverview
        practices={practices}
        onSelectPractice={onSelectPractice}
      />
    );

    const previews = container.querySelectorAll(
      '.overview-description-preview'
    );
    const fullDescriptions = container.querySelectorAll(
      '.overview-description-full'
    );
    const summaries = screen
      .getAllByText('Beschreibung vollständig anzeigen')
      .map((label) => label.closest('summary'));
    const details = summaries.map((summary) => summary?.closest('details'));

    expect(previews).toHaveLength(2);
    expect(previews[0]).toHaveTextContent(
      'Organisation wirksam und nachvollziehbar gestalten.'
    );
    expect(previews[0]).toHaveAttribute('aria-hidden', 'true');
    expect(fullDescriptions[0]).not.toBeVisible();
    expect(fullDescriptions[1]).not.toBeVisible();

    fireEvent.click(summaries[0] as HTMLElement);

    expect(details[0]).toHaveAttribute('open');
    expect(details[1]).not.toHaveAttribute('open');
    expect(fullDescriptions[0]).toBeVisible();
    expect(window.location.hash).toBe('#/');

    fireEvent.click(summaries[1] as HTMLElement);

    expect(details[0]).not.toHaveAttribute('open');
    expect(details[1]).toHaveAttribute('open');
    expect(fullDescriptions[0]).not.toBeVisible();
    expect(fullDescriptions[1]).toBeVisible();
    expect(window.location.hash).toBe('#/');

    fireEvent.click(
      screen.getByRole('button', { name: /Organisation/ })
    );
    expect(onSelectPractice).toHaveBeenCalledWith('practice-organisation');
  });
});
