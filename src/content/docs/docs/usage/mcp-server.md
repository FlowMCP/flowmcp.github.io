---
title: MCP Server
description: Run FlowMCP as an MCP server to integrate with Claude Desktop, Cursor, and other AI tools
---

## What is MCP?

The **Model Context Protocol (MCP)** is an open standard for connecting AI models to external tools and data sources. FlowMCP can run as an MCP server, exposing all active schemas as tools to any MCP-compatible AI client.

Instead of writing custom server code for each API, you declare schemas and FlowMCP handles the MCP protocol, parameter validation, and API execution.

## Architecture

How FlowMCP bridges AI clients and APIs:

The AI client sends tool calls over the MCP protocol. FlowMCP resolves the correct schema, validates parameters, calls the upstream API, and returns the result.

## Starting the Server

The fastest way to serve schemas is through the CLI:

```bash
# Serve all active tools as MCP server (stdio)
flowmcp server

# Serve with specific schema directory
flowmcp server --schemas ./schemas/

# Serve a specific group
flowmcp server --group crypto
```

For programmatic control, see the [Server Integration guide](/docs/guides/server-integration).

## Client Integration

### Claude Desktop

Add FlowMCP to your `claude_desktop_config.json`:

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

Config file location:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

:::tip
After editing the config, restart Claude Desktop to pick up the new MCP server configuration.
:::

### Cursor

Add FlowMCP to your Cursor MCP settings:

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

Open Cursor Settings and navigate to the MCP section to add this configuration.

### Claude Code

Add FlowMCP as a local MCP server:

```bash
claude mcp add flowmcp --scope local -- npx -y flowmcp server
```

Claude Code will automatically start the server when needed.

## Environment Variables

API keys required by your schemas can be provided in three ways:

| Method | Example | Best For |
|--------|---------|----------|
| `~/.flowmcp/.env` file | `ETHERSCAN_API_KEY=abc123` | Persistent local setup |
| `env` block in client config | See Claude Desktop example above | Per-client configuration |
| System environment variables | `export ETHERSCAN_API_KEY=abc123` | CI/CD and containers |

:::note[Security]
API keys are injected as server parameters at runtime and are never exposed to the AI client. They are only used when FlowMCP calls the upstream API on behalf of the AI.
:::

## What Gets Exposed

All active tools from your `.flowmcp/config.json` become MCP primitives:

| Schema Primitive | MCP Primitive | Description |
|-----------------|---------------|-------------|
| Tools | MCP Tools | API endpoints the AI can call |
| Resources | MCP Resources | Static data the AI can read |
| Prompts | MCP Prompts | Pre-built prompt templates |

Each tool is registered with its name, description, and a Zod-validated parameter schema -- giving the AI client everything it needs to discover and call the tool correctly.

## What's Next

:::note[Server Integration]
For programmatic server setup with stdio and HTTP/SSE transports, see the [Server Integration guide](/docs/guides/server-integration).
:::

:::note[Schema Library]
Browse 187+ pre-built schemas ready to serve in the [Schema Library](/docs/ecosystem/schema-library).
:::
