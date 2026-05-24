---
title: Haeufige Fragen
description: Antworten zu Installation, MCP-Clients, Schemas und Beitraegen.
---

## Was ist FlowMCP genau?

FlowMCP ist eine Schema-Library + Engine, die Datenquellen zu AI-aufrufbaren Tools normalisiert. Die Library enthaelt aktuell {{stats.count_schemas}} produktionsreife Schemas (v4) ueber {{stats.count_unique_datasources}} Datenquellen. Die Engine routet Calls, validiert Inputs/Outputs und handhabt Authentifizierung. AI-Agenten rufen FlowMCP; FlowMCP ruft die zugrundeliegenden APIs.

## Brauche ich einen MCP-kompatiblen Client?

Nein. FlowMCP ist **CLI-First**. Der MCP-Server-Modus ist optional. Wenn dein Client dynamisches Tool-Loading unterstuetzt, funktioniert MCP — sonst ist die CLI der bevorzugte Einstieg.

## Was bedeutet CLI-First konkret?

Du rufst `flowmcp call <schema>.<tool> '{...}'` aus deinem Terminal, einem LLM-Call oder einem Node/Python-Script. Tools werden bei Bedarf geladen — keine Notwendigkeit, {{stats.count_tools}} Tools im Kontext zu halten.

## Wo leben API-Keys?

API-Keys leben in `~/.flowmcp/.env`, optional mit Projekt-Overrides. Die AI sieht nie einen Key — nur Calls und Antworten. Das ist Absicht: bei direkten REST-Calls aus der AI heraus wuerden Keys exposed.

## Wie fuege ich ein neues Schema hinzu?

Siehe [Specification](/specification/) und `repos/flowmcp-schemas-private` fuer den Schema-Creation-Guide. Validation-Rules haben explizite IDs (z.B. RES001). PRs gehen ins Schemas-Repo mit Tests.

## Kann ich FlowMCP offline nutzen?

Ja — fuer Schemas mit lokalen Ressourcen (z.B. das `gtfs-sqlite-toolkit`-Add-on mit konvertierter SQLite-DB). Fuer Schemas, die Remote-APIs callen, brauchst du weiter Netz.

## Was ist der Spec-Versions-Status?

- **v4** — aktive Produktions-Spec mit Skills, Selections, Output-Schema, Pipes
- **v4.1** — Add-on-Layer (z.B. `gtfs-sqlite-toolkit`)
- **v3** — Archiv, weiter ladbar, aber keine neuen Schemas
- **v1.x / v2** — Legacy, im Archiv

## Warum heisst FlowMCP "MCP", wenn es CLI-First ist?

Der Name kommt vom Projektstart als MCP-Server-Experiment. Die Substanz hat sich verschoben. Eine Namens-Aktualisierung wird intern diskutiert.

## Wie unterscheidet sich FlowMCP von LangChain-Tools oder anderen Agent-Bibliotheken?

Anderer Scope. FlowMCP fokussiert auf die **Schema-Schicht** — normalisierter Zugang zu Datenquellen. Agent-Bibliotheken fokussieren auf die **Orchestration-Schicht** — LLM-Loop, Memory, Planning. Sie ergaenzen sich; du kannst FlowMCP-Schemas in einem LangChain-Agent nutzen.

## Wo melde ich Issues?

GitHub Issues pro Repo. Allgemeine Fragen: [GitHub Discussions](https://github.com/FlowMCP).

## Was ist das v4 Self-Contained Skill Pattern?

Skills bringen ihre eigene Parameter-Referenz mit — Schema-Daten stehen **vor** Workflow-Instruktionen. In einem Labortest erreichten Skills mit vollen Parameter/Enum/Beispiel-Infos 5/5 Erfolg gegen LLMs; Skills mit nur Name + Beschreibung 0/5. Das Pattern ist in der v4-Spec dokumentiert.

## Sind FlowMCP-Schemas frei nutzbar?

Ja, MIT-lizensiert. Manche APIs brauchen Keys (du lieferst sie); die zurueckgegebenen Daten folgen deren Lizenz — z.B. GTFS-Feeds unter CC-BY 4.0 brauchen Attribution im Output. FlowMCP zeigt diese Attribution in der Response.
