# KI-unterstützte Entwicklung

Der Grundschutz++ Explorer entstand in einem menschlich gesteuerten,
KI-unterstützten Entwicklungsprozess. KI-Werkzeuge wurden unter anderem für
Entwurf, Implementierung, Analyse, Fehlersuche und Review eingesetzt.
Produktentscheidungen, fachliche Entscheidungen, Freigaben und die Verantwortung
für das Ergebnis lagen beim Projektverantwortlichen. KI-Ausgaben wurden nicht
ungeprüft übernommen.

Designentscheidungen und Implementierung wurden grundsätzlich voneinander
getrennt. Änderungen entstanden in kleinen, überprüfbaren Chunks; parallele,
widersprüchliche Änderungen mehrerer KI-Agenten am selben Arbeitsstand wurden
vermieden. Soweit es für den jeweiligen Schritt sinnvoll war, wurde
testgetrieben gearbeitet.

Die Änderungen wurden anhand ihrer Diffs geprüft. Zur technischen Kontrolle
dienten automatisierte Tests, Linting und Produktionsbuilds. Relevante
Oberflächenänderungen wurden zusätzlich im Browser visuell geprüft. Commit und
Push erfolgten nach menschlicher Prüfung beziehungsweise Freigabe. Auch bei
KI-Unterstützung verbleibt die Verantwortung beim Menschen.

## Orientierung

Als Orientierungshilfen dienten:

- OpenSSF:
  [Security-Focused Guide for AI Code Assistant Instructions](https://best.openssf.org/Security-Focused-Guide-for-AI-Code-Assistant-Instructions)
- GitHub:
  [Review AI-generated code](https://docs.github.com/en/copilot/tutorials/review-ai-generated-code)

Diese Links sind Orientierungshilfen. Das Projekt behauptet keine
Zertifizierung, Prüfung, Billigung oder formale Konformität durch OpenSSF oder
GitHub.
