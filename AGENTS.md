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

# Tech constraints (hard rules)
- Node.js: target Node 20 (CI + local "blessed" environment).
- Prefer Docker for local reproducibility:
  - node:20-bullseye
- Toolchain freeze:
  - Do NOT change Vite/TypeScript/ESLint/Vitest/CI configs unless explicitly requested.
- Changes should be small and reviewable:
  - One feature/fix per PR, minimal diff, no drive-by refactors.
- Do not add/commit duplicate JS files in src/ (TypeScript is the source of truth).

# Quality bar
- Add unit tests for: parsing, indexing/search, export, diff.
- Keep linting + formatting clean.
- No secrets, no telemetry, no tracking.
- Document assumptions and tradeoffs in README.

# Commands (authoritative)
Use npm (not pnpm) for compatibility.
- npm ci
- npm run dev
- npm run build
- npx vitest run
- npm run lint

# Definition of done (per PR)
- In Docker (node:20-bullseye): npm ci && npx vitest run && npm run build must be green.
- If a change affects search/export/diff/parsing: add or update tests accordingly.
- Provide a short PR summary + risks/limitations.
