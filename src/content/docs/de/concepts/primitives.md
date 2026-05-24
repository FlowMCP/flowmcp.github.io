---
title: Primitive
description: Die vier FlowMCP-Primitive — Resources, Prompts, Skills, Agents — kurz erklaert.
---

FlowMCP gruppiert alles, was ein KI-Agent braucht, in vier Primitive: Resources, Prompts, Skills, Agents. Die ersten drei leben in einem [Schema](/de/concepts/schemas/) und beschreiben, was ein Anbieter bietet. Agents kombinieren Tools aus mehreren Schemas zu einer aufgaben-spezifischen Einheit. Diese Seite gibt einen kurzen, konzeptionellen Ueberblick — fuer die vollstaendigen Felddefinitionen, Validierungsregeln und Beispiele folgen Sie den Spec-Links pro Abschnitt.

## Resources

Eine Resource ist ein lokales Dataset, das mit einem Schema gebuendelt wird, typischerweise eine SQLite-Datenbank. Die FlowMCP-Runtime laedt die `.db`-Datei und stellt jede definierte Abfrage als MCP-Resource bereit — keine Netzwerk-Calls, keine API-Keys, keine Rate-Limits. Resources eignen sich ideal fuer Bulk-Open-Data wie Unternehmensregister, Fahrplaene oder Sanktionslisten, wo die Daten gross sind, sich selten aendern und Offline-Zugriff zaehlt.

Spec: [Resources](/specification/resources/).

## Prompts

Ein Prompt ist ein erklaerender Text, der an einen Namespace gebunden ist. Prompts erklaeren einem KI-Agenten, wie die Tools eines Anbieters zusammen funktionieren — Pagination-Muster, Fehler-Semantik, Hinweise zu Rate-Limits, wie Endpoints kombiniert werden. Prompts **erklaeren**, sie **instruieren** nicht. Sie sind modellneutral, sodass jeder AI-Client profitiert.

Spec: [Prompts](/specification/prompts/).

## Skills

Ein Skill ist eine mehrstufige Workflow-Instruktion, die im Schema eingebettet ist. Waehrend ein Prompt Kontext erklaert, sagt ein Skill einem LLM exakt, was zu tun ist, Schritt fuer Schritt: welches Tool zuerst aufgerufen wird, wie das Ergebnis weitergegeben wird, wann verzweigt wird. Jeder Skill deklariert seine Tool-Abhaengigkeiten, definiert typisierte Eingabe-Parameter und vermerkt, mit welchem Modell er getestet wurde.

Spec: [Skills](/specification/skills/).

## Agents

Ein Agent ist eine aufgaben-getriebene Komposition, die Tools aus mehreren Anbietern zu einer einzelnen, testbaren Einheit buendelt. Waehrend einzelne Schemas eine einzelne API kapseln, kombinieren Agents die richtigen Tools fuer eine konkrete Aufgabe — ein Mobility-Agent koennte etwa Tools aus einem Fahrplan-Schema, einem Wetter-Schema und einem Bike-Sharing-Schema gleichzeitig ziehen. Ein Agent hat sein eigenes LLM, einen eigenen System-Prompt und ein kuratiertes Tool-Set und durchlaeuft eine Agentic Loop — Frage verstehen, Tool waehlen, Ergebnis bewerten, entscheiden, ob mehr Information noetig ist.

![Agent-Aufbau: LLM, System Prompt, Skills, Tool Set mit Agentic Loop](/images/agent-manifest-aufbau.png)

FlowMCP kennt drei Nutzungs-Architekturen, von einfach zu komplex: Stufe 1 (Tools Only — die KI des Nutzers ruft Tools direkt auf, kein zusaetzliches LLM), Stufe 2 (Sub-Agent — ein spezialisierter Agent mit eigenem LLM und Agentic Loop), Stufe 3 (Orchestrierung — ein Koordinator-Agent verteilt Arbeit an mehrere Sub-Agents). Nicht jede Anfrage braucht einen vollen Agent; viele Use-Cases sind mit Stufe 1 perfekt bedient.

![Drei Nutzungsarchitekturen: Tools Only, Sub-Agent, Orchestrierung](/images/diagram-2-usage-architectures.png)

Spec: [Agents](/specification/agents/).
