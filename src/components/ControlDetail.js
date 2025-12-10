import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const renderList = (items) => {
    if (!items?.length)
        return null;
    return (_jsx("ul", { children: items.map((item, idx) => (_jsx("li", { children: item.value || item.label || item.prose || item.name }, idx))) }));
};
const ControlDetail = ({ control }) => {
    if (!control)
        return _jsx("div", { className: "detail", children: "Select a control to see details." });
    const { control: raw } = control;
    return (_jsxs("div", { className: "detail", "aria-live": "polite", children: [_jsxs("h3", { children: [control.title, " ", _jsx("span", { className: "badge", children: control.id })] }), control.groupPath.length > 0 && _jsxs("div", { style: { marginBottom: '0.5rem' }, children: ["Pfad: ", control.groupPath.join(' › ')] }), _jsx("p", { children: control.fullText || 'Keine Prosa gefunden.' }), raw.parts?.length ? (_jsxs("section", { children: [_jsx("h4", { children: "Parts" }), _jsx("ul", { children: raw.parts.map((part, idx) => (_jsxs("li", { children: [_jsx("strong", { children: part.name || part.title }), ": ", part.prose] }, idx))) })] })) : null, raw.params?.length ? (_jsxs("section", { children: [_jsx("h4", { children: "Parameter" }), renderList(raw.params)] })) : null, raw.props?.length ? (_jsxs("section", { children: [_jsx("h4", { children: "Properties" }), renderList(raw.props)] })) : null] }));
};
export default ControlDetail;
