---
title: Haeufige Fragen
description: Antworten zu Installation, MCP-Clients, Schemas und Beitraegen.
---

<details>
<summary>Was ist FlowMCP genau?</summary>

FlowMCP ist eine Schema-Library + Engine, die Datenquellen zu AI-aufrufbaren Tools normalisiert. Die Library enthaelt aktuell — produktionsreife Schemas (v4) ueber — Datenquellen. Die Engine routet Calls, validiert Inputs/Outputs und handhabt Authentifizierung. AI-Agenten rufen FlowMCP; FlowMCP ruft die zugrundeliegenden APIs.

</details>

<details>
<summary>Brauche ich einen MCP-kompatiblen Client?</summary>

Nein. FlowMCP ist **CLI-First**. Der MCP-Server-Modus ist optional. Wenn dein Client dynamisches Tool-Loading unterstuetzt, funktioniert MCP — sonst ist die CLI der bevorzugte Einstieg.

</details>

<details>
<summary>Was bedeutet CLI-First konkret?</summary>

Du rufst `flowmcp call <schema>.<tool> '{...}'` aus deinem Terminal, einem LLM-Call oder einem Node/Python-Script. Tools werden bei Bedarf geladen — keine Notwendigkeit, — Tools im Kontext zu halten.

</details>

<details>
<summary>Wo leben API-Keys?</summary>

API-Keys leben in `~/.flowmcp/.env`, optional mit Projekt-Overrides. Die AI sieht nie einen Key — nur Calls und Antworten. Das ist Absicht: bei direkten REST-Calls aus der AI heraus wuerden Keys exposed.

</details>

<details>
<summary>Wie fuege ich ein neues Schema hinzu?</summary>

Siehe [Specification](/specification/) und `repos/flowmcp-schemas-private` fuer den Schema-Creation-Guide. Validation-Rules haben explizite IDs (z.B. RES001). PRs gehen ins Schemas-Repo mit Tests.

</details>

<details>
<summary>Kann ich FlowMCP offline nutzen?</summary>

Ja — fuer Schemas mit lokalen Ressourcen (z.B. das `gtfs-sqlite-toolkit`-Add-on mit konvertierter SQLite-DB). Fuer Schemas, die Remote-APIs callen, brauchst du weiter Netz.

</details>

<details>
<summary>Was ist der Spec-Versions-Status?</summary>

FlowMCP unterstuetzt aktuell die **v4**-Spezifikation (aktiv) und **v4.1**-Add-on-Erweiterungen (z.B. `gtfs-sqlite-toolkit`). Aeltere Versionen (v3, v2, v1.x) bleiben aus Kompatibilitaetsgruenden ladbar, erhalten aber keine neuen Schemas.

</details>

<details>
<summary>Warum heisst FlowMCP "MCP", wenn es CLI-First ist?</summary>

Der Name kommt vom Projektstart als MCP-Server-Experiment. Die Substanz hat sich Richtung CLI-First-Schema-Layer verschoben; der Name bleibt fuer Kontinuitaet mit dem MCP-Oekosystem.

</details>

<details>
<summary>Wo melde ich Issues?</summary>

GitHub Issues pro Repo. Finde das passende Repository unter [github.com/FlowMCP](https://github.com/FlowMCP) und oeffne dort ein Issue. Fuer Schema-Fragen: `flowmcp-schemas`. Fuer CLI-Bugs: `flowmcp-cli`.

</details>

<details>
<summary>Was ist das v4 Self-Contained Skill Pattern?</summary>

Skills bringen ihre eigene Parameter-Referenz mit — Schema-Daten stehen **vor** Workflow-Instruktionen. In einem Labortest erreichten Skills mit vollen Parameter/Enum/Beispiel-Infos 5/5 Erfolg gegen LLMs; Skills mit nur Name + Beschreibung 0/5. Das Pattern ist in der v4-Spec dokumentiert.

</details>

<details>
<summary>Sind FlowMCP-Schemas frei nutzbar?</summary>

Ja, MIT-lizensiert. Manche APIs brauchen Keys (du lieferst sie); die zurueckgegebenen Daten folgen deren Lizenz — z.B. GTFS-Feeds unter CC-BY 4.0 brauchen Attribution im Output. FlowMCP zeigt diese Attribution in der Response.

</details>
