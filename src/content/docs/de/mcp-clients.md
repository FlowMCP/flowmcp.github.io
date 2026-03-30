---
title: Clients und Kompatibilitaet
description: Wo man Schemas und Agents nutzen kann, welche Clients was unterstuetzen, und was CLI bedeutet.
---

## MCP — Das verbindende Protokoll

Das **Model Context Protocol (MCP)** ist der Standard, ueber den KI-Clients auf Tools zugreifen. Es definiert, wie Tools beschrieben, aufgerufen und wie Ergebnisse zurueckgeliefert werden. Ueber 100 Clients unterstuetzen MCP bereits — von Claude ueber ChatGPT bis Cursor.

Unsere Schemas basieren auf MCP und funktionieren mit jedem kompatiblen Client. Du bist nicht an einen bestimmten Anbieter gebunden.

![MCP-Kompatibilitaet](../../../assets/diagram-3-mcp-compatibility.png)

## Kompatibilitaetstabelle

Nicht jeder Client kann alles. Die Faehigkeiten haengen davon ab, welche MCP-Features der Client unterstuetzt:

| Level | Was wird unterstuetzt | Anzahl Clients | Beispiele |
|-------|----------------------|---------------|-----------|
| **Level 1: Tools** | Einzelne Tool-Aufrufe, Resources, Prompts | 46+ Clients | Claude, ChatGPT, Cursor, VS Code Copilot, Cline, Continue |
| **Level 2+3: Elicitation** | Alles aus Level 1 + Agent kann Rueckfragen stellen | 16 Clients | Claude Code, Claude Desktop, OpenClaw, Codex, Cursor, Postman |
| **Custom CLI** | Commandline-Interfaces fuer direkten Zugriff | FlowMCP CLI, OpenClaw Plugin | Fuer Entwickler und Automatisierung |

Was die Levels bedeuten: [Agents und Architekturen →](/de/agents/)

**Stand:** Maerz 2026. Aktuelle Liste: [modelcontextprotocol.io/clients](https://modelcontextprotocol.io/clients)

## Clients mit Elicitation (Level 2+3)

Diese 16 Clients unterstuetzen Elicitation — der Agent kann Rueckfragen stellen fuer bessere Antworten:

1. AIQL TUUI
2. Claude Code
3. Codex
4. Cursor
5. fast-agent
6. Glama
7. goose
8. Joey
9. mcp-agent
10. mcp-use
11. MCPJam
12. Memgraph Lab
13. Postman
14. Tambo
15. VS Code GitHub Copilot
16. VT Code

Warum Elicitation so wichtig ist: [Agents und Architekturen → Elicitation](/de/agents/#elicitation-wenn-der-agent-rueckfragen-stellt)

## CLI — Commandline-Interfaces

Neben grafischen Clients gibt es Commandline-Interfaces, die besonders fuer Entwickler und Automatisierung relevant sind.

### FlowMCP CLI

Der schnellste Weg fuer Entwickler, um Schemas zu finden und Tools auszuprobieren:

- `flowmcp list` — Alle verfuegbaren Schemas anzeigen
- `flowmcp search <query>` — Schemas nach Stichwort suchen
- `flowmcp add <schema>` — Ein Schema aktivieren
- `flowmcp call <tool> '{...}'` — Ein Tool direkt aufrufen

Dokumentation: [docs.flowmcp.org](https://docs.flowmcp.org)

### OpenClaw

[OpenClaw](https://docs.openclaw.ai) ist ein Open-Source AI Assistant Gateway mit Plugin-System. Die Besonderheit: **Cron Jobs** — wiederkehrende Abfragen, die automatisch laufen. Zum Beispiel jeden Morgen um 7:30 Uhr eine Mobilitaetsempfehlung.

Mehr dazu: [Integration →](/de/integration/)

## Welcher Client fuer wen?

| Du bist... | Empfohlener Client | Warum |
|-----------|-------------------|-------|
| **Privatperson** | OpenClaw (WhatsApp, Telegram, Slack) oder Claude Desktop | Dort wo du bereits bist, Cron Jobs fuer Automatisierung |
| **Entwickler** | Claude Code, Cursor oder FlowMCP CLI | Direkte Kontrolle, schnelles Testen, IDE-Integration |
| **Unternehmen** | NemoClaw (Enterprise-Sicherheit) | Deny-by-default Policies, Sandbox-Isolation, Audit-Trail |

Details zu Enterprise-Integration: [Integration → NemoClaw](/de/integration/#enterprise-sicherheit-mit-nemoclaw)
