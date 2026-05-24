---
title: Agent Creation
description: Step-by-step guide for building a FlowMCP-driven AI agent — schema selection, skill definition, LLM loop.
---
<!-- PAGEFIND-META-START -->
<span style="display:none" data-pagefind-meta="section">Guides</span>
<!-- PAGEFIND-META-END -->

This guide walks through building an AI agent that uses FlowMCP schemas as its tool layer. By the end, you have a working agent that pulls from multiple data sources and reasons across them with a single LLM loop.

## What you build

A simple "crypto research agent" that:

- Pulls token prices from a CoinGecko schema
- Pulls on-chain data from an Etherscan schema
- Lets the LLM decide which tools to chain
- Returns a structured answer

Total time: 15–20 minutes.

## Prerequisites

- Node.js 22+
- FlowMCP CLI installed: `npm install -g github:FlowMCP/flowmcp-cli`
- An API key for one LLM (Anthropic, OpenAI, or local Ollama)

## Step 1 — Activate two schemas

```bash
flowmcp search coingecko
flowmcp add coingecko-tokens
flowmcp add etherscan-tokens
flowmcp list
```

You should now see two tools active. The CLI auto-loaded them into a local group.

## Step 2 — Define a Skill

A Skill bundles a workflow with the right tools. Save this as `crypto-research-skill.mjs`:

```javascript
export const skill = {
    name: 'crypto-research',
    inputs: {
        token_name: 'string',
        chain_id: 'number'
    },
    prefill: {
        currency: 'usd',
        include_24h_change: true
    },
    tools: [
        'coingecko-tokens.simplePrice',
        'etherscan-tokens.tokenInfo'
    ],
    description: 'Look up a token by name, fetch price + chain info.'
}
```

The Skill carries its **own parameter reference**, prefilled defaults, and the curated tool list. The LLM does not have to guess.

## Step 3 — Wire the LLM loop

A minimal Node.js example using the Anthropic SDK:

```javascript
import { Anthropic } from '@anthropic-ai/sdk'
import { skill } from './crypto-research-skill.mjs'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    tools: skill.tools.map( ( name ) => ({ name, input_schema: { type: 'object' } }) ),
    messages: [{
        role: 'user',
        content: 'Look up ETH price and contract info on Ethereum mainnet.'
    }]
})

console.log( response.content )
```

You should see the LLM pick `simplePrice` first, then `tokenInfo` — without you scripting the order.

## Step 4 — Add a second tool group

When the user asks a different kind of question (e.g. "What is Aave's TVL?"), activate a third schema:

```bash
flowmcp add defillama-tvl
```

The agent now has three tools and can reason about which to call.

## Production checklist

- [ ] API keys live in `~/.flowmcp/.env`, never in the LLM context
- [ ] LLM-loop has a max-iteration cap (avoid runaway loops)
- [ ] Skill input validation rejects malformed input before LLM sees it
- [ ] Telemetry: log tool calls per agent session for debugging
- [ ] Mock mode tested for demos / offline scenarios

## Next

- [Concepts → Agents](/concepts/agents/) — the conceptual model
- [Specification → Agents](/specification/agents/) — full manifest schema
- [Reference → Programmatic API](/reference/core-methods/) — Node SDK reference
