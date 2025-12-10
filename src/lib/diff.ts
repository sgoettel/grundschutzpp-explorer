import { ControlRecord } from './types';

export interface ControlChange {
  id: string;
  status: 'added' | 'removed' | 'changed' | 'unchanged';
  changedFields?: string[];
  before?: ControlRecord;
  after?: ControlRecord;
}

const fieldChanged = (a?: ControlRecord, b?: ControlRecord, field: keyof ControlRecord) => {
  return (a?.[field] ?? '') !== (b?.[field] ?? '');
};

export const diffCatalogs = (before: ControlRecord[], after: ControlRecord[]): ControlChange[] => {
  const beforeMap = new Map(before.map((c) => [c.id, c]));
  const afterMap = new Map(after.map((c) => [c.id, c]));
  const ids = new Set([...beforeMap.keys(), ...afterMap.keys()]);

  return Array.from(ids).map((id) => {
    const previous = beforeMap.get(id);
    const next = afterMap.get(id);
    if (previous && !next) {
      return { id, status: 'removed', before: previous } satisfies ControlChange;
    }
    if (!previous && next) {
      return { id, status: 'added', after: next } satisfies ControlChange;
    }
    if (previous && next) {
      const changedFields = ['title', 'fullText', 'groupPath'].filter((field) =>
        fieldChanged(previous, next, field as keyof ControlRecord)
      );
      return {
        id,
        status: changedFields.length ? 'changed' : 'unchanged',
        changedFields,
        before: previous,
        after: next
      } satisfies ControlChange;
    }
    return { id, status: 'unchanged' } as ControlChange;
  });
};
