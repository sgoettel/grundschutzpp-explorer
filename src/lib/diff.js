const normalize = (v) => {
    if (Array.isArray(v))
        return v.map((x) => String(x)).join(' / ').trim();
    if (typeof v === 'string')
        return v.trim();
    return String(v ?? '').trim();
};
const fieldChanged = (a, b, field) => {
    return normalize(a?.[field]) !== normalize(b?.[field]);
};
export const diffCatalogs = (before, after) => {
    const beforeMap = new Map(before.map((c) => [c.id, c]));
    const afterMap = new Map(after.map((c) => [c.id, c]));
    const ids = new Set([...beforeMap.keys(), ...afterMap.keys()]);
    return Array.from(ids).map((id) => {
        const previous = beforeMap.get(id);
        const next = afterMap.get(id);
        if (previous && !next) {
            return { id, status: 'removed', before: previous };
        }
        if (!previous && next) {
            return { id, status: 'added', after: next };
        }
        if (previous && next) {
            const changedFields = ['title', 'fullText', 'groupPath'].filter((field) => fieldChanged(previous, next, field));
            return {
                id,
                status: changedFields.length ? 'changed' : 'unchanged',
                changedFields,
                before: previous,
                after: next
            };
        }
        return { id, status: 'unchanged' };
    });
};
