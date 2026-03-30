---
title: Server-Integration
description: FlowMCP-Schemas als MCP-Server betreiben
---

FlowMCP-Schemas koennen als MCP-Tools ueber zwei Transport-Modi bereitgestellt werden: **stdio** fuer lokale KI-Anwendungen wie Claude Desktop und **HTTP/SSE** fuer Remote-Webanwendungen. Diese Anleitung behandelt beide Ansaetze.

## Uebersicht

Der Integrationspfad haengt von deinem Anwendungsfall ab:

| Transport | Anwendungsfall | Protokoll |
|-----------|---------------|----------|
| **stdio** | Claude Desktop, Claude Code, lokale KI-Apps | Standard Input/Output |
| **HTTP/SSE** | Web-Services, Remote-Clients, Multi-Tenant | Server-Sent Events ueber HTTP |
| **CLI** | Schnelles Testen, Agent-Modus | `flowmcp run` |

### Lokaler Server (stdio)

Der stdio-Transport wird fuer lokale KI-Anwendungen verwendet, die den MCP-Server als Subprocess starten. Dies ist der Standardansatz fuer die Claude-Desktop-Integration.

```javascript
import { FlowMCP } from 'flowmcp-core'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

// Schemas importieren
import { main as coingeckoMain } from './schemas/coingecko-ping.mjs'
import { main as etherscanMain, handlers as etherscanHandlers } from './schemas/etherscan-gas.mjs'

// MCP-Server erstellen
const server = new Server(
    { name: 'my-flowmcp-server', version: '1.0.0' },
    { capabilities: { tools: {} } }
)

// Server-Parameter (API-Schluessel aus Umgebung)
const serverParams = {
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY
}

// Schemas laden und aktivieren
const { status: s1, main: m1, handlerMap: h1 } = await FlowMCP.loadSchema( {
    filePath: './schemas/coingecko-ping.mjs'
} )

const { status: s2, main: m2, handlerMap: h2 } = await FlowMCP.loadSchema( {
    filePath: './schemas/etherscan-gas.mjs'
} )

// Alle Schema-Routen als MCP-Tools aktivieren
FlowMCP.activateServerTools( { server, schema: m1, serverParams, validate: true } )
FlowMCP.activateServerTools( { server, schema: m2, serverParams, validate: true } )

// Via stdio verbinden
const transport = new StdioServerTransport()
await server.connect( transport )
```

:::note
Der stdio-Transport kommuniziert ueber Standard-Input/Output. Die KI-Anwendung startet deinen Server als Child-Process und sendet MCP-Protokoll-Nachrichten ueber die Pipe.
:::

### Remote-Server (HTTP/SSE)

Fuer Webanwendungen und Remote-Zugriff den SSE-Transport mit einem HTTP-Server verwenden:

```javascript
import express from 'express'
import { FlowMCP } from 'flowmcp-core'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'

const app = express()

// MCP-Server erstellen
const server = new Server(
    { name: 'my-remote-server', version: '1.0.0' },
    { capabilities: { tools: {} } }
)

const serverParams = {
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY
}

// Schemas laden und aktivieren
const { main } = await FlowMCP.loadSchema( {
    filePath: './schemas/etherscan-gas.mjs'
} )

FlowMCP.activateServerTools( { server, schema: main, serverParams } )

// SSE-Endpunkt
app.get( '/sse', async ( req, res ) => {
    const transport = new SSEServerTransport( '/messages', res )
    await server.connect( transport )
} )

// Message-Endpunkt
app.post( '/messages', async ( req, res ) => {
    await transport.handlePostMessage( req, res )
} )

app.listen( 3000, () => {
    console.log( 'MCP server running on http://localhost:3000' )
} )
```

### CLI (flowmcp run)

Der schnellste Weg, Schemas bereitzustellen, ist ueber die CLI:

```bash
# Standard-Gruppe als MCP-Server bereitstellen (stdio)
flowmcp run

# Bestimmte Gruppe bereitstellen
flowmcp run --group crypto
```

Dies startet die CLI im MCP-Server-Modus mit stdio-Transport. Konfiguriere es in den MCP-Einstellungen deiner KI-Anwendung.

## Claude Desktop Konfiguration

Um FlowMCP-Schemas in Claude Desktop zu nutzen, fuege deinen Server zur `claude_desktop_config.json` hinzu:

### Eigener Server (stdio)

```json
{
  "mcpServers": {
    "flowmcp-crypto": {
      "command": "node",
      "args": [ "/path/to/your/server.mjs" ],
      "env": {
        "ETHERSCAN_API_KEY": "your-key-here",
        "COINGECKO_API_KEY": "your-key-here"
      }
    }
  }
}
```

### FlowMCP CLI

```json
{
  "mcpServers": {
    "flowmcp": {
      "command": "flowmcp",
      "args": [ "run", "--group", "crypto" ]
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

## Schema-Filterung

Wenn viele Schemas bereitgestellt werden, verwende Filterung, um nur die benoetigten Tools freizugeben:

```javascript
import { FlowMCP } from 'flowmcp-core'

const allSchemas = [ schema1, schema2, schema3, schema4 ]

// Nach Namespace filtern
const { filteredArrayOfSchemas } = FlowMCP.filterArrayOfSchemas( {
    arrayOfSchemas: allSchemas,
    includeNamespaces: [ 'coingecko', 'etherscan' ],
    excludeNamespaces: [],
    activateTags: []
} )

// Nach Tags filtern
const { filteredArrayOfSchemas: defiSchemas } = FlowMCP.filterArrayOfSchemas( {
    arrayOfSchemas: allSchemas,
    includeNamespaces: [],
    excludeNamespaces: [],
    activateTags: [ 'defi' ]
} )

// Bestimmte Routen filtern
const { filteredArrayOfSchemas: specific } = FlowMCP.filterArrayOfSchemas( {
    arrayOfSchemas: allSchemas,
    includeNamespaces: [],
    excludeNamespaces: [],
    activateTags: [
        'coingecko.getPrice',       // Nur getPrice von coingecko einbeziehen
        'etherscan.!getBalance'     // getBalance von etherscan ausschliessen
    ]
} )

// Gefilterte Schemas aktivieren
specific.forEach( ( schema ) => {
    FlowMCP.activateServerTools( { server, schema, serverParams } )
} )
```

## Server-Parameter

Server-Parameter (API-Schluessel, Tokens) werden zur Laufzeit injiziert und niemals dem KI-Client offengelegt. Deklariere sie in `requiredServerParams` des Schemas und uebergib sie beim Aktivieren der Tools:

```javascript
// Schema deklariert, was es braucht
export const main = {
    // ...
    requiredServerParams: [ 'ETHERSCAN_API_KEY', 'MORALIS_API_KEY' ],
    // ...
}

// Server stellt die Werte bereit
const serverParams = {
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
    MORALIS_API_KEY: process.env.MORALIS_API_KEY
}

FlowMCP.activateServerTools( { server, schema: main, serverParams } )
```

:::caution
Wenn ein erforderlicher Server-Parameter fehlt, schlaegt das Tool zur Laufzeit mit einer klaren Fehlermeldung fehl. Stelle immer sicher, dass deine Umgebungsvariablen gesetzt sind, bevor du den Server startest.
:::

## Einzelne Routen aktivieren

Fuer feinkoernige Kontrolle einzelne Routen statt ganzer Schemas aktivieren:

```javascript
// Eine einzelne Route als MCP-Tool aktivieren
const { toolName, mcpTool } = FlowMCP.activateServerTool( {
    server,
    schema: main,
    routeName: 'getGasOracle',
    serverParams,
    validate: true
} )

console.log( `Activated: ${toolName}` )
// Output: "Activated: etherscan_getGasOracle"
```

## Tools vor der Aktivierung inspizieren

`prepareServerTool` verwenden, um eine Tool-Konfiguration zu inspizieren, ohne sie zu registrieren:

```javascript
const toolConfig = FlowMCP.prepareServerTool( {
    schema: main,
    serverParams,
    routeName: 'getGasOracle',
    validate: true
} )

console.log( 'Tool name:', toolConfig.toolName )
console.log( 'Description:', toolConfig.description )
console.log( 'Zod schema:', toolConfig.zod )

// Bei Bedarf manuell ausfuehren
const result = await toolConfig.func( { chainName: 'ETH' } )
```
