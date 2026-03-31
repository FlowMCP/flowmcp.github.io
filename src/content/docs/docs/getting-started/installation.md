---
title: Installation
description: "Install FlowMCP Core and CLI for schema development"
---

## Prerequisites

- **Node.js 22+** — required for ES module support and modern JavaScript features
- **npm** or **yarn** — for package management

Check your Node.js version:

```bash
node --version
# Must be v22.x or higher
```

## Core Library

The core library provides schema validation, API execution, and MCP server activation.

```bash
npm install github:FlowMCP/flowmcp-core
```

```javascript
import { FlowMCP } from 'flowmcp-core'
```

**Use FlowMCP Core when you want to:**
- Validate schemas programmatically
- Execute API calls via `FlowMCP.fetch()`
- Build MCP servers with `FlowMCP.activateServerTools()`
- Integrate FlowMCP into your own applications

## CLI Tool

The CLI provides interactive access to the full schema catalog from the command line.

```bash
npm install -g github:FlowMCP/flowmcp-cli
```

Verify the installation:

```bash
flowmcp status
```

**Use the CLI when you want to:**
- Search the schema catalog (`flowmcp search coingecko`)
- Activate schemas for a project (`flowmcp add coingecko_ping`)
- Call APIs directly (`flowmcp call coingecko_ping '{}'`)
- Validate schemas during development

:::note
The CLI and Core library are independent packages. Install Core for programmatic use, CLI for interactive use, or both.
:::

## Schema Library

187+ production-ready schemas are available for immediate use. Browse the full catalog at:

**[flowmcp.github.io/flowmcp-schemas](https://flowmcp.github.io/flowmcp-schemas/)**

Schemas cover providers including CoinGecko, Etherscan, Moralis, DeFi Llama, Dune Analytics, OpenWeather, GitHub, and many more. Each schema is validated, tested, and follows the v2.0.0 specification.

With the CLI installed, you can search and activate schemas directly:

```bash
flowmcp search ethereum
# Shows matching schemas with descriptions

flowmcp add get_contract_abi_etherscan
# Activates the schema and shows its parameters
```

## MCP SDK

For building MCP servers, you also need the Model Context Protocol SDK:

```bash
npm install @modelcontextprotocol/sdk
```

This provides the `Server`, `StdioServerTransport`, and `SSEServerTransport` classes needed to expose your schemas as MCP tools.

## Verify Installation

### Core Library

Create a file called `verify.mjs`:

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
# Shows version, configuration, and active tools

flowmcp search ping
# Should return matching schemas from the catalog
```

:::caution
FlowMCP requires Node.js 22 or higher. Earlier versions do not support the ES module features used by FlowMCP schemas. If `node --version` shows v20 or below, upgrade Node.js before proceeding.
:::

## Project Setup

For a new project using FlowMCP, a minimal `package.json` looks like this:

```json
{
    "name": "my-flowmcp-project",
    "version": "1.0.0",
    "type": "module",
    "dependencies": {
        "flowmcp-core": "github:FlowMCP/flowmcp-core",
        "@modelcontextprotocol/sdk": "latest"
    }
}
```

:::tip
The `"type": "module"` field is required for ES module support. FlowMCP schemas use `.mjs` files and `export` syntax.
:::

## Next Steps

:::note[Quickstart]
Create your first schema and call an API in 5 minutes. See [Quickstart](/docs/getting-started/quickstart/).
:::

:::note[How It Works]
Understand the architecture and data flow. See [How It Works](/docs/getting-started/how-it-works/).
:::
