---
title: How It Works
description: "FlowMCP architecture and data flow from schema to AI tool"
---

## Architecture Overview

FlowMCP transforms declarative schema files into MCP tools that AI clients can call. Data flows through four layers:

```
Web Data Sources → Schemas → Core Runtime → MCP Server → AI Client
    (APIs)         (.mjs)    (FlowMCP)      (stdio/HTTP)   (Claude, etc.)
```

The schema layer is where you work. Everything else is handled by the runtime.

## The Four Steps

1. **Define**

   Write a schema as a `.mjs` file. Each schema declares one or more API tools with their endpoints, parameters, authentication, and expected responses.

   ```javascript
   // coingecko-ping.mjs
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
               parameters: []
           }
       }
   }
   ```

2. **Validate**

   FlowMCP Core validates your schema against validation rules covering structure, naming conventions, parameter formats, security constraints, and output declarations.

   ```javascript
   import { FlowMCP } from 'flowmcp-core'
   import { main } from './coingecko-ping.mjs'

   const { status, messages } = FlowMCP.validateSchema( { schema: main } )
   // status: true — schema is valid
   // messages: [] — no validation errors
   ```

   Validation catches issues at development time — before your schema reaches production.

3. **Activate**

   FlowMCP Core transforms your schema into MCP tools with auto-generated Zod validation for each parameter. One schema with 5 tools becomes 5 MCP tools.

   ```javascript
   import { Server } from '@modelcontextprotocol/sdk/server/index.js'

   const server = new Server(
       { name: 'my-server', version: '1.0.0' },
       { capabilities: { tools: {} } }
   )

   FlowMCP.activateServerTools( { server, schemas: [main] } )
   // Registers: coingecko__ping as an MCP tool
   ```

4. **Use**

   AI clients discover and call your tools through the MCP protocol. The client sees tool names, descriptions, and input schemas — everything needed to make informed tool calls.

   ```
   AI Client: "What tools are available?"
   MCP Server: [coingecko__ping] — Check if CoinGecko API is online

   AI Client: calls coingecko__ping({})
   MCP Server: { "gecko_says": "(V3) To the Moon!" }
   ```

## Schema Anatomy

Every FlowMCP v3.0.0 schema uses the **two-export pattern**:

### main (required)

The `main` export is a plain JavaScript object that declares everything about your API endpoints. It is JSON-serializable and can be hashed for integrity verification.

```javascript
export const main = {
    // Identity
    namespace: 'provider',       // Provider name (lowercase)
    name: 'ToolName',            // Human-readable name
    description: 'What it does', // Used by AI clients
    version: '3.0.0',            // Schema format version

    // Connection
    root: 'https://api.example.com', // Base URL
    requiredServerParams: ['API_KEY'], // Server-side secrets
    requiredLibraries: [],        // Allowed npm packages
    headers: {                    // Request headers
        'Authorization': 'Bearer {{API_KEY}}'
    },

    // Tools (API endpoints)
    tools: {
        toolName: {
            method: 'GET',
            path: '/endpoint/{{PARAM}}',
            description: 'What this tool does',
            parameters: [/* ... */],
            output: {/* ... */}
        }
    },

    // Resources (optional, SQLite read-only data)
    resources: {
        resourceName: {
            description: 'Read-only data lookup',
            source: 'sqlite',
            database: 'data.db',
            queries: { /* ... */ }
        }
    },

    // Skills (optional, AI agent instructions)
    skills: [
        { name: 'skill-name', file: 'skill-name.mjs', description: 'What this skill does' }
    ]
}
```

### handlers (optional)

The `handlers` export is a **factory function** that receives injected dependencies and returns handler functions keyed by tool name. Use it when API responses need transformation.

```javascript
export const handlers = ( { sharedLists, libraries } ) => ({
    toolName: {
        postProcess: ( { data } ) => {
            // Transform the raw API response
            const parsed = JSON.parse( data )
            const summary = parsed.results
                .map( ( item ) => `${item.name}: ${item.value}` )
                .join( '\n' )

            return summary
        }
    }
})
```

The factory pattern ensures:
- No free imports — dependencies are injected
- Shared lists are available without file access
- Libraries are pre-approved via `requiredLibraries`

## Parameter Flow

When an AI client calls a FlowMCP tool, the request flows through several stages:

```
User Input          →  Zod Validation     →  URL Construction     →  API Call
{ "id": "bitcoin" }    Validates types,       Replaces {{ID}} in     GET https://api.
                       lengths, formats       path and query         coingecko.com/...

                                                                         ↓

MCP Response        ←  Handler (optional)  ←  Raw Response
{ content: [...] }     postProcess()          { "bitcoin": { ... } }
                       transforms data
```

Each stage is deterministic: the same input always produces the same API call. Parameter validation uses Zod schemas auto-generated from the `parameters` array in your schema.

## Shared Lists

Some parameter values are reusable across schemas — chain IDs, token symbols, protocol names. Instead of each schema defining these independently, FlowMCP injects **shared lists** at load-time.

```javascript
// In the schema — reference a shared list
parameters: [
    {
        position: { key: 'chain', value: '{{CHAIN}}', location: 'insert' },
        z: { primitive: 'enum()', options: ['$chainIds'] }
        //                                  ^ injected at runtime
    }
]

// In handlers — access shared lists
export const handlers = ( { sharedLists } ) => ({
    toolName: {
        postProcess: ( { data } ) => {
            const chainName = sharedLists.chainIds[data.chainId]
            return `Chain: ${chainName}`
        }
    }
})
```

This keeps schemas DRY and ensures consistency across providers.

## Security Model

FlowMCP enforces security at the schema level:

| Constraint | Purpose |
|------------|---------|
| **Zero imports** | Schemas cannot use `import` or `require` — all dependencies are injected |
| **Library allowlist** | Only packages declared in `requiredLibraries` are available in handlers |
| **Static scan** | Schemas are analyzed at load-time for forbidden patterns |
| **Server params** | API keys stay server-side — never exposed to AI clients |
| **Integrity hash** | The `main` export can be hashed to detect schema tampering |

:::caution
Schemas that attempt to import modules, access the filesystem, or use undeclared libraries are rejected at load-time. This is by design — it protects both the server operator and the AI client.
:::

:::note
For the full specification including all validation rules, parameter formats, and security details, see the [Specification v3.0.0](/docs/specification/overview/).
:::
