# Grundschutz++ OSCAL Explorer

Browser-basierte UI zum Durchsuchen eines Grundschutz++-Kompendiums im OSCAL-JSON-Format.

- Lädt einen OSCAL Catalog (JSON) von einer konfigurierbaren URL
- Volltextsuche + Gruppenfilter
- Detailansicht (Statement/Guidance/Metadaten; Platzhalter werden aufgelöst)
- Export: CSV (Excel-freundlich) und Markdown

## Datenquelle & Lizenz

- Dieses Projekt enthält **keine** Datensätze im Repo; der Katalog wird zur Laufzeit geladen.
- Für Inhalte/Lizenzen gilt das, was der jeweilige Katalog-Herausgeber vorgibt.

## Entwicklung 

Voraussetzung: Node.js **20** + npm

```bash
npm ci
npm run dev
npx vitest run
npm run build
````

Wenn du Ideen für sinnvolle Erweiterungen hast oder beim Code helfen möchtest, [melde dich gern](https://github.com/sgoettel/sgoettel/blob/main/img/mail.png)
