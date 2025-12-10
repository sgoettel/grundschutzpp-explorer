import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const Progress = ({ label, percent = 30 }) => (_jsxs("div", { className: "progress", role: "status", "aria-live": "polite", children: [_jsx("div", { className: "progress-bar", "aria-hidden": true, children: _jsx("span", { style: { width: `${percent}%` } }) }), _jsx("div", { children: label })] }));
export default Progress;
