---
title: Installation
description: "FlowMCP Core und CLI fuer die Schema-Entwicklung installieren"
---

## Voraussetzungen

- **Node.js 22+** — erforderlich fuer ES-Module-Unterstuetzung und moderne JavaScript-Features
- **npm** oder **yarn** — fuer Paketverwaltung

Node.js-Version pruefen:

```bash
node --version
# Muss v22.x oder hoeher sein
```

## Core Library

Die Core Library bietet Schema-Validierung, API-Ausfuehrung und MCP-Server-Aktivierung.

```bash
npm install flowmcp-core
```

```javascript
import { FlowMCP } from 'flowmcp-core'
```

**Verwende FlowMCP Core wenn du:**
- Schemas programmatisch validieren willst
- API-Aufrufe via `FlowMCP.fetch()` ausfuehren willst
- MCP-Server mit `FlowMCP.activateServerTools()` bauen willst
- FlowMCP in eigene Anwendungen integrieren willst

## CLI Tool

Das CLI bietet interaktiven Zugriff auf den vollstaendigen Schema-Katalog von der Kommandozeile.

```bash
npm install -g flowmcp-cli
```

Installation verifizieren:

```bash
flowmcp status
```

**Verwende das CLI wenn du:**
- Den Schema-Katalog durchsuchen willst (`flowmcp search coingecko`)
- Schemas fuer ein Projekt aktivieren willst (`flowmcp add coingecko_ping`)
- APIs direkt aufrufen willst (`flowmcp call coingecko_ping '{}'`)
- Schemas waehrend der Entwicklung validieren willst

:::note
CLI und Core Library sind unabhaengige Pakete. Installiere Core fuer programmatische Nutzung, CLI fuer interaktive Nutzung, oder beides.
:::

## Schema Library

187+ produktionsreife Schemas stehen zur sofortigen Nutzung bereit. Den vollstaendigen Katalog findest du unter:

**[flowmcp.github.io/flowmcp-schemas](https://flowmcp.github.io/flowmcp-schemas/)**

Schemas decken Provider wie CoinGecko, Etherscan, Moralis, DeFi Llama, Dune Analytics, OpenWeather, GitHub und viele mehr ab. Jedes Schema ist validiert, getestet und folgt der v2.0.0-Spezifikation.

Mit installiertem CLI kannst du Schemas direkt suchen und aktivieren:

```bash
flowmcp search ethereum
# Zeigt passende Schemas mit Beschreibungen

flowmcp add get_contract_abi_etherscan
# Aktiviert das Schema und zeigt seine Parameter
```

## MCP SDK

Zum Erstellen von MCP-Servern brauchst du zusaetzlich das Model Context Protocol SDK:

```bash
npm install @modelcontextprotocol/sdk
```

Dies stellt die Klassen `Server`, `StdioServerTransport` und `SSEServerTransport` bereit, die benoetigt werden, um Schemas als MCP Tools bereitzustellen.

## Installation verifizieren

### Core Library

Erstelle eine Datei namens `verify.mjs`:

```javascript
import { FlowMCP } from 'flowmcp-core'

const schema = {
    namespace: 'test',
    name: 'Verify',
    description: 'Installation verification',
    version: '2.0.0',
    root: 'https://httpbin.org',
    requiredServerParams: [],
    requiredLibraries: [],
    headers: {},
    routes: {
        check: {
            method: 'GET',
            path: '/get',
            description: 'Simple GET request',
            parameters: []
        }
    }
}

const { status } = FlowMCP.validateSchema( { schema } )
console.log( status ? 'FlowMCP Core installed successfully!' : 'Validation failed' )
```

```bash
node verify.mjs
# → FlowMCP Core installed successfully!
```

### CLI

```bash
flowmcp status
# Zeigt Version, Konfiguration und aktive Tools

flowmcp search ping
# Sollte passende Schemas aus dem Katalog zurueckgeben
```

:::caution
FlowMCP erfordert Node.js 22 oder hoeher. Fruehere Versionen unterstuetzen die ES-Module-Features nicht, die von FlowMCP-Schemas verwendet werden. Falls `node --version` v20 oder niedriger anzeigt, aktualisiere Node.js bevor du fortfaehrst.
:::

## Projekt-Setup

Fuer ein neues Projekt mit FlowMCP sieht eine minimale `package.json` so aus:

```json
{
    "name": "my-flowmcp-project",
    "version": "1.0.0",
    "type": "module",
    "dependencies": {
        "flowmcp-core": "latest",
        "@modelcontextprotocol/sdk": "latest"
    }
}
```

:::tip
Das Feld `"type": "module"` ist fuer ES-Module-Unterstuetzung erforderlich. FlowMCP-Schemas verwenden `.mjs`-Dateien und `export`-Syntax.
:::

## Naechste Schritte

:::note[Quickstart]
Erstelle dein erstes Schema und rufe eine API in 5 Minuten auf. Siehe [Quickstart](/de/docs/getting-started/quickstart/).
:::

:::note[Wie es funktioniert]
Architektur und Datenfluss verstehen. Siehe [Wie es funktioniert](/de/docs/getting-started/how-it-works/).
:::
