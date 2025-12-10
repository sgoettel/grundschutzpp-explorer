# Grundschutz++ OSCAL Explorer

A static, zero-install web application for exploring the BSI Grundschutz++ OSCAL catalog. Paste a catalog URL, fetch it directly in the browser, search/filter controls, open details, and export your findings.

## What it does
- Fetches OSCAL catalog JSON from a configurable URL at runtime (default placeholder points to a GitHub raw URL).
- Parses nested OSCAL groups/controls into a flat list (id, title, group path, prose) while tolerating unknown fields.
- Builds an in-browser MiniSearch full-text index for instant search and optional group filtering.
- Displays a detail view per control, including parts/params/props when available.
- Exports filtered/selected controls to Excel-friendly CSV (UTF-8 BOM, semicolon, CRLF) and Markdown.
- Caches downloaded catalogs locally (IndexedDB with localStorage fallback) with a clear-cache action.
- Encodes query/filter/selection/catalog URL in the hash so you can share deep links; hash routing keeps GitHub Pages refresh-safe.

## What it does not do (v1)
- Ship the upstream BSI dataset in the repo (only synthetic fixtures for tests).
- Provide authentication, multi-user workflows, or vendor integrations.
- Guarantee performance on extremely large catalogs; indexing happens fully in the browser.

## Getting started
Requirements: Node 18+ and npm.

```bash
npm install
npm run dev
```
Open the printed local URL in your browser. The UI is keyboard-friendly: focus the results list, then use ↑/↓ and Enter to open a control.

### Building
```bash
npm run build
```
Outputs a static bundle in `dist/` suitable for GitHub Pages. The app uses hash-based links, so a simple static host works. For GitHub Pages, deploy `dist/` and optionally keep `public/404.html` as a fallback redirect.

### Testing & linting
```bash
npm test
npm run lint
```

## Using the app
1. Open Settings, confirm or paste the catalog URL, and click **Fetch & Index**. Progress updates cover download → parse → index.
2. Use the search bar and group filter to narrow controls. Results update live.
3. Select controls via checkboxes (or leave none to export all filtered results) and click Export CSV/Markdown. CSV is Excel-friendly for German locales.
4. Copy the page URL to share the current query/filter/selection; state lives in the hash so refreshes keep context.
5. Use **Clear cache** if you want to drop the locally stored catalog copy.

## Deployment to GitHub Pages
1. Run `npm run build`.
2. Publish the `dist/` folder. Hash routing avoids 404s on refresh; `public/404.html` provides a minimal redirect fallback.

## Known limitations
- Large catalogs may take noticeable time/memory to parse and index in-browser.
- If the upstream schema changes drastically, parsing will surface warnings and skip unknown shapes instead of crashing.
- Network-restricted environments may need proxy configuration to fetch the catalog URL.

## Design notes
- Parsing is defensive: it only relies on the OSCAL `catalog` root and common `groups`/`controls`/`parts` fields, collecting prose where available and generating synthetic IDs when missing.
- Search uses MiniSearch with prefix + fuzzy matching to keep dependencies light and fast in the browser.
- Caching prefers IndexedDB but falls back to `localStorage` when IndexedDB is unavailable; clearing the cache drops both.
