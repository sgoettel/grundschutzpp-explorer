# Project goals
Build a zero-install, browser-based explorer for BSI Grundschutz++ OSCAL JSON:
- Full-text search + filters + detail view
- Export selected results as CSV and Markdown
- Local diff between two versions of the catalog (by control ID + changed fields)
- Works on Windows via browser (no CLI required for end users)

# Non-goals (v1)
- No full ISMS tooling, workflows, user management, or authentication
- No vendor-specific integrations (verinice, Jira, etc.) in v1
- Do not commit large BSI datasets into the repo

# Data & licensing
- The app fetches OSCAL JSON from a configurable URL at runtime.
- Include clear attribution and license notice in the UI + README for the upstream dataset.
- Prefer synthetic/minimal fixtures for tests to avoid shipping upstream content.

# Tech constraints
- Keep it simple: Vite + TypeScript (or plain JS) + minimal dependencies.
- Provide a static build deployable to GitHub Pages.
- Provide local dev commands and CI-ready scripts.

# Quality bar
- Add unit tests for: parsing, indexing/search, export, diff.
- Add linting + formatting.
- No secrets, no telemetry, no tracking.
- Document assumptions and tradeoffs in README.

# Commands
Use npm (not pnpm) for compatibility.
- npm ci
- npm run dev
- npm run build
- npm test
- npm run lint
