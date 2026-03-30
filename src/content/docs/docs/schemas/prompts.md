---
title: Prompts
description: "Add explanatory namespace descriptions that teach AI agents how to use your tools effectively"
---

Prompts are explanatory texts scoped to a namespace. They teach AI agents how a provider's tools work together -- pagination patterns, error codes, rate limits, combining endpoints. Prompts **explain**, they don't **instruct** (that's what [Skills](/docs/schemas/skills/) do).

## Prompts vs Skills

| Aspect | Prompts | Skills |
|--------|---------|--------|
| Purpose | Explain how tools work | Instruct step-by-step workflows |
| Tone | "Here's how pagination works..." | "Step 1: Call X. Step 2: Pass result to Y." |
| Model dependency | Model-neutral | Model-specific (`testedWith` required) |
| Scope | Single namespace | Can reference tools from own schema |

See [Prompt Architecture](/docs/specification/prompt-architecture/) for the full two-tier system (Provider-Prompts vs Agent-Prompts).

## Defining Prompts

Prompts are declared in `main.prompts` and loaded from external `.mjs` files via `contentFile`:

```javascript
export const main = {
    namespace: 'coingecko',
    // ... other fields ...
    prompts: {
        'about': { contentFile: './prompts/about.mjs' },
        'pagination-guide': { contentFile: './prompts/pagination-guide.mjs' }
    }
}
```

## Prompt File Format

Each prompt is a `.mjs` file exporting a `prompt` object:

```javascript
// prompts/about.mjs
export const prompt = {
    name: 'about',
    version: 'flowmcp-prompt/1.0.0',
    provider: 'coingecko',
    description: 'Overview of CoinGecko API capabilities and best practices',
    dependsOn: ['coingecko.simplePrice', 'coingecko.coinMarkets', 'coingecko.coinMarketChart'],
    references: [],
    content: `CoinGecko provides cryptocurrency market data through three main tools:

Use {{tool:simplePrice}} for current prices of one or more tokens.
Use {{tool:coinMarkets}} for market cap rankings with sorting and pagination.
Use {{tool:coinMarketChart}} for historical price data over {{input:days}} days.

All price endpoints return values in the currency specified by {{input:vsCurrency}}.
Rate limit: 30 requests per minute on the free tier.`
}
```

## Placeholder Syntax

Use `{{type:name}}` placeholders in the `content` field to reference schema elements:

| Placeholder | Resolves To | Example |
|-------------|-------------|---------|
| `{{tool:name}}` | A tool in the same namespace | `{{tool:simplePrice}}` |
| `{{input:key}}` | A user input parameter | `{{input:tokenId}}` |
| `{{resource:name}}` | A resource in the same namespace | `{{resource:companiesDb}}` |

:::note
**The `about` convention** -- Every provider should have an `about` prompt that describes the overall API capabilities, common patterns, and gotchas. This is the first thing an AI agent reads when encountering a new namespace.
:::

## Complete Example

A CoinGecko schema with an `about` prompt:

```javascript
// coingecko-coins.mjs
export const main = {
    namespace: 'coingecko',
    name: 'CoinData',
    version: '3.0.0',
    root: 'https://api.coingecko.com/api/v3',
    tools: {
        simplePrice: { /* ... */ },
        coinMarkets: { /* ... */ },
        coinMarketChart: { /* ... */ }
    },
    prompts: {
        'about': { contentFile: './prompts/about.mjs' }
    }
}
```

```javascript
// prompts/about.mjs
export const prompt = {
    name: 'about',
    version: 'flowmcp-prompt/1.0.0',
    provider: 'coingecko',
    description: 'How to use CoinGecko tools effectively',
    dependsOn: ['coingecko.simplePrice', 'coingecko.coinMarkets', 'coingecko.coinMarketChart'],
    references: [],
    content: `CoinGecko provides real-time and historical cryptocurrency data.

{{tool:simplePrice}} returns current prices. Pass comma-separated token IDs.
{{tool:coinMarkets}} returns paginated market data sorted by market cap.
  - Use page and per_page parameters for pagination (max 250 per page).
  - Default sort is market_cap_desc.
{{tool:coinMarketChart}} returns OHLC + volume over {{input:days}} days.
  - Granularity is automatic: 1-2 days = 5min, 3-30 days = hourly, 31+ = daily.

All endpoints accept {{input:vsCurrency}} (e.g. "usd", "eur", "btc").`
}
```
