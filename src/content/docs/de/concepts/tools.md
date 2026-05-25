---
title: Tools
description: Was ein FlowMCP-Tool ist, wie Tools ausgewaehlt werden und wie der Tool-Execution-Flow funktioniert.
---
<!-- PAGEFIND-META-START -->
<span style="display:none" data-pagefind-meta="section">Concepts</span>
<!-- PAGEFIND-META-END -->

## Was ist ein Tool?

Ein Tool ist eine einzelne, benannte Operation, die ein KI-Agent aufrufen kann. Aus Sicht des Agenten ist das Tool die kleinste Handlungs-Einheit: typisierte Eingaben uebergeben, strukturiertes Ergebnis empfangen. Unter der Haube kapselt das Tool einen einzelnen HTTP-Request an die API eines Daten-Anbieters — der Agent muss das aber nicht wissen. Die Tool-Beschreibung, Parameter-Liste und Result-Form sind alles, was der Agent sieht. Jedes Tool gehoert zu genau einem [Schema](/de/concepts/schemas/), und ein Schema enthaelt typischerweise 2-8 Tools.

## Tool-Auswahl

Tools werden nicht als flache Liste ausgewaehlt. Sie laufen durch einen Funnel — vom Provider ueber Schema und einzelne Tools bis zum kuratierten Tool Set, das ein Agent tatsaechlich nutzt. Nicht jedes Tool wird fuer jede Aufgabe gebraucht; der Funnel erzwingt Relevanz.

![Tool-Auswahl: Provider -> Schemas -> Tools -> Tool Set](/images/tool-auswahl.png)

Ein Tool Set ist die explizite Liste an Tools, die ein Agent aufrufen darf. Es ist Teil der Agent-Definition (siehe [Primitive — Agents](/de/concepts/primitives/#agents)). Dasselbe Tool kann in vielen Tool Sets ueber viele Agents auftauchen; das Tool selbst bleibt gleich.

## Tool-Execution-Flow

Ein Tool-Aufruf durchlaeuft vier Stufen. Erstens ruft der Agent (oder Client) das Tool mit seinem voll-qualifizierten Namen und dem Eingabe-Payload auf. Zweitens validiert die FlowMCP-Runtime den Payload gegen die Parameter-Definitionen im Schema — Typen, Pflichtfelder, Wertebereiche, Enum-Zugehoerigkeit. Drittens, wenn die Validierung passiert, loest die Runtime `requiredServerParams` auf (z.B. API-Keys aus der Umgebung), wendet Modifier wie Header-Injection oder Path-Templating an und fuehrt den HTTP-Request zum Anbieter aus. Viertens wird die Antwort gemaess dem deklarierten Output-Schema geformt und an den Aufrufer zurueckgegeben. Fehler in jeder Stufe produzieren eine strukturierte Fehler-Antwort — nie eine rohe Exception.

Den vollstaendigen Schritt-fuer-Schritt-Kontrakt inkl. Modifier-Hooks (`preRequest`, `postRequest`) dokumentiert die Spezifikation: [FlowMCP Spec v4.1.0 — Tool Execution](/specification/overview/).

## Ein Tool ausprobieren

Der schnellste Weg, ein Tool auszuprobieren, ist die FlowMCP CLI:

```bash
flowmcp search <provider>
flowmcp add <namespace>
flowmcp call <namespace.toolName> '{"param":"wert"}'
```

Die CLI uebernimmt Validierung, Environment-Lookup und HTTP-Execution End-to-End. Fuer programmatische Nutzung steht derselbe Flow ueber die Core-API zur Verfuegung — siehe [Programmatic API](/de/reference/core-methods/).
