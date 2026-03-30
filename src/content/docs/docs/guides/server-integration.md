---
title: MCP Server Integration
description: Run FlowMCP schemas as an MCP server
---

FlowMCP schemas can be served as MCP tools through two transport modes: **stdio** for local AI applications like Claude Desktop, and **HTTP/SSE** for remote web applications. This guide covers both approaches.

## Overview

The integration path depends on your use case:

| Transport | Use Case | Protocol |
|-----------|----------|----------|
| **stdio** | Claude Desktop, Claude Code, local AI apps | Standard input/output |
| **HTTP/SSE** | Web services, remote clients, multi-tenant | Server-Sent Events over HTTP |
| **CLI** | Quick testing, agent mode | `flowmcp run` |

### Local Server (stdio)

The stdio transport is used for local AI applications that launch the MCP server as a subprocess. This is the standard approach for Claude Desktop integration.

```javascript
import { FlowMCP } from 'flowmcp-core'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

// Import your schemas
import { main as coingeckoMain } from './schemas/coingecko-ping.mjs'
import { main as etherscanMain, handlers as etherscanHandlers } from './schemas/etherscan-gas.mjs'

// Create MCP server
const server = new Server(
    { name: 'my-flowmcp-server', version: '1.0.0' },
    { capabilities: { tools: {} } }
)

// Server params (API keys from environment)
const serverParams = {
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY
}

// Load and activate schemas
const { status: s1, main: m1, handlerMap: h1 } = await FlowMCP.loadSchema( {
    filePath: './schemas/coingecko-ping.mjs'
} )

const { status: s2, main: m2, handlerMap: h2 } = await FlowMCP.loadSchema( {
    filePath: './schemas/etherscan-gas.mjs'
} )

// Activate all schema routes as MCP tools
FlowMCP.activateServerTools( { server, schema: m1, serverParams, validate: true } )
FlowMCP.activateServerTools( { server, schema: m2, serverParams, validate: true } )

// Connect via stdio
const transport = new StdioServerTransport()
await server.connect( transport )
```

:::note
The stdio transport communicates over standard input/output. The AI application launches your server as a child process and sends MCP protocol messages through the pipe.
:::

### Remote Server (HTTP/SSE)

For web applications and remote access, use the SSE transport with an HTTP server:

```javascript
import express from 'express'
import { FlowMCP } from 'flowmcp-core'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'

const app = express()

// Create MCP server
const server = new Server(
    { name: 'my-remote-server', version: '1.0.0' },
    { capabilities: { tools: {} } }
)

const serverParams = {
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY
}

// Load and activate schemas
const { main } = await FlowMCP.loadSchema( {
    filePath: './schemas/etherscan-gas.mjs'
} )

FlowMCP.activateServerTools( { server, schema: main, serverParams } )

// SSE endpoint
app.get( '/sse', async ( req, res ) => {
    const transport = new SSEServerTransport( '/messages', res )
    await server.connect( transport )
} )

// Message endpoint
app.post( '/messages', async ( req, res ) => {
    await transport.handlePostMessage( req, res )
} )

app.listen( 3000, () => {
    console.log( 'MCP server running on http://localhost:3000' )
} )
```

### CLI (flowmcp run)

The fastest way to serve schemas is through the CLI:

```bash
# Serve default group as MCP server (stdio)
flowmcp run

# Serve specific group
flowmcp run --group crypto
```

This starts the CLI in MCP server mode using stdio transport. Configure it in your AI application's MCP settings.

## Claude Desktop Configuration

To use FlowMCP schemas in Claude Desktop, add your server to `claude_desktop_config.json`:

### Custom Server (stdio)

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

The config file is located at:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

:::tip
After editing the config, restart Claude Desktop to pick up the new MCP server configuration.
:::

## Schema Filtering

When serving many schemas, use filtering to expose only the tools you need:

```javascript
import { FlowMCP } from 'flowmcp-core'

const allSchemas = [ schema1, schema2, schema3, schema4 ]

// Filter by namespace
const { filteredArrayOfSchemas } = FlowMCP.filterArrayOfSchemas( {
    arrayOfSchemas: allSchemas,
    includeNamespaces: [ 'coingecko', 'etherscan' ],
    excludeNamespaces: [],
    activateTags: []
} )

// Filter by tags
const { filteredArrayOfSchemas: defiSchemas } = FlowMCP.filterArrayOfSchemas( {
    arrayOfSchemas: allSchemas,
    includeNamespaces: [],
    excludeNamespaces: [],
    activateTags: [ 'defi' ]
} )

// Filter specific routes
const { filteredArrayOfSchemas: specific } = FlowMCP.filterArrayOfSchemas( {
    arrayOfSchemas: allSchemas,
    includeNamespaces: [],
    excludeNamespaces: [],
    activateTags: [
        'coingecko.getPrice',       // Include only getPrice from coingecko
        'etherscan.!getBalance'     // Exclude getBalance from etherscan
    ]
} )

// Activate filtered schemas
specific.forEach( ( schema ) => {
    FlowMCP.activateServerTools( { server, schema, serverParams } )
} )
```

## Server Parameters

Server parameters (API keys, tokens) are injected at runtime and never exposed to the AI client. Declare them in the schema's `requiredServerParams` and pass them when activating tools:

```javascript
// Schema declares what it needs
export const main = {
    // ...
    requiredServerParams: [ 'ETHERSCAN_API_KEY', 'MORALIS_API_KEY' ],
    // ...
}

// Server provides the values
const serverParams = {
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
    MORALIS_API_KEY: process.env.MORALIS_API_KEY
}

FlowMCP.activateServerTools( { server, schema: main, serverParams } )
```

:::caution
If a required server parameter is missing, the tool will fail at execution time with a clear error message. Always verify your environment variables are set before starting the server.
:::

## Activating Individual Routes

For fine-grained control, activate individual routes instead of entire schemas:

```javascript
// Activate a single route as an MCP tool
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

## Inspecting Tools Before Activation

Use `prepareServerTool` to inspect a tool configuration without registering it:

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

// Execute manually if needed
const result = await toolConfig.func( { chainName: 'ETH' } )
```
