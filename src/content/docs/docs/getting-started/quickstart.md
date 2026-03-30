---
title: Quickstart
description: "Create your first FlowMCP schema and call an API in 5 minutes"
---

## Prerequisites

- **Node.js 22+** — check with `node --version`
- **npm** — comes with Node.js

## Create Your First Schema

1. **Install FlowMCP Core**

   Create a new project and install the core library:

   ```bash
   mkdir my-flowmcp-project
   cd my-flowmcp-project
   npm init -y
   npm install flowmcp-core
   ```

   Add `"type": "module"` to your `package.json` for ES module support.

2. **Write a Schema**

   Create a file called `coingecko-ping.mjs`:

   ```javascript
   export const main = {
       namespace: 'coingecko',
       name: 'Ping',
       description: 'Check CoinGecko API server status',
       version: '3.0.0',
       root: 'https://api.coingecko.com/api/v3',
       requiredServerParams: [],
       requiredLibraries: [],
       headers: {},
       tools: {
           ping: {
               method: 'GET',
               path: '/ping',
               description: 'Check if CoinGecko API is online',
               parameters: [],
               output: {
                   mimeType: 'application/json',
                   schema: {
                       type: 'object',
                       properties: {
                           gecko_says: { type: 'string', description: 'Response message' }
                       }
                   }
               }
           }
       }
   }
   ```

   This schema declares a single tool that calls the CoinGecko ping endpoint. No API key required.

3. **Validate and Call**

   Create a file called `test.mjs`:

   ```javascript
   import { FlowMCP } from 'flowmcp-core'
   import { main } from './coingecko-ping.mjs'

   // Validate the schema
   const { status, messages } = FlowMCP.validateSchema( { schema: main } )
   console.log( status ? 'Schema valid!' : messages )

   // Call the API
   const result = await FlowMCP.fetch( {
       schema: main,
       routeName: 'ping',
       userParams: {},
       serverParams: {}
   } )

   console.log( result.dataAsString )
   // → {"gecko_says":"(V3) To the Moon!"}
   ```

   Run it:

   ```bash
   node test.mjs
   ```

   You should see `Schema valid!` followed by the CoinGecko ping response.

4. **Run as MCP Server**

   Create a file called `server.mjs` to expose your schema as an MCP tool:

   ```javascript
   import { FlowMCP } from 'flowmcp-core'
   import { Server } from '@modelcontextprotocol/sdk/server/index.js'
   import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
   import { main } from './coingecko-ping.mjs'

   const server = new Server(
       { name: 'my-first-server', version: '1.0.0' },
       { capabilities: { tools: {} } }
   )

   FlowMCP.activateServerTools( { server, schemas: [main] } )

   const transport = new StdioServerTransport()
   await server.connect( transport )
   ```

   Install the MCP SDK:

   ```bash
   npm install @modelcontextprotocol/sdk
   ```

   Run the server:

   ```bash
   node server.mjs
   ```

   Your MCP server is now running over stdio. AI clients like Claude Desktop can connect to it and call the `coingecko__ping` tool.

:::tip
The tool name is auto-generated from `namespace` + tool name: **coingecko__ping**. AI clients see this name along with the tool description to decide when to call it.
:::

## What Just Happened?

1. You declared an API endpoint as a schema (no server code needed)
2. FlowMCP validated the schema structure
3. FlowMCP called the API with correct URL construction and headers
4. FlowMCP exposed the schema as an MCP tool with auto-generated Zod validation

The same pattern works for any REST API — add authentication via `requiredServerParams` and `headers`, add parameters via the `parameters` array, add response transformation via the `handlers` export.

## What's Next

:::note[Schema Creation]
Learn the full schema format with authentication, parameters, and handlers. See [Schema Creation](/docs/guides/schema-creation/).
:::

:::note[CLI Reference]
Search, activate, and call 187+ pre-built schemas from the command line. See [CLI Reference](/docs/guides/cli-reference/).
:::

:::note[Examples]
Real-world schema examples for common APIs. See [Examples](/docs/guides/examples/).
:::
