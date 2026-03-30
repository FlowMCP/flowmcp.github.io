---
title: MCP Agent Server
description: Agent-gesteuerte MCP-Tools mit FlowMCP-Schemas deployen
---

Der [MCP Agent Server](https://github.com/FlowMCP/mcp-agent-server) ist ein MCP-Server, bei dem jedes Tool durch eine AI-Agent-Schleife unterstuetzt wird. Wenn ein AI-Client ein Tool aufruft, startet der Server einen LLM-Agenten, der iterativ FlowMCP-Schema-Tools aufruft, um das Problem zu loesen und eine strukturierte Antwort zurueckgibt.

## Architektur

```
AI Client  -->  MCP Protocol  -->  AgentToolsServer
                                        |
                                   ToolRegistry
                                        |
                                    AgentLoop
                                   /         \
                             LLM (OpenRouter)  ToolClient
                                               |
                                          FlowMCP Schemas
                                               |
                                          External APIs
```

Der AI-Client sendet eine Anfrage an den MCP-Server. Der Server startet eine Agent-Schleife, die ein LLM nutzt, um zu entscheiden welche FlowMCP-Tools aufgerufen werden, fuehrt diese aus und iteriert bis das Problem geloest ist. Die finale Antwort wird an den AI-Client zurueckgegeben.

## Installation

```bash
npm install mcp-agent-server
```

Oder lokal klonen und ausfuehren:

```bash
git clone https://github.com/FlowMCP/mcp-agent-server.git
cd mcp-agent-server
npm install
```

## Schnellstart

Der Server wird als Express-Middleware eingebunden:

```javascript
import express from 'express'
import { AgentToolsServer } from 'mcp-agent-server'

const app = express()
app.use( express.json() )

const { mcp } = await AgentToolsServer.create( {
    name: 'My Agent Server',
    version: '1.0.0',
    routePath: '/mcp',
    llm: {
        baseURL: 'https://openrouter.ai/api',
        apiKey: process.env.OPENROUTER_API_KEY
    },
    tools: [
        {
            name: 'defi-research',
            description: 'Research DeFi protocols and TVL data',
            inputSchema: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Research query' }
                },
                required: [ 'query' ]
            },
            agent: {
                systemPrompt: 'You are a DeFi research agent. Use the available tools to answer questions about DeFi protocols, TVL, and market data.',
                model: 'anthropic/claude-sonnet-4-5-20250929',
                maxRounds: 10,
                maxTokens: 4096
            },
            toolSources: [
                {
                    type: 'flowmcp',
                    schemas: [ defilamaSchema, coingeckoSchema ],
                    serverParams: { DEFILAMA_KEY: process.env.DEFILAMA_KEY }
                }
            ]
        }
    ]
} )

app.use( mcp.middleware() )
app.listen( 4100 )
```

## Wichtige Methoden

### `AgentToolsServer.create()`

Erstellt eine neue MCP-Server-Instanz aus der Konfiguration.

```javascript
const { mcp } = await AgentToolsServer.create( {
    name: 'My Server',
    version: '1.0.0',
    routePath: '/mcp',
    llm: { baseURL, apiKey },
    tools: [ /* tool configs */ ],
    tasks: { store: customTaskStore }  // optional
} )
```

| Key | Typ | Beschreibung | Pflicht |
|-----|-----|-------------|---------|
| `name` | string | Servername fuer MCP-Handshake | Ja |
| `version` | string | Server-Version | Ja |
| `routePath` | string | Express-Routenpfad (Standard `'/mcp'`) | Nein |
| `llm` | object | LLM-Konfiguration `{ baseURL, apiKey }` | Ja |
| `tools` | array | Array von Tool-Konfigurationen | Ja |
| `tasks` | object | Task-Store-Konfiguration (Standard `InMemoryTaskStore`) | Nein |

### `.middleware()`

Gibt eine Express-Middleware zurueck, die MCP-Protokoll-Anfragen (POST/GET/DELETE) auf dem konfigurierten Routenpfad verarbeitet.

```javascript
app.use( mcp.middleware() )
```

### `.listToolDefinitions()`

Gibt alle registrierten Tools im MCP-ListTools-Format zurueck.

```javascript
const { tools } = mcp.listToolDefinitions()
// tools: [ { name, description, inputSchema, execution? } ]
```

## Tool-Konfiguration

Jedes Tool im `tools`-Array definiert ein Agent-gestuetztes MCP-Tool:

| Key | Typ | Beschreibung | Pflicht |
|-----|-----|-------------|---------|
| `name` | string | Tool-Name im MCP-Protokoll | Ja |
| `description` | string | Was dieses Tool macht | Ja |
| `inputSchema` | object | JSON Schema fuer Tool-Eingabe | Ja |
| `agent` | object | Agent-Konfiguration | Ja |
| `toolSources` | array | Woher der Agent seine Tools bezieht | Ja |
| `execution` | object | `{ taskSupport: 'optional' \| 'required' }` | Nein |

### Agent-Konfiguration

| Key | Typ | Beschreibung | Pflicht |
|-----|-----|-------------|---------|
| `systemPrompt` | string | System-Prompt fuer das LLM | Ja |
| `model` | string | LLM-Modell-ID (z.B. `'anthropic/claude-sonnet-4-5-20250929'`) | Ja |
| `maxRounds` | number | Maximale Agent-Iterationen (Standard `10`) | Nein |
| `maxTokens` | number | Maximale Completion-Tokens (Standard `4096`) | Nein |
| `answerSchema` | object | Benutzerdefiniertes JSON Schema fuer das `submit_answer`-Tool | Nein |

### Tool Sources

Jeder Eintrag in `toolSources` definiert, woher der Agent seine Tools bezieht:

| Key | Typ | Beschreibung | Pflicht |
|-----|-----|-------------|---------|
| `type` | string | Source-Typ (aktuell `'flowmcp'`) | Ja |
| `schemas` | array | FlowMCP-Schema-Objekte | Ja |
| `serverParams` | object | API Keys und Umgebungsvariablen | Nein |

:::note
FlowMCP-Schemas laufen im selben Prozess -- kein externer MCP-Server wird benoetigt. Der Agent ruft sie direkt ueber den ToolClient auf.
:::

## FlowMCP-Schema-Integration

Importiere FlowMCP-Schemas und uebergib sie als Tool Sources:

```javascript
import { main as defilamaMain } from './schemas/defillama.mjs'
import { main as coingeckoMain } from './schemas/coingecko.mjs'

const tools = [
    {
        name: 'defi-analyst',
        description: 'Analyze DeFi protocols',
        inputSchema: { /* ... */ },
        agent: {
            systemPrompt: 'You are a DeFi analyst.',
            model: 'anthropic/claude-sonnet-4-5-20250929',
            maxRounds: 10,
            maxTokens: 4096
        },
        toolSources: [
            {
                type: 'flowmcp',
                schemas: [ defilamaMain, coingeckoMain ],
                serverParams: {
                    COINGECKO_API_KEY: process.env.COINGECKO_API_KEY
                }
            }
        ]
    }
]
```

## x402-Payment-Komposition

Zahlungsgating ohne Code-Kopplung hinzufuegen -- reine Express-Middleware-Reihenfolge:

```javascript
import express from 'express'
import { X402Middleware } from 'x402-mcp-middleware/v2'
import { AgentToolsServer } from 'mcp-agent-server'

const app = express()
app.use( express.json() )

// 1. Payment Gate (optional)
const x402 = await X402Middleware.create( { /* config */ } )
app.use( x402.mcp() )

// 2. Agent MCP Server
const { mcp } = await AgentToolsServer.create( { /* config */ } )
app.use( mcp.middleware() )

app.listen( 4100 )
```

:::tip
Die x402-Middleware faengt Anfragen ab, bevor sie den Agent-Server erreichen. Falls eine Zahlung erforderlich ist, erhaelt der Client eine 402-Antwort mit Zahlungsoptionen. Nach erfolgter Zahlung wird die Anfrage an den Agenten weitergeleitet.
:::

## Features

- **StreamableHTTP-Transport** mit sitzungsbasierten Verbindungen
- **LLM-Agent-Schleife** mit iterativem Tool-Calling via Anthropic SDK
- **FlowMCP-Schemas** als In-Process-Tool-Sources (kein externer Server)
- **Konfigurierbares Answer-Schema** pro Tool fuer strukturierte Ausgaben
- **MCP Tasks API** fuer asynchrone Tool-Ausfuehrung
- **x402-Komposition** fuer Zahlungsgating via Middleware-Reihenfolge
- **Mehrere Tool Sources** pro Tool via CompositeToolClient

## Links

- **GitHub**: [FlowMCP/mcp-agent-server](https://github.com/FlowMCP/mcp-agent-server)
- **npm**: `npm install mcp-agent-server`
