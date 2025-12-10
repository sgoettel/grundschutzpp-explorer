import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
const ResultsList = ({ results, selectedId, selectedIds, onSelect, onToggleSelected }) => {
    const containerRef = useRef(null);
    const [focusIndex, setFocusIndex] = useState(0);
    useEffect(() => {
        setFocusIndex(0);
    }, [results]);
    useEffect(() => {
        const handler = (event) => {
            if (!containerRef.current || !containerRef.current.contains(document.activeElement))
                return;
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setFocusIndex((idx) => Math.min(idx + 1, results.length - 1));
            }
            else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setFocusIndex((idx) => Math.max(idx - 1, 0));
            }
            else if (event.key === 'Enter') {
                event.preventDefault();
                const target = results[focusIndex];
                if (target)
                    onSelect(target.id);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [results, focusIndex, onSelect]);
    useEffect(() => {
        const node = containerRef.current?.querySelectorAll('[data-result]')[focusIndex];
        node?.scrollIntoView({ block: 'nearest' });
    }, [focusIndex, results]);
    return (_jsxs("div", { className: "result-list", tabIndex: 0, ref: containerRef, "aria-label": "Search results", children: [results.length === 0 && _jsx("div", { className: "notice", style: { margin: '0.75rem' }, children: "No results" }), results.map((record) => {
                const isSelected = selectedIds.has(record.id);
                return (_jsxs("div", { className: "result-item", "data-result": true, children: [_jsx("input", { type: "checkbox", "aria-label": `Select ${record.title}`, checked: isSelected, onChange: () => onToggleSelected(record.id) }), _jsxs("div", { children: [_jsxs("button", { type: "button", onClick: () => onSelect(record.id), "aria-current": selectedId === record.id, children: [_jsx("strong", { children: record.title }), _jsx("div", { className: "badge", style: { marginLeft: '0.35rem' }, children: record.id })] }), _jsx("div", { style: { fontSize: '0.9rem', color: '#475569' }, children: record.groupPath.join(' › ') }), _jsx("div", { style: { fontSize: '0.9rem', color: '#334155' }, children: record.fullText.slice(0, 160) })] })] }, record.id));
            })] }));
};
export default ResultsList;
