---
title: MCP Agent Server
description: Deploy agent-powered MCP tools with FlowMCP schemas
---

The [MCP Agent Server](https://github.com/FlowMCP/mcp-agent-server) is an MCP server where each tool is backed by an AI agent loop. When an AI client calls a tool, the server starts an LLM agent that iteratively calls FlowMCP schema tools to solve the problem and returns a structured answer.

## Architecture

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

The AI client sends a request to the MCP server. The server starts an agent loop that uses an LLM to decide which FlowMCP tools to call, calls them, and iterates until the problem is solved. The final answer is returned to the AI client.

## Installation

```bash
npm install mcp-agent-server
```

Or clone and run locally:

```bash
git clone https://github.com/FlowMCP/mcp-agent-server.git
cd mcp-agent-server
npm install
```

## Quickstart

The server mounts as Express middleware:

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

## Key Methods

### `AgentToolsServer.create()`

Creates a new MCP server instance from configuration.

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

| Key | Type | Description | Required |
|-----|------|-------------|----------|
| `name` | string | Server name for MCP handshake | Yes |
| `version` | string | Server version | Yes |
| `routePath` | string | Express route path (default `'/mcp'`) | No |
| `llm` | object | LLM config `{ baseURL, apiKey }` | Yes |
| `tools` | array | Array of tool configurations | Yes |
| `tasks` | object | Task store config (default `InMemoryTaskStore`) | No |

### `.middleware()`

Returns an Express middleware that handles MCP protocol requests (POST/GET/DELETE) on the configured route path.

```javascript
app.use( mcp.middleware() )
```

### `.listToolDefinitions()`

Returns all registered tools in MCP ListTools format.

```javascript
const { tools } = mcp.listToolDefinitions()
// tools: [ { name, description, inputSchema, execution? } ]
```

## Tool Configuration

Each tool in the `tools` array defines an agent-powered MCP tool:

| Key | Type | Description | Required |
|-----|------|-------------|----------|
| `name` | string | Tool name used in MCP protocol | Yes |
| `description` | string | What this tool does | Yes |
| `inputSchema` | object | JSON Schema for tool input | Yes |
| `agent` | object | Agent configuration | Yes |
| `toolSources` | array | Where the agent gets its tools from | Yes |
| `execution` | object | `{ taskSupport: 'optional' \| 'required' }` | No |

### Agent Configuration

| Key | Type | Description | Required |
|-----|------|-------------|----------|
| `systemPrompt` | string | System prompt for the LLM | Yes |
| `model` | string | LLM model ID (e.g., `'anthropic/claude-sonnet-4-5-20250929'`) | Yes |
| `maxRounds` | number | Maximum agent iterations (default `10`) | No |
| `maxTokens` | number | Max completion tokens (default `4096`) | No |
| `answerSchema` | object | Custom JSON Schema for the `submit_answer` tool | No |

### Tool Sources

Each entry in `toolSources` defines where the agent gets its tools:

| Key | Type | Description | Required |
|-----|------|-------------|----------|
| `type` | string | Source type (currently `'flowmcp'`) | Yes |
| `schemas` | array | FlowMCP schema objects | Yes |
| `serverParams` | object | API keys and environment variables | No |

:::note
FlowMCP schemas run in-process -- no external MCP server is needed. The agent calls them directly via the ToolClient.
:::

## FlowMCP Schema Integration

Import FlowMCP schemas and pass them as tool sources:

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

## x402 Payment Composition

Add payment gating with no code coupling -- pure Express middleware ordering:

```javascript
import express from 'express'
import { X402Middleware } from 'x402-mcp-middleware/v2'
import { AgentToolsServer } from 'mcp-agent-server'

const app = express()
app.use( express.json() )

// 1. Payment gate (optional)
const x402 = await X402Middleware.create( { /* config */ } )
app.use( x402.mcp() )

// 2. Agent MCP Server
const { mcp } = await AgentToolsServer.create( { /* config */ } )
app.use( mcp.middleware() )

app.listen( 4100 )
```

:::tip
The x402 middleware intercepts requests before they reach the agent server. If payment is required, the client receives a 402 response with payment options. Once paid, the request proceeds to the agent.
:::

## Features

- **StreamableHTTP transport** with session-based connections
- **LLM Agent Loop** with iterative tool calling via Anthropic SDK
- **FlowMCP schemas** as in-process tool sources (no external server)
- **Configurable answer schema** per tool for structured outputs
- **MCP Tasks API** for async tool execution
- **x402 composition** for payment gating via middleware ordering
- **Multiple tool sources** per tool via CompositeToolClient

## Links

- **GitHub**: [FlowMCP/mcp-agent-server](https://github.com/FlowMCP/mcp-agent-server)
- **npm**: `npm install mcp-agent-server`
