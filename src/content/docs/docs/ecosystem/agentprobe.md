---
title: AgentProbe
description: Multi-protocol validation for MCP servers, A2A agents, and x402 endpoints
---

[AgentProbe](https://github.com/FlowMCP/mcp-agent-validator) is a web-based multi-protocol validator for AI agent endpoints. Enter a URL and get instant assessment across eight protocol layers.

**Live demo:** [agentprobe.xyz](https://agentprobe.xyz)

## What It Does

- **Input:** A single agent endpoint URL
- **Assessment:** Runs the `mcp-agent-assessment` pipeline with protocol-specific validators
- **Output:** Unified verdicts per protocol layer plus raw assessment data

One URL is enough. AgentProbe discovers which protocols the endpoint supports and validates each one independently.

## Protocol Layers

AgentProbe assesses eight protocol layers:

| Layer | What it checks |
|-------|---------------|
| **HTTP** | Connectivity, HTTPS, SSL validation, CORS, HTTP/2 detection |
| **MCP** | Server discovery, tool/resource/prompt listing, capability detection |
| **A2A / AP2** | Agent card validation, AP2 version and role detection via `capabilities.extensions` and `X-A2A-Extensions` header |
| **x402** | Payment-required endpoint detection with scheme, network, and token analysis |
| **OAuth** | Authorization server metadata discovery |
| **MCP Apps** | UI resource detection for MCP applications |
| **HTML** | Website detection, Content-Type, SSL status, HTTP/2 |
| **ERC-8004** | On-chain agent registry lookup with OASF classification, reputation, and metadata extraction |

:::note
Not every endpoint supports all protocols. AgentProbe gracefully handles unsupported layers and shows results only for detected protocols.
:::

## Architecture

```
URL Input  -->  Server  -->  mcp-agent-assessment
                                    |
                    +-------+-------+-------+-------+
                    |       |       |       |       |
                   HTTP    MCP   A2A/AP2   x402   OAuth
                    |       |       |       |       |
                    +-------+-------+-------+-------+
                                    |
                               Results UI
```

The server receives a URL, passes it to the unified assessment pipeline, and returns structured results for each protocol layer.

## API Endpoints

### `POST /api/validate`

Returns a structured validation result with separate sections for each protocol.

```bash
curl -X POST https://agentprobe.xyz/api/validate \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://your-endpoint.example.com/mcp"}'
```

The response contains `mcp`, `a2a`, `ui` (MCP Apps), and `oauth` objects, each with `status`, `categories`, `summary`, and `messages`.

### `POST /api/assess`

Returns the raw assessment result from `mcp-agent-assessment` with full layer details.

```bash
curl -X POST https://agentprobe.xyz/api/assess \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://your-endpoint.example.com/mcp"}'
```

Optional parameters:

| Key | Type | Description |
|-----|------|-------------|
| `timeout` | number | Timeout in milliseconds |
| `erc8004` | object | ERC-8004 config with `rpcNodes` |

### `POST /api/lookup`

Query the ERC-8004 on-chain registry for agent registration data, endpoints, OASF classification, and reputation.

```bash
curl -X POST https://agentprobe.xyz/api/lookup \
  -H 'Content-Type: application/json' \
  -d '{"agentId": 2340, "chainId": 8453}'
```

| Key | Type | Description | Required |
|-----|------|-------------|----------|
| `agentId` | number | Agent token ID in the ERC-8004 registry | Yes |
| `chainId` | number or string | Chain ID (e.g., `8453` for Base) or CAIP-2 (e.g., `eip155:8453`) | Yes |
| `rpcNodes` | object | Custom RPC nodes per chain alias | No |

## Validate Your Own MCP Server

1. **Deploy your MCP server**

   Make sure your MCP server is publicly accessible (e.g., via ngrok or a cloud deployment).

2. **Open AgentProbe**

   Go to [agentprobe.xyz](https://agentprobe.xyz) in your browser.

3. **Enter your endpoint URL**

   Paste your MCP server URL (e.g., `https://your-server.example.com/mcp`) and click validate.

4. **Review results**

   AgentProbe shows verdicts for each protocol layer. Green means supported and valid, red means issues detected, gray means not applicable.

Or use the API directly:

```bash
curl -X POST https://agentprobe.xyz/api/validate \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://your-server.example.com/mcp"}'
```

## Authentication

Authentication is optional. When `API_TOKEN` is not set, the API is open (dev mode).

When `API_TOKEN` is set, two authentication methods are supported:

| Method | How it works |
|--------|-------------|
| **Session Cookie** | Browser visits the UI and receives a session cookie automatically |
| **Bearer Token** | External scripts send `Authorization: Bearer <API_TOKEN>` header |

```bash
# With Bearer token
curl -X POST https://agentprobe.xyz/api/validate \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer your-token-here' \
  -d '{"url": "https://your-endpoint.example.com"}'
```

## Dependencies

AgentProbe builds on the FlowMCP validator ecosystem:

| Package | Purpose |
|---------|---------|
| [mcp-agent-assessment](https://github.com/FlowMCP/mcp-server-assessment) | Unified assessment pipeline |
| [a2a-agent-validator](https://github.com/FlowMCP/a2a-agent-validator) | A2A agent card and AP2 detection |
| [x402-mcp-validator](https://github.com/FlowMCP/x402-mcp-validator) | x402 payment protocol validation |
| [mcp-apps-validator](https://github.com/FlowMCP/mcp-apps-validator) | MCP Apps UI resource detection |
| [erc8004-registry-parser](https://github.com/FlowMCP/erc8004-registry-parser) | ERC-8004 on-chain registry parsing |

## Links

- **Live Demo**: [agentprobe.xyz](https://agentprobe.xyz)
- **GitHub**: [FlowMCP/mcp-agent-validator](https://github.com/FlowMCP/mcp-agent-validator)
- **Video**: [Watch on YouTube](https://www.youtube.com/watch?v=gnmsCEly3fA)
- **DoraHacks**: [dorahacks.io/buidl/39293](https://dorahacks.io/buidl/39293)
