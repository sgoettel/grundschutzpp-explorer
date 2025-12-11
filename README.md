# Grundschutz++ OSCAL Explorer

Kleine Web-Oberfläche, um das Grundschutz++-Kompendium im OSCAL-Format direkt im Browser zu durchsuchen, zu filtern und Kontrollen zu exportieren. Läuft komplett client-seitig, kein Backend.

## Funktionen

- Lädt einen OSCAL-Katalog (JSON) von einer frei konfigurierbaren URL.
- Zieht daraus eine flache Liste von Kontrollen (ID, Titel, Pfad, Prosa).
- Volltextsuche mit einfachem Gruppenfilter.
- Detailansicht einer Kontrolle (Parts/Parameter/Properties, soweit vorhanden).
- Export der gefilterten/ausgewählten Kontrollen als
  - CSV (UTF-8 mit BOM, Semikolon-getrennt, Excel-freundlich),
  - Markdown.
- Lokale Zwischenspeicherung (IndexedDB mit Fallback auf `localStorage`) + „Cache leeren“.
- Zustand (Suchtext, Filter, Auswahl, Katalog-URL) steckt im URL-Hash und ist damit teilbar.

## Nicht-Ziele (v1)

- Keine Anbindung an verinice, Jira o.Ä. in dieser Version.
- Das BSI-Kompendium selbst wird **nicht** ins Repo eingecheckt, sondern immer zur Laufzeit geladen.

## Lokal ausführen

Voraussetzungen:

- Node.js **20**
- npm

Setup und Dev-Server:

```bash
npm ci
npm run dev
````

Dann die ausgegebene lokale URL im Browser öffnen.
Ergebnisliste ist per Tastatur bedienbar: Fokus auf die Liste, mit ↑/↓ navigieren, mit Enter öffnen.

### Tests und Build

Empfohlene Reihenfolge:

```bash
npx vitest run
npm run lint
npm run build
```

Das statische Build-Artefakt liegt danach in `dist/` und kann von jedem simplen Webserver ausgeliefert werden.

## Bedienung in Kurzform

1. In **Settings** die Katalog-URL prüfen/anpassen und **Fetch & Index** klicken.
2. Über Suchfeld + Gruppenfilter Kontrollen eingrenzen.
3. Optional Kontrollen per Checkbox auswählen (ohne Auswahl werden alle gefilterten exportiert).
4. **Export CSV** oder **Export Markdown** klicken.
5. Bei Bedarf über **Clear cache** lokale Zwischenspeicherung löschen.

## Datenquelle & Lizenzhinweis

* Die Daten stammen zur Laufzeit aus der öffentlichen „Stand der Technik Bibliothek“ des BSI.
* Lizenz- und Nutzungshinweise des BSI sind zu beachten, bevor Inhalte weiterverwendet werden.
* Dieses Projekt stellt nur eine technische Oberfläche bereit; für Inhalte ist der jeweilige Katalog-Herausgeber verantwortlich.

## Kontakt / Mitmachen

Wenn du Ideen für sinnvolle Erweiterungen hast oder beim Code helfen möchtest, melde dich gern.

[![Mail](https://github.com/sgoettel/sgoettel/blob/main/img/mail.png)](https://github.com/sgoettel/sgoettel/blob/main/img/mail.png)
