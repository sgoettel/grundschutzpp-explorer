import type { ControlRecord, PracticeRecord, TopicRecord } from '../lib/types';

interface PracticeNavigatorProps {
  practices: PracticeRecord[];
  controls: ControlRecord[];
  selectedPracticeId?: string;
  selectedTopicId?: string;
  selectedControlId?: string;
  onSelectPractice: (practiceId: string) => void;
  onSelectTopic: (practiceId: string, topicId: string) => void;
  onSelectControl: (controlId: string) => void;
  onNavigateHome?: () => void;
}

const uniqueCount = (ids: string[]): number => new Set(ids).size;

const requirementCount = (practice: PracticeRecord): number =>
  uniqueCount([
    ...practice.directControlIds,
    ...practice.topics.flatMap((topic) => topic.controlIds)
  ]);

const topicRequirements = (
  topic: TopicRecord,
  controlsById: Map<string, ControlRecord>
): ControlRecord[] =>
  topic.controlIds.flatMap((id) => {
    const record = controlsById.get(id);
    return record ? [record] : [];
  });

const PracticeNavigator = ({
  practices,
  controls,
  selectedPracticeId,
  selectedTopicId,
  selectedControlId,
  onSelectPractice,
  onSelectTopic,
  onSelectControl,
  onNavigateHome
}: PracticeNavigatorProps) => {
  const controlsById = new Map(controls.map((control) => [control.id, control]));

  return (
    <nav className="register" aria-label="Register">
      <button
        type="button"
        className="brand"
        onClick={onNavigateHome}
        aria-label="Zur Ausgangsansicht"
      >
        <span className="brand-name">
          Grundschutz<span>++</span>
        </span>
        <span className="brand-product">Explorer</span>
      </button>

      <h2 className="register-label">Register</h2>
      <ol className="register-list">
        {practices.map((practice, practiceIndex) => {
          const isPracticeOpen = practice.id === selectedPracticeId;

          return (
            <li
              className={`register-practice${isPracticeOpen ? ' is-open' : ''}`}
              key={practice.id}
            >
              <button
                type="button"
                className="register-row practice-row"
                onClick={() => onSelectPractice(practice.id)}
                aria-expanded={isPracticeOpen}
                aria-label={practice.title}
                title={practice.description}
              >
                <span className="register-number">
                  {String(practiceIndex + 1).padStart(2, '0')}
                </span>
                <span className="register-title">{practice.title}</span>
                <span className="register-count">
                  {requirementCount(practice)}
                </span>
              </button>

              {isPracticeOpen ? (
                <ol className="register-topics">
                  {practice.topics.map((topic) => {
                    const isTopicOpen = topic.id === selectedTopicId;
                    const requirements = topicRequirements(topic, controlsById);

                    return (
                      <li
                        className={`register-topic${isTopicOpen ? ' is-open' : ''}`}
                        key={topic.id}
                      >
                        <button
                          type="button"
                          className="register-row topic-row"
                          onClick={() => onSelectTopic(practice.id, topic.id)}
                          aria-expanded={isTopicOpen}
                          aria-label={topic.title}
                          title={topic.description}
                        >
                          <span className="register-title">{topic.title}</span>
                          <span className="register-count">
                            {uniqueCount(topic.controlIds)}
                          </span>
                        </button>

                        {isTopicOpen ? (
                          <ol className="register-requirements">
                            {requirements.map((control) => (
                              <li key={control.id}>
                                <button
                                  type="button"
                                  className={`register-row requirement-row${control.id === selectedControlId ? ' is-selected' : ''}`}
                                  onClick={() => onSelectControl(control.id)}
                                  aria-current={
                                    control.id === selectedControlId
                                      ? 'page'
                                      : undefined
                                  }
                                  aria-label={`${control.title} ${control.id}`}
                                >
                                  {control.title}
                                </button>
                              </li>
                            ))}
                          </ol>
                        ) : null}
                      </li>
                    );
                  })}

                  {practice.directControlIds.length ? (
                    <li className="register-topic is-open">
                      <ol className="register-requirements">
                        {practice.directControlIds.flatMap((id) => {
                          const control = controlsById.get(id);
                          return control ? (
                            <li key={control.id}>
                              <button
                                type="button"
                                className={`register-row requirement-row${control.id === selectedControlId ? ' is-selected' : ''}`}
                                onClick={() => onSelectControl(control.id)}
                                aria-current={
                                  control.id === selectedControlId
                                    ? 'page'
                                    : undefined
                                }
                                aria-label={`${control.title} ${control.id}`}
                              >
                                {control.title}
                              </button>
                            </li>
                          ) : [];
                        })}
                      </ol>
                    </li>
                  ) : null}
                </ol>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default PracticeNavigator;
