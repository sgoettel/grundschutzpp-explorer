import { fireEvent, render, screen } from '@testing-library/react';
import type { ControlRecord, PracticeRecord } from '../lib/types';
import PracticeNavigator from './PracticeNavigator';

describe('PracticeNavigator', () => {
  it('shows source descriptions and derived counts and opens a practice', () => {
    const practices: PracticeRecord[] = [
      {
        id: 'practice-organisation',
        title: 'Organisation',
        description: 'Organisation wirksam gestalten.',
        directControlIds: [],
        topics: [
          {
            id: 'topic-regelungen',
            title: 'Regelungen',
            controlIds: ['ORG.1', 'ORG.2'],
            raw: { id: 'topic-regelungen', title: 'Regelungen' }
          },
          {
            id: 'topic-personal',
            title: 'Personal',
            controlIds: ['ORG.3'],
            raw: { id: 'topic-personal', title: 'Personal' }
          }
        ],
        raw: { id: 'practice-organisation', title: 'Organisation' }
      }
    ];
    const selected: string[] = [];

    render(
      <PracticeNavigator
        practices={practices}
        controls={[]}
        onSelectPractice={(practiceId) => selected.push(practiceId)}
        onSelectTopic={() => undefined}
        onSelectControl={() => undefined}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Praktiken' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Organisation wirksam gestalten.')
    ).toBeInTheDocument();
    expect(screen.getByText('2 Themen · 3 Anforderungen')).toBeInTheDocument();
    expect(screen.getByText('Explorer-Ableitung')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Organisation' })
    );
    expect(selected).toEqual(['practice-organisation']);
  });

  it('drills down from a practice to its topics and requirements', () => {
    const practices: PracticeRecord[] = [
      {
        id: 'practice-organisation',
        title: 'Organisation',
        directControlIds: [],
        topics: [
          {
            id: 'topic-regelungen',
            title: 'Regelungen',
            description: 'Verbindliche Regelungen schaffen.',
            controlIds: ['ORG.1', 'ORG.2'],
            raw: { id: 'topic-regelungen', title: 'Regelungen' }
          }
        ],
        raw: { id: 'practice-organisation', title: 'Organisation' }
      }
    ];
    const controls: ControlRecord[] = [
      {
        id: 'ORG.1',
        title: 'Regelungen festlegen',
        groupPath: ['Organisation', 'Regelungen'],
        fullText: 'Regelungen festlegen',
        control: {},
        metadata: { known: [], unknown: [] }
      },
      {
        id: 'ORG.2',
        title: 'Regelungen prüfen',
        groupPath: ['Organisation', 'Regelungen'],
        fullText: 'Regelungen prüfen',
        control: {},
        metadata: { known: [], unknown: [] }
      }
    ];
    const selectedTopics: string[] = [];
    const selectedControls: string[] = [];
    const view = render(
      <PracticeNavigator
        practices={practices}
        controls={controls}
        selectedPracticeId="practice-organisation"
        onSelectPractice={() => undefined}
        onSelectTopic={(_practiceId, topicId) =>
          selectedTopics.push(topicId)
        }
        onSelectControl={(controlId) => selectedControls.push(controlId)}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Themen in Organisation' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Verbindliche Regelungen schaffen.')
    ).toBeInTheDocument();
    expect(screen.getByText('2 Anforderungen')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Regelungen' }));
    expect(selectedTopics).toEqual(['topic-regelungen']);

    view.rerender(
      <PracticeNavigator
        practices={practices}
        controls={controls}
        selectedPracticeId="practice-organisation"
        selectedTopicId="topic-regelungen"
        onSelectPractice={() => undefined}
        onSelectTopic={() => undefined}
        onSelectControl={(controlId) => selectedControls.push(controlId)}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Regelungen' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Regelungen festlegen.*ORG\.1/ })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Regelungen festlegen.*ORG\.1/ })
    );
    expect(selectedControls).toEqual(['ORG.1']);
  });
});
