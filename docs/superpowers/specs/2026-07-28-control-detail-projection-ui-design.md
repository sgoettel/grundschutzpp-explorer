# Control Detail Projection UI Design

**Stand:** 28. Juli 2026

## Ziel

Die Anforderungsdetailansicht verwendet die bereits vorhandenen verlustarmen
Projektionen für Parameter und Metadaten. Sie zeigt Parameterstellen lesbar,
markiert und rückverfolgbar sowie bekannte und unbekannte Metadaten
fachlich korrekt und ohne Duplikate an.

## Umfang

Die Umsetzung besteht aus zwei aufeinanderfolgenden, einzeln testbaren
Meilensteinen:

1. Parameterauflösung in der Detailansicht,
2. fachliche Metadaten- und Fallback-Darstellung.

Suche, Cache, Exporte, Navigation und das OSCAL-Datenmodell werden in diesen
Meilensteinen nicht erweitert.

## Meilenstein 1: Parameterauflösung

Eine fokussierte `ResolvedProse`-Komponente verwendet ausschließlich
`resolveParameterInserts()` aus `src/lib/parameters.ts`. Textsegmente werden
unverändert ausgegeben. Eingesetzte Parameterwerte werden inline sichtbar und
barrierearm markiert.

Jede Parameterstelle enthält ein ohne Hover erreichbares `details`-Element mit:

- der ursprünglichen Insert-Anweisung,
- der Parameter-ID,
- dem Label, sofern vorhanden,
- allen Values.

Der erste nicht leere Value bleibt der bevorzugte Anzeigetext. Fehlt er, folgt
das Label und danach `[parameter-id]`. Auch nicht auflösbare Referenzen bleiben
sichtbar und rückverfolgbar.

`ControlDetail` verwendet die Komponente für Anforderung, Umsetzungshinweis und
weitere direkte Inhalte. Die bisherige lokale Label-only-Auflösung und der
separate, dadurch doppelte Konkretisierungsblock entfallen.

## Meilenstein 2: Metadatenprojektion

Eine fokussierte `ControlMetadata`-Komponente konsumiert
`ControlRecord.metadata` und die technische `control.class`-Angabe.

Bekannte Props werden anhand fachlicher Bezeichnungen dargestellt. Dabei gilt
verbindlich:

- `sec_level` heißt **„Sicherheitsniveau“**,
- `control.class` heißt **„Technische Klassifikation“** und niemals
  „Sicherheitsniveau“,
- Props von Control- und Part-Ebene werden berücksichtigt,
- Ursprungsebene und logischer Quellpfad bleiben in technischen Details
  nachvollziehbar.

Unbekannte Props erscheinen ausschließlich unter
**„Weitere Metadaten (noch nicht fachlich eingeordnet)“**. Je Prop werden
ursprünglicher Name, Wert, Namespace (sofern vorhanden), Ursprungsebene und
logischer Quellpfad angezeigt. Der neutrale Begriff „Metadatum“ wird verwendet,
solange der Namespace keine BSI-Zuordnung zuverlässig belegt.

Die bisherige direkte Wiedergabe ausschließlich von `control.props` entfällt,
damit bekannte oder unbekannte Props nicht doppelt erscheinen.

## Komponenten und Datenfluss

- `ResolvedProse` erhält `prose` und `CatalogParam[]`, ruft den reinen Resolver
  auf und rendert dessen Segmente.
- `ControlMetadata` erhält einen `ControlRecord` und rendert dessen vorhandene
  Projektion sowie `control.class`.
- `ControlDetail` bleibt für Reihenfolge und Auswahl der fachlichen Abschnitte
  verantwortlich, enthält aber keine eigene Parameter- oder
  Metadatenauflösungslogik mehr.

Es werden keine Quelldaten mutiert. Rohobjekte, Values, Namespace und
Quellpfade bleiben in den bestehenden Projektionen erhalten.

## Fehler- und Leerzustände

- Nicht-stringförmige oder leere Prosa erzeugt keinen Inhaltsblock.
- Fehlende Parameter werden als `[parameter-id]` angezeigt.
- Fehlende Label oder Values werden in den technischen Details neutral mit
  „–“ dargestellt.
- Eine leere Metadatenprojektion und eine fehlende Klassifikation erzeugen
  keinen Metadatenabschnitt.

## Tests und Qualitätsnachweis

Für jeden Meilenstein wird zuerst ein fehlschlagender React-Komponententest
geschrieben und sein erwartetes Scheitern beobachtet.

Der Parameter-Test prüft den eingesetzten Value, die sichtbare Markierung und
die technischen Angaben einschließlich Original-Insert, ID, Label und aller
Values.

Der Metadaten-Test prüft die getrennte Bezeichnung von `sec_level` und
`control.class`, die Darstellung eines Part-Props sowie den vollständigen
Fallback eines unbekannten Props.

Nach beiden RED-GREEN-Zyklen werden alle Tests, ESLint und der
Produktions-Build ausgeführt.
