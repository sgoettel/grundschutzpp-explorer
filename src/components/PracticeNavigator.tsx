import type { ControlRecord, PracticeRecord, TopicRecord } from '../lib/types';
import IdBadge from './IdBadge';

interface PracticeNavigatorProps {
  practices: PracticeRecord[];
  controls: ControlRecord[];
  selectedPracticeId?: string;
  selectedTopicId?: string;
  onSelectPractice: (practiceId: string) => void;
  onSelectTopic: (practiceId: string, topicId: string) => void;
  onSelectControl: (controlId: string) => void;
}

const requirementCount = (practice: PracticeRecord): number =>
  new Set([
    ...practice.directControlIds,
    ...practice.topics.flatMap((topic) => topic.controlIds)
  ]).size;

const RequirementList = ({
  controlIds,
  controls,
  onSelectControl
}: {
  controlIds: string[];
  controls: ControlRecord[];
  onSelectControl: (controlId: string) => void;
}) => {
  const controlMap = new Map(controls.map((control) => [control.id, control]));
  const requirements = controlIds.flatMap((id) => {
    const control = controlMap.get(id);
    return control ? [control] : [];
  });

  return requirements.length ? (
    <ul className="requirement-list">
      {requirements.map((control) => (
        <li key={control.id}>
          <button type="button" onClick={() => onSelectControl(control.id)}>
            <strong>{control.title}</strong> <IdBadge id={control.id} />
          </button>
          {control.fullText ? (
            <p>{control.fullText.slice(0, 180)}</p>
          ) : null}
        </li>
      ))}
    </ul>
  ) : (
    <div className="notice">Keine Anforderungen verfügbar.</div>
  );
};

const TopicOverview = ({
  practice,
  onSelectPractice,
  onSelectTopic
}: {
  practice: PracticeRecord;
  onSelectPractice: (practiceId: string) => void;
  onSelectTopic: (practiceId: string, topicId: string) => void;
}) => (
  <section aria-labelledby="topics-heading">
    <button
      className="navigation-back"
      type="button"
      onClick={() => onSelectPractice('')}
    >
      ← Alle Praktiken
    </button>
    <h2 id="topics-heading">Themen in {practice.title}</h2>
    {practice.description ? <p>{practice.description}</p> : null}

    {practice.topics.length ? (
      <div className="practice-grid">
        {practice.topics.map((topic) => (
          <article className="practice-card" key={topic.id}>
            <h3>
              <button
                type="button"
                onClick={() => onSelectTopic(practice.id, topic.id)}
              >
                {topic.title}
              </button>
            </h3>
            {topic.description ? <p>{topic.description}</p> : null}
            <p className="derived-count">
              {new Set(topic.controlIds).size} Anforderungen
            </p>
            <span className="derived-label">Explorer-Ableitung</span>
          </article>
        ))}
      </div>
    ) : (
      <div className="notice">Keine Themen verfügbar.</div>
    )}
  </section>
);

const TopicDetail = ({
  practice,
  topic,
  controls,
  onSelectTopic,
  onSelectControl
}: {
  practice: PracticeRecord;
  topic: TopicRecord;
  controls: ControlRecord[];
  onSelectTopic: (practiceId: string, topicId: string) => void;
  onSelectControl: (controlId: string) => void;
}) => (
  <section aria-labelledby="topic-heading">
    <button
      className="navigation-back"
      type="button"
      onClick={() => onSelectTopic(practice.id, '')}
    >
      ← Themen in {practice.title}
    </button>
    <h2 id="topic-heading">{topic.title}</h2>
    {topic.description ? <p>{topic.description}</p> : null}
    <RequirementList
      controlIds={topic.controlIds}
      controls={controls}
      onSelectControl={onSelectControl}
    />
  </section>
);

const PracticeNavigator = ({
  practices,
  controls,
  selectedPracticeId,
  selectedTopicId,
  onSelectPractice,
  onSelectTopic,
  onSelectControl
}: PracticeNavigatorProps) => {
  const selectedPractice = practices.find(
    (practice) => practice.id === selectedPracticeId
  );
  const selectedTopic = selectedPractice?.topics.find(
    (topic) => topic.id === selectedTopicId
  );

  if (selectedPractice && selectedTopic) {
    return (
      <TopicDetail
        practice={selectedPractice}
        topic={selectedTopic}
        controls={controls}
        onSelectTopic={onSelectTopic}
        onSelectControl={onSelectControl}
      />
    );
  }

  if (selectedPractice) {
    return (
      <TopicOverview
        practice={selectedPractice}
        onSelectPractice={onSelectPractice}
        onSelectTopic={onSelectTopic}
      />
    );
  }

  return (
    <section aria-labelledby="practices-heading">
      <h2 id="practices-heading">Praktiken</h2>

      {practices.length ? (
        <div className="practice-grid">
          {practices.map((practice) => (
            <article className="practice-card" key={practice.id}>
              <h3>
                <button
                  type="button"
                  onClick={() => onSelectPractice(practice.id)}
                >
                  {practice.title}
                </button>
              </h3>
              {practice.description ? <p>{practice.description}</p> : null}
              <p className="derived-count">
                {practice.topics.length} Themen · {requirementCount(practice)}{' '}
                Anforderungen
              </p>
              <span className="derived-label">Explorer-Ableitung</span>
            </article>
          ))}
        </div>
      ) : (
        <div className="notice">Keine Praktiken verfügbar.</div>
      )}
    </section>
  );
};

export default PracticeNavigator;
