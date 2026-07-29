import { render, screen } from '@testing-library/react';
import type { PracticeRecord } from '../lib/types';
import CatalogOverview from './CatalogOverview';

describe('CatalogOverview', () => {
  it('keeps the original practice description visibly available', () => {
    const practices: PracticeRecord[] = [
      {
        id: 'practice-organisation',
        title: 'Organisation',
        description: 'Organisation wirksam und nachvollziehbar gestalten.',
        directControlIds: [],
        topics: [],
        raw: { id: 'practice-organisation', title: 'Organisation' }
      }
    ];

    render(
      <CatalogOverview
        practices={practices}
        onSelectPractice={() => undefined}
      />
    );

    expect(
      screen.getByText(
        'Organisation wirksam und nachvollziehbar gestalten.'
      )
    ).toBeVisible();
  });
});
