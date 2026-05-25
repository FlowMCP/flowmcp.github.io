---
title: Clients und Kompatibilitaet
description: Wo man Schemas und Agents nutzen kann, welche Clients was unterstuetzen, und was CLI bedeutet.
---
<!-- PAGEFIND-META-START -->
<span style="display:none" data-pagefind-meta="section">Concepts</span>
<!-- PAGEFIND-META-END -->

## MCP — Das verbindende Protokoll

Das **Model Context Protocol (MCP)** ist der Standard, ueber den KI-Clients auf Tools zugreifen. Es definiert, wie Tools beschrieben, aufgerufen und wie Ergebnisse zurueckgeliefert werden. Ueber 100 Clients unterstuetzen MCP bereits — von Claude ueber ChatGPT bis Cursor.

FlowMCP-Schemas basieren auf MCP und funktionieren mit jedem kompatiblen Client. Du bist nicht an einen bestimmten Anbieter gebunden.

![MCP-Kompatibilitaet](../../../../assets/diagram-3-mcp-compatibility.png)

## Kompatibilitaetstabelle

Nicht jeder Client kann alles. Die Faehigkeiten haengen davon ab, welche MCP-Features der Client unterstuetzt:

| Level | Was wird unterstuetzt | Anzahl Clients | Beispiele |
|-------|----------------------|---------------|-----------|
| **Level 1: Tools** | Einzelne Tool-Aufrufe, Resources, Prompts | 46+ Clients | Claude, ChatGPT, Cursor, VS Code Copilot, Cline, Continue |
| **Level 2+3: Elicitation** | Alles aus Level 1 + Agent kann Rueckfragen stellen | 16 Clients | Claude Code, Claude Desktop, OpenClaw, Codex, Cursor, Postman |
| **Custom CLI** | Commandline-Interfaces fuer direkten Zugriff | FlowMCP CLI, OpenClaw Plugin | Fuer Entwickler und Automatisierung |

Was die Levels bedeuten: [Primitive — Agents](/de/concepts/primitives/#agents)

**Stand:** 2026-05-24. Aktuelle MCP-Client-Liste: [modelcontextprotocol.io/clients](https://modelcontextprotocol.io/clients)

## Clients mit Elicitation (Level 2+3)

Diese 16 Clients unterstuetzen Elicitation — der Agent kann Rueckfragen stellen fuer bessere Antworten: AIQL TUUI, Claude Code, Codex, Cursor, fast-agent, Glama, goose, Joey, mcp-agent, mcp-use, MCPJam, Memgraph Lab, Postman, Tambo, VS Code GitHub Copilot und VT Code.

## OpenClaw

[OpenClaw](https://docs.openclaw.ai) ist ein Open-Source AI Assistant Gateway mit Plugin-System. Die Besonderheit: **Cron Jobs** — wiederkehrende Abfragen, die automatisch laufen. Zum Beispiel jeden Morgen um 7:30 Uhr eine Mobilitaetsempfehlung.

Mehr dazu: [Integration Guide](/de/guides/integration/)

Fuer die Commandline-Schnittstelle — Tools im Terminal suchen, aktivieren und aufrufen — siehe die [FlowMCP CLI-Nutzung](/de/reference/cli/) Referenz.

## Welcher Client fuer wen?

| Du bist... | Empfohlener Client | Warum |
|-----------|-------------------|-------|
| **Privatperson** | OpenClaw oder Claude Desktop | Dort wo du bereits bist, Cron Jobs fuer Automatisierung |
| **Entwickler** | Claude Code, Cursor oder FlowMCP CLI | Direkte Kontrolle, schnelles Testen, IDE-Integration |
| **Unternehmen** | NemoClaw (Enterprise-Sicherheit) | Deny-by-default Policies, Sandbox-Isolation, Audit-Trail |

Details zu Enterprise-Integration: [Integration Guide](/de/guides/integration/)
