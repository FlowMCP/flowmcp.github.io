---
title: What is FlowMCP?
description: "Schema-driven tool orchestration for AI agents — transform REST APIs, local databases, and workflows into MCP-compatible tools"
---

## The Problem

AI agents need tools — "get crypto prices", "check wallet balances", "query open data". But APIs are chaotic: different authentication methods, URL structures, response formats, and rate limits. Every integration requires custom server code, parameter validation, error handling, and response formatting.

At 5 APIs this is tedious. At 50 it is unmaintainable. At 500 it is impossible without a systematic approach.

## The Solution

FlowMCP is a **schema-driven normalization layer** that transforms any data source into MCP-compatible tools. You write a declarative `.mjs` schema. FlowMCP handles validation, URL construction, authentication, and response formatting.

No custom server code. No boilerplate. One schema per provider.

## Four Primitives

FlowMCP v3.0.0 supports four primitives in a single schema file:

:::note[Tools]
REST API endpoints (GET/POST/PUT/DELETE). Map parameters to URLs, inject authentication, validate inputs. The core primitive.
:::

:::note[Resources]
Local SQLite databases for bulk data and open data. Fast read-only queries via prepared statements — no network calls.
:::

:::note[Prompts]
Namespace descriptions that explain how to use tools effectively. Guide AI agents with domain context and usage patterns.
:::

:::note[Skills]
Multi-step workflow instructions. Reusable pipelines that compose tools and resources into higher-level operations.
:::

## Minimal Example

A complete, runnable schema — everything an AI agent needs to call the CoinGecko price API:

```javascript
export const main = {
    namespace: 'coingecko',
    name: 'CoinGecko Prices',
    description: 'Cryptocurrency price data from CoinGecko',
    version: '3.0.0',
    root: 'https://api.coingecko.com/api/v3',
    tools: {
        simplePrice: {
            method: 'GET',
            path: '/simple/price',
            description: 'Get current price of cryptocurrencies',
            parameters: {
                ids: { type: 'string', required: true, description: 'Coin IDs (comma-separated)' },
                vs_currencies: { type: 'string', required: true, description: 'Target currencies' }
            }
        }
    }
}
```

:::tip
Most schemas only need the `main` export. An optional `handlers` export is available when API responses need transformation before reaching the AI agent.
:::

## Quickstart

1. **Install FlowMCP**

   ```bash
   npm install -g flowmcp
   ```

2. **Search available schemas**

   FlowMCP ships with 450+ pre-built schemas across crypto, DeFi, open data, and more.

   ```bash
   flowmcp search coingecko
   ```

3. **Add a tool to your project**

   Activates the tool and shows its expected input parameters.

   ```bash
   flowmcp add simple_price_coingecko
   ```

4. **Call the tool**

   ```bash
   flowmcp call simple_price_coingecko '{"ids": "bitcoin", "vs_currencies": "usd"}'
   ```

:::note
Some schemas require API keys configured in `~/.flowmcp/.env`. If a call fails due to missing keys, FlowMCP will tell you which variable to set.
:::

## How It Works

FlowMCP separates each schema into two exports:

| Export | Purpose | Description |
|--------|---------|-------------|
| `main` | Declarative config | JSON-serializable, hashable — describes tools, resources, prompts, and skills |
| `handlers` | Executable logic | Optional factory function that transforms API responses |

This separation enables integrity hashing (detect schema tampering), security scanning (analyze handlers before execution), and shared list injection (reusable value lists loaded at runtime).

## What's Next

:::note[Installation]
System requirements and setup instructions. See [Installation](/docs/getting-started/installation/).
:::

:::note[CLI Reference]
Complete command reference for search, add, call, validate, and test. See [CLI Reference](/docs/guides/cli-reference/).
:::

:::note[Schema Creation]
Write your own schemas from scratch. See [Schema Creation](/docs/guides/schema-creation/).
:::

:::note[Specification]
Full v3.0.0 specification with all primitives and validation rules. See [Specification](/docs/specification/overview/).
:::
