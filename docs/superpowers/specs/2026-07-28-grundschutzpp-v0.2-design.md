# Grundschutz++ Explorer v0.2 – Design-Spezifikation

**Stand:** 28. Juli 2026

**Produktname:** Grundschutz++ Explorer

**Funktionsbeschreibung:** Grundschutz++-Referenzansicht

## 1. Produktkern und Einstieg

Der Grundschutz++ Explorer ist die direkt zugängliche, verständliche und
überprüfbare Referenzansicht des aktuellen Grundschutz++-Katalogs. Er öffnet
ohne vorgeschaltete Dokumentauswahl unmittelbar den kuratierten
Grundschutz++-Anwenderkatalog.

Innerhalb der ersten 60 Sekunden soll eine Person:

1. den Explorer öffnen,
2. automatisch den Grundschutz++-Katalog sehen,
3. eine konkrete Anforderung über die Suche oder die Fachstruktur auswählen,
4. Anforderung und Umsetzungshinweis vollständig lesen und
5. Katalogstand, Quelle und Herkunft der angezeigten Informationen prüfen
   können.

Ein vorhandener Cache wird sofort als **„Gespeicherter Katalogstand“**
angezeigt. Gleichzeitig prüft der Explorer den Online-Stand im Hintergrund.
Währenddessen lautet der Status **„Aktualisierung wird geprüft“**. Erst nach
erfolgreichem Abruf, JSON-Parsing, notwendiger Strukturprüfung und Indexierung
darf der Status **„Online-Stand erfolgreich geprüft“** zusammen mit dem
Abrufzeitpunkt erscheinen.

Unterscheidet sich der erfolgreich geprüfte Online-Stand vom gespeicherten Stand,
wird die Ansicht erst nach Abschluss dieser Prüfschritte aktualisiert.
Scheitert der Netzwerkabruf, bleibt der Cache nutzbar und der Explorer
weist verständlich darauf hin, dass der Online-Stand nicht geprüft werden konnte.
Beim ersten Aufruf ohne Cache wird regulär der Online-Katalog geladen.
Normale Aktualisierungen benötigen keine Bestätigungsabfrage.

Suche und Praktikenübersicht sind unmittelbar verfügbar. Die Übersicht ist
kein verpflichtender Zwischenschritt. Direktlinks auf konkrete Anforderungen
öffnen sofort die zugehörige Detailansicht.

Katalog-URL, Cache-Verwaltung und technische Einstellungen liegen außerhalb
des primären Nutzungspfads. Katalogtitel, Version, `last-modified`,
OSCAL-Version, BSI-Herausgeber, Quellpfad und Abrufzeit bilden einen jederzeit
erreichbaren Herkunftsnachweis.

## 2. Fachliche Navigation

Die hierarchische Navigation bildet die fachliche
Grundschutz++-Struktur ab:

1. **Praktik:** originale BSI-Bezeichnung und, soweit im Katalog vorhanden,
   originale BSI-Beschreibung,
2. **Thema:** Bezeichnung innerhalb der ausgewählten Praktik,
3. **Anforderung:** ID, Titel und kompakter Vorschautext.

Der Einstieg zeigt eine Praktikenübersicht. Jede Praktik enthält ihre
BSI-Bezeichnung und die im Katalog vorhandene BSI-Beschreibung. Themen- und
Anforderungsanzahlen werden als vom Explorer berechnete Angaben behandelt und
entsprechend kenntlich gemacht.

Ein Klick auf eine Praktik führt zu ihren Themen und von dort zu den
Anforderungen. Suche und Direktlinks können die vorherigen Ebenen
überspringen. Die Detailansicht zeigt dennoch stets den vollständigen Pfad
**Praktik → Thema → Anforderung** als Breadcrumb.

Der Wechsel zurück zu Thema oder Praktik bleibt direkt möglich, ohne
Suchzustand oder Auswahl unnötig zu verlieren. Es gibt keinen zusätzlichen
allgemeinen OSCAL-Katalogbaum als Hauptoberfläche.

## 3. Suche und Treffer

Die jederzeit sichtbare Suche berücksichtigt:

- Anforderungs-ID und Titel,
- Praktik und Thema,
- Anforderungstext,
- Umsetzungshinweis,
- angezeigte fachliche Grundschutz++-Metadaten wie Modalverb, Handlungswort,
  Dokumentationsempfehlung, Sicherheitsniveau, Zielobjektkategorien,
  Gefährdungen und Schutzziele.

Nicht Teil der normalen Suche sind:

- technische UUIDs,
- Namespace-URLs,
- rohe OSCAL-Feldnamen,
- sonstige nur intern verwendete Strukturinformationen.

ID- und Titeltreffer werden stärker gewichtet als Treffer im
Anforderungstext. Danach folgen Umsetzungshinweis und fachliche Metadaten.

Jeder Treffer zeigt:

- ID und Titel,
- den Pfad **Praktik → Thema → Anforderung**,
- das Feld, in dem der Suchbegriff gefunden wurde,
- einen passenden Textausschnitt.

Trifft eine Anforderung in mehreren Feldern, entsteht nur ein Ergebnis. Die
Ergebnisliste zeigt zunächst den am stärksten gewichteten Treffergrund mit
passendem Textausschnitt. Weitere Trefferfelder können kompakt zusätzlich
genannt werden, ohne für jedes Feld einen eigenen Treffer zu erzeugen.

Ein leerer Suchbegriff führt zurück zur Praktikenübersicht. Die Auswahl eines
Treffers öffnet direkt die zugehörige Detailansicht.

## 4. Anforderungsdetail

Die Detailansicht stellt den fachlichen Inhalt einer Anforderung in dieser
Reihenfolge dar:

1. Pfad, ID und Titel,
2. vollständiger Anforderungstext,
3. vollständiger Umsetzungshinweis,
4. fachlich aufbereitete Grundschutz++-Metadaten,
5. weitere Inhalte, Beziehungen und Herkunftsangaben.

BSI-Texte werden weder zusammengefasst noch umformuliert. Bei jeder
aufbereiteten Angabe bleibt erkennbar, ob sie direkt aus den BSI-Quelldaten
stammt oder vom Explorer angeordnet, aufgelöst oder beschriftet wurde.

### Parameter

Parameterwerte werden lesbar in den Text eingesetzt. Die eingesetzten Stellen
bleiben dezent und barrierearm als Parameterstellen markiert. Die Erläuterung
darf nicht ausschließlich per Hover zugänglich sein.

Ein einfaches `details`-Element zeigt bei Bedarf:

- die ursprüngliche OSCAL-Insert-Anweisung beziehungsweise
  Parameterreferenz,
- die Parameter-ID,
- das Label,
- die Values.

Eine zweite vollständige Textfassung ist in v0.2 nicht vorgesehen.

### Bekannte fachliche Angaben

Bekannte Props werden unabhängig davon fachlich zugeordnet, ob sie auf
Control- oder Part-Ebene liegen. Sie werden dabei nicht verlustbehaftet über
die Ebenen zusammengeführt. Ursprungsebene, Namespace und logischer Quellpfad
bleiben nachvollziehbar.

Insbesondere gilt:

- `sec_level` ist das Sicherheitsniveau.
- `control.class` ist nicht das Sicherheitsniveau.
- `control.class` darf als technische Herkunfts- oder Klassifikationsangabe
  erscheinen.
- `statement.props` bleiben erhalten; dies umfasst insbesondere `modal_verb`,
  `action_word`, `result`, `result_specification` und `documentation`.

Parts, verschachtelte Parts, Props, Titel und Remarks bleiben im Datenmodell
beziehungsweise zugehörigen Rohobjekt vollständig erhalten. Die Hauptansicht
zeigt sie dort, wo sie fachlich relevant sind. Sonstige Inhalte erscheinen
geordnet unter **„Weitere Inhalte“**, damit keine rohe OSCAL-Struktur die
Referenzansicht dominiert.

Alle fachlich relevanten statement- und guidance-Parts einschließlich relevanter
verschachtelter Parts werden berücksichtigt; die Darstellung darf nicht auf den
jeweils ersten Treffer beschränkt werden

### Noch nicht fachlich eingeordnete Metadaten

Unbekannte oder künftig neu hinzukommende Props blockieren den regulären
Eintrag nicht. Sie erscheinen unter:

**„Weitere Metadaten (noch nicht fachlich eingeordnet)“**

Je Prop werden angezeigt:

- ursprünglicher Name,
- Wert,
- Namespace, sofern vorhanden,
- Ebene beziehungsweise Herkunft als Control oder Part,
- logischer Quellpfad.

Nur wenn der Namespace dies tatsächlich belegt, wird eine Angabe als
„BSI-Metadatum“ bezeichnet. Andernfalls lautet die neutrale Bezeichnung
„Metadatum“. Bereits fachlich aufbereitete Props erscheinen nicht zusätzlich
im Fallback. Unbekannte Props erzeugen nur einen unaufdringlichen Hinweis und
keine Inkompatibilitätswarnung.

## 5. Datenmodell und Nachvollziehbarkeit

„Verlustfrei“ bedeutet für v0.2 primär: Der unverändert geladene Katalog bleibt
als Quelldokument erhalten. Die interne fachliche Sicht ist eine davon
getrennte Projektion und verändert oder ersetzt die Quelldaten nicht.

v0.2 modelliert nicht das vollständige OSCAL-Schema neu. Bekannte und für den
Explorer benötigte Strukturen werden typisiert aufbereitet. Unbekannte Felder
bleiben über die zugehörigen Rohobjekte erhalten und zugänglich, statt für
jedes mögliche OSCAL-Feld eigene Anwendungstypen einzuführen.

Die Projektion berücksichtigt insbesondere:

- Groups, Controls, Parts und verschachtelte Parts,
- Props mit Ursprungsebene, Namespace und logischem Quellpfad,
- Parameter mit Label, Values und Referenzen,
- Links und Beziehungen wie `required` und `related`,
- Back-Matter-Ressourcen und deren Verweise,
- unbekannte Felder über die zugehörigen Rohobjekte.

„Zugänglich“ bedeutet in diesem Zusammenhang: für Projektion, Fallback und
technische Herkunftsdetails verfügbar. v0.2 führt keinen allgemeinen
Roh-JSON-Viewer ein.

Ein logischer Quellpfad beschreibt die fachliche Position, beispielsweise
**Control → statement-Part → Prop**. Exakte Zeilen-, Zeichen- oder
Bytepositionen sind nicht erforderlich.

Die Referenzansicht unterscheidet transparent:

- **BSI-Quelldaten:** unverändert übernommene Inhalte und Metadaten,
- **Parameterauflösung:** vom Explorer eingesetzte und weiterhin markierte
  Parameterwerte,
- **Explorer-Ableitung:** beispielsweise Anzahlen, Suchgewichtung,
  Treffergründe, Anordnung und Anzeigebezeichnungen.

Links, Beziehungen und Back-Matter bleiben vollständig im Quelldokument
bewahrt. In v0.2 werden nur die für die Referenzansicht benötigten Verweise
fachlich aufgelöst. Daraus entsteht keine allgemeine OSCAL-Linkanalyse.

Warnungen unterscheiden zwei Fälle:

1. Ein Inhalt ist vorhanden, aber noch nicht fachlich aufbereitet. Er bleibt
   zugänglich und erscheint im vorgesehenen Fallback.
2. Eine wesentliche Katalogstruktur konnte nicht zuverlässig verarbeitet
   werden. Die Darstellung wird nicht stillschweigend als vollständig
   ausgegeben.

Ein neuer Online-Stand ersetzt den letzten funktionierenden Cache erst,
nachdem Abruf, JSON-Parsing, notwendige Strukturprüfung und Indexierung
erfolgreich abgeschlossen wurden.

## 6. Katalogstatus, Quelle und Fehlerzustände

Die kuratierte Standardquelle ist ausschließlich:

- **Repository:** `BSI-Bund/Stand-der-Technik-Bibliothek`
- **Branch:** `main`
- **Quellpfad:**
  `control_layer/Grundschutz++/Grundschutz++-resolved_catalog.json`

„Online-Stand erfolgreich geprüft“ bedeutet ausschließlich: Die kuratierte
Datei auf `main` wurde zum angezeigten Abrufzeitpunkt erfolgreich geladen,
geprüft und indexiert. Daraus folgt keine revisionsfeste oder dauerhaft
gültige Aussage. v0.2 führt keinen GitHub-API-Aufruf zur Commit-Ermittlung
durch und verwendet nicht die Bezeichnung „revisionsfest“.

Der Herkunftsnachweis unterscheidet:

- **Aus den BSI-Quelldaten:** Katalogtitel, Version, `last-modified`,
  OSCAL-Version und Herausgeber,
- **Explorer-Angaben:** Abrufzeit, Anzeigezustand und Aufbereitungsstatus,
- **Aus dem BSI-Repository:** Lizenz und Attribution, sofern diese nicht
  unmittelbar im Katalog dokumentiert sind.

Repository und konkreter Quellpfad werden verlinkt.

Der Explorer verwendet klar unterscheidbare Zustände:

- **Gespeicherter Katalogstand – Aktualisierung wird geprüft**
- **Online-Stand erfolgreich geprüft**, mit unmittelbar angezeigtem
  Abrufzeitpunkt
- **Gespeicherter Katalogstand – Online-Stand konnte nicht geprüft werden**
- **Kein gespeicherter Katalog – Online-Katalog wird geladen**
- **Online-Katalog konnte nicht zuverlässig verarbeitet werden**

Bei einem Fehler bleibt der letzte funktionierende Cache derselben Quelle
nutzbar. Technische Details können ergänzend geöffnet werden; die primäre
Meldung beschreibt verständlich, was geprüft wurde und welche Daten weiterhin
angezeigt werden.

Kuratierte BSI-Quelle und benutzerdefinierte Quellen besitzen getrennte
Cache-Einträge. Eine benutzerdefinierte Quelle darf den letzten
funktionierenden Cache der kuratierten BSI-Quelle weder ersetzen noch als
diesen anzeigen. Auch ein Cache-Rückfall verwendet ausschließlich den Cache
derselben Quelle.

Eine eigene Katalog-URL bleibt in nachrangigen Einstellungen möglich. Bei
Verwendung einer abweichenden URL kennzeichnet der Explorer sie eindeutig als
benutzerdefinierte Quelle und bezeichnet sie nicht als aktuellen
BSI-Grundschutz++-Online-Stand.

## 7. Umfang von v0.2 und Qualitätsnachweis

### Verbindlicher Produktkern

Zum Zielumfang von v0.2 gehören:

- automatischer Abruf mit quellenspezifischem Cache und transparentem Status,
- Praktikenübersicht und hierarchische Fachnavigation,
- gewichtete und nachvollziehbare Suche,
- vollständige Darstellung von Anforderung und Umsetzungshinweis,
- korrekte Verarbeitung der benötigten Control- und Part-Props,
- markierte und rückverfolgbare Parameterauflösung,
- sichtbarer Fallback für unbekannte Metadaten,
- Herkunftsnachweis und klare Trennung von BSI-Daten und
  Explorer-Ableitungen.

Bestehende CSV- und Markdown-Exporte bleiben nachrangig erhalten und werden an
das korrigierte fachliche Modell angepasst. Die benutzerdefinierte
Katalogquelle bleibt eine nachrangige Einstellung.

### Bewusst nachgelagert oder ausgeschlossen

Bewusst nachgelagert sind:

- Versionsvergleich,
- semantische Konsistenzhinweise,
- weitergehende Beziehungs- und Linkanalysen.

Außerhalb des Produkts bleiben:

- eine allgemeine OSCAL-Suite,
- Component Definitions,
- Mapping Collections,
- Graph-, Sunburst- und Balkenansichten,
- eine Rohdatei-Arbeitsumgebung,
- die Nachbildung sämtlicher Filter des Community-Viewers,
- SSP-, Assessment- und ISMS-Funktionen.

### Verbindliche fachliche Prüfliste

| Prüfpunkt | Einordnung | Konsequenz |
| --- | --- | --- |
| `control.class` ist nicht das Sicherheitsniveau; maßgeblich ist `sec_level`. | Für v0.2 verbindlich | Beide Angaben werden fachlich getrennt und korrekt bezeichnet. |
| BSI-spezifische Props können auf Control- und Part-Ebene liegen. | Für v0.2 verbindlich | Ebene, Namespace und logischer Quellpfad bleiben erhalten. |
| `statement.props` mit `modal_verb`, `action_word`, `result`, `result_specification` und `documentation` bleiben erhalten. | Für v0.2 verbindlich | Die benötigten Props werden typisiert aufbereitet und fachlich angezeigt. |
| Unbekannte oder künftig neue Props dürfen nicht verloren gehen. | Für v0.2 verbindlich | Sie bleiben im Rohobjekt erhalten und erscheinen ohne Duplikate im sichtbaren Fallback. |
| Parts einschließlich Props, Titel, Remarks und verschachtelter Parts müssen bewahrt werden. | Für v0.2 verbindlich | Das Quelldokument bleibt unverändert; benötigte Strukturen werden projiziert, sonstige geordnet als weitere Inhalte zugänglich gemacht. |
| Parameter benötigen Label und Values; aufgelöste Stellen bleiben erkennbar und rückverfolgbar. | Für v0.2 verbindlich | Inline-Markierung und zugängliche technische Details zeigen Referenz, ID, Label und Values. |
| Links, `required`, `related` und Back-Matter-Verweise dürfen nicht stillschweigend verloren gehen. | Für v0.2 verbindlich | Vollständige Bewahrung im Quelldokument; fachliche Auflösung nur für die Referenzansicht. |
| Allgemeine OSCAL-Link- und Beziehungsanalyse. | Bewusst nachgelagert | v0.2 baut keine universelle Analysefunktion. |
| Namespaces und Quellpfade müssen erhalten bleiben. | Für v0.2 verbindlich | Angezeigte und unbekannte Metadaten bleiben ihrer Herkunft zuordenbar. |
| Zielobjektkategorien, Gefährdungen und Schutzziele. | Noch am aktuellen BSI-Katalog zu verifizieren | Lage, Namespaces und Wertsemantik werden gegen den kuratierten resolved catalog geprüft und anschließend für Anzeige und Suche fachlich zugeordnet. |
| Eine verlustbehaftete Teilansicht darf nicht stillschweigend als vollständig erscheinen. | Für v0.2 verbindlich | Noch nicht aufbereitete Inhalte und nicht zuverlässig verarbeitbare Strukturen erhalten unterschiedliche Hinweise. |

### Qualität und Arbeitsweise

v0.2 wird in kleine, sequenzielle und voneinander prüfbare Meilensteine
zerlegt. Es gibt keinen Big-Bang-Umbau und keine parallele Umsetzung aller
Punkte. Jeder Meilenstein erhält eigene Tests, muss für sich reviewbar sein und
einen kleinen, fokussierten Diff erzeugen.

Die Tests verwenden kleine synthetische Fixtures und prüfen mindestens:

- Parsing und Projektion von Control-, Part- und unbekannten Props,
- Erhalt der unveränderten Quelldaten, Rohobjekte und logischen Quellpfade,
- korrekte Unterscheidung von `sec_level` und `control.class`,
- Parameterauflösung einschließlich Label, Values und Referenz,
- Suchgewichtung, Treffergrund, Textausschnitt und Zusammenführung mehrerer
  Trefferfelder pro Anforderung,
- getrennte Cache-Einträge und sichere Cache-Ersetzung,
- Exportregressionen für CSV und Markdown,
- verständliche Zustände bei Abruf- und Strukturfehlern.

Der Qualitätsnachweis bezieht sich nicht auf eine vollständige Nachbildung des
OSCAL-Schemas. Geprüft werden die unveränderte Bewahrung des Quelldokuments und
die korrekte Projektion der für den Explorer benötigten Strukturen.

Nach Abschluss von v0.2 wird der 60-Sekunden-Nutzungsfall zusätzlich im
direkten Vergleich mit dem Community-Viewer geprüft. Zeigt der
Grundschutz++ Explorer dabei keinen klaren Vorteil beim unmittelbaren
Verstehen und Nachschlagen von Grundschutz++, wird die weitere Pflege des
Projekts grundsätzlich neu bewertet.
