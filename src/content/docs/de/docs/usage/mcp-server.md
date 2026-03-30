---
title: MCP Server
description: FlowMCP als MCP-Server betreiben fuer die Integration mit Claude Desktop, Cursor und anderen KI-Tools
---

## Was ist MCP?

Das **Model Context Protocol (MCP)** ist ein offener Standard zur Verbindung von KI-Modellen mit externen Tools und Datenquellen. FlowMCP kann als MCP-Server laufen und alle aktiven Schemas als Tools fuer jeden MCP-kompatiblen KI-Client bereitstellen.

Anstatt fuer jede API eigenen Server-Code zu schreiben, deklarierst du Schemas und FlowMCP uebernimmt das MCP-Protokoll, die Parameter-Validierung und die API-Ausfuehrung.

## Architektur

So verbindet FlowMCP KI-Clients und APIs:

Der KI-Client sendet Tool-Aufrufe ueber das MCP-Protokoll. FlowMCP loest das richtige Schema auf, validiert Parameter, ruft die Upstream-API auf und gibt das Ergebnis zurueck.

## Server starten

Der schnellste Weg, Schemas bereitzustellen, ist ueber die CLI:

```bash
# Alle aktiven Tools als MCP-Server bereitstellen (stdio)
flowmcp server

# Mit spezifischem Schema-Verzeichnis
flowmcp server --schemas ./schemas/

# Eine bestimmte Gruppe bereitstellen
flowmcp server --group crypto
```

Fuer programmatische Kontrolle siehe den [Server-Integration-Guide](/de/docs/guides/server-integration).

## Client-Integration

### Claude Desktop

FlowMCP zur `claude_desktop_config.json` hinzufuegen:

```json
{
  "mcpServers": {
    "flowmcp": {
      "command": "npx",
      "args": ["-y", "flowmcp", "server"],
      "env": {
        "ETHERSCAN_API_KEY": "your_key_here",
        "MORALIS_API_KEY": "your_key_here"
      }
    }
  }
}
```

Speicherort der Konfigurationsdatei:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

:::tip
Nach dem Bearbeiten der Konfiguration Claude Desktop neu starten, um die neue MCP-Server-Konfiguration zu uebernehmen.
:::

### Cursor

FlowMCP zu den Cursor-MCP-Einstellungen hinzufuegen:

```json
{
  "mcpServers": {
    "flowmcp": {
      "command": "npx",
      "args": ["-y", "flowmcp", "server"]
    }
  }
}
```

Cursor-Einstellungen oeffnen und zum MCP-Bereich navigieren, um diese Konfiguration hinzuzufuegen.

### Claude Code

FlowMCP als lokalen MCP-Server hinzufuegen:

```bash
claude mcp add flowmcp --scope local -- npx -y flowmcp server
```

Claude Code startet den Server automatisch bei Bedarf.

## Umgebungsvariablen

API-Schluessel, die von deinen Schemas benoetigt werden, koennen auf drei Wegen bereitgestellt werden:

| Methode | Beispiel | Geeignet fuer |
|---------|---------|---------------|
| `~/.flowmcp/.env`-Datei | `ETHERSCAN_API_KEY=abc123` | Dauerhaftes lokales Setup |
| `env`-Block in Client-Config | Siehe Claude-Desktop-Beispiel oben | Konfiguration pro Client |
| System-Umgebungsvariablen | `export ETHERSCAN_API_KEY=abc123` | CI/CD und Container |

:::note[Sicherheit]
API-Schluessel werden zur Laufzeit als Server-Parameter injiziert und sind niemals dem KI-Client zugaenglich. Sie werden nur verwendet, wenn FlowMCP die Upstream-API im Auftrag der KI aufruft.
:::

## Was wird bereitgestellt

Alle aktiven Tools aus deiner `.flowmcp/config.json` werden zu MCP-Primitiven:

| Schema-Primitiv | MCP-Primitiv | Beschreibung |
|-----------------|--------------|-------------|
| Tools | MCP Tools | API-Endpunkte, die die KI aufrufen kann |
| Resources | MCP Resources | Statische Daten, die die KI lesen kann |
| Prompts | MCP Prompts | Vorgefertigte Prompt-Templates |

Jedes Tool wird mit Name, Beschreibung und Zod-validiertem Parameter-Schema registriert -- der KI-Client erhaelt alles, was er zum Entdecken und Aufrufen des Tools braucht.

## Naechste Schritte

:::note[Server-Integration]
Fuer programmatisches Server-Setup mit stdio und HTTP/SSE-Transporten siehe den [Server-Integration-Guide](/de/docs/guides/server-integration).
:::

:::note[Schema-Bibliothek]
Durchsuche 187+ vorgefertigte Schemas in der [Schema-Bibliothek](/de/docs/ecosystem/schema-library).
:::
