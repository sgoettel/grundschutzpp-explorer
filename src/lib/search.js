import MiniSearch from 'minisearch';
const normalizeGroupPath = (gp) => {
    if (Array.isArray(gp)) {
        return gp.map((x) => String(x)).join(' / ');
    }
    return String(gp ?? '');
};
const getResultId = (r) => {
    return String(r.id);
};
export const buildIndex = (records) => {
    const normalized = records.map((r) => ({
        ...r,
        groupPath: normalizeGroupPath(r.groupPath)
    }));
    const groupPathById = new Map(normalized.map((r) => [String(r.id), String(r.groupPath ?? '')]));
    const index = new MiniSearch({
        idField: 'id',
        fields: ['title', 'fullText', 'groupPath'],
        storeFields: ['id', 'title', 'groupPath', 'fullText']
    });
    index.addAll(normalized);
    const query = (text, filters) => {
        const results = index.search(text || '*', {
            prefix: true,
            fuzzy: 0.2,
            combineWith: 'AND'
        });
        if (!filters?.group)
            return results;
        const needle = String(filters.group).toLowerCase();
        return results.filter((r) => String(groupPathById.get(getResultId(r)) ?? '')
            .toLowerCase()
            .includes(needle));
    };
    return { index, query };
};
