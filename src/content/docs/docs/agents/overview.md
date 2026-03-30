---
title: Agents Overview
description: Compose tools from multiple providers into purpose-driven AI agents with system prompts, skills, and tests
---

Agents are purpose-driven compositions that bundle tools from multiple providers into a single, testable unit. Where individual schemas wrap a single API, agents combine the right tools for a specific task -- for example, a crypto research agent might pull from CoinGecko, Etherscan, and DeFi Llama simultaneously.

:::note
This page covers the practical guide for building agents. For the full specification and validation rules, see [Agents Specification](/specification/agents).
:::

## Overview

An agent manifest (`agent.mjs`) declares everything the agent needs: which tools to use, which model to target, how the agent should behave, and how to verify it works.

## Agent Manifest

Each agent is defined by an `agent.mjs` file with `export const agent`:

```javascript
export const agent = {
    name: 'crypto-research',
    version: 'flowmcp/3.0.0',
    description: 'Cross-provider crypto analysis agent',
    model: 'anthropic/claude-sonnet-4-5-20250929',
    systemPrompt: 'You are a crypto research agent...',
    tools: {
        'coingecko-com/tool/simplePrice': null,
        'coingecko-com/tool/coinMarkets': null,
        'etherscan-io/tool/getContractAbi': null,
        'defillama-com/tool/getProtocolTvl': null
    },
    prompts: {
        'research-guide': { file: './prompts/research-guide.mjs' }
    },
    skills: {
        'token-analysis': { file: './skills/token-analysis.mjs' }
    },
    resources: {},
    tests: [
        {
            _description: 'Token price lookup',
            input: 'What is the current price of Bitcoin?',
            expectedTools: ['coingecko-com/tool/simplePrice'],
            expectedContent: ['bitcoin', 'price', 'USD']
        },
        {
            _description: 'Contract analysis',
            input: 'Analyze the USDC contract on Ethereum',
            expectedTools: ['etherscan-io/tool/getContractAbi'],
            expectedContent: ['USDC', 'contract']
        },
        {
            _description: 'DeFi protocol TVL',
            input: 'What is the TVL of Aave?',
            expectedTools: ['defillama-com/tool/getProtocolTvl'],
            expectedContent: ['Aave', 'TVL']
        }
    ],
    sharedLists: ['evmChains']
}
```

## Slash Rule

Tools, prompts, and resources use a uniform convention: keys containing `/` are external references (value `null`), keys without `/` are inline definitions.

| Key Pattern | Value | Meaning |
|-------------|-------|---------|
| Contains `/` | `null` | External reference from a provider schema |
| No `/` | object | Inline definition owned by the agent |

```javascript
tools: {
    'coingecko-com/tool/simplePrice': null,     // external
    'customEndpoint': { method: 'GET', ... }    // inline
}
```

Skills are the exception -- they cannot have slash keys because they are model-specific and cannot be shared across different LLMs.

## Three Content Layers

Agents separate concerns into three distinct layers that shape how the agent thinks, understands, and acts.

:::note[Persona]
**Field:** `systemPrompt`

Who the agent IS. Defines personality, expertise, and behavioral boundaries.

*"You are a crypto research analyst who provides data-driven insights..."*
:::

:::note[Explanations]
**Field:** `prompts`

How tools work. Provides context about data formats, API quirks, and interpretation guidance.

*"CoinGecko returns prices in the base currency. Always convert to USD for comparison..."*
:::

:::note[Instructions]
**Field:** `skills`

Step-by-step workflows. Guides the agent through multi-tool sequences for complex tasks.

*"Step 1: Search token by name. Step 2: Fetch OHLCV data. Step 3: Calculate metrics..."*
:::

| Layer | Field | Purpose | Example |
|-------|-------|---------|---------|
| Persona | `systemPrompt` | Who the agent IS | "You are a crypto research analyst..." |
| Explanations | `prompts` | How tools work | "CoinGecko returns prices in..." |
| Instructions | `skills` | Step-by-step workflows | "Step 1: Search token. Step 2: Fetch OHLCV..." |

## Tool Cherry-Picking

Tools are declared as object keys with the full ID format: `namespace/type/name`. External tools have `null` as value. This lets you pick exactly the tools an agent needs from any provider.

```
coingecko-com/tool/simplePrice        # Key in tools object, value: null
coingecko-com/tool/coinMarkets        # Another tool from the same provider
etherscan-io/tool/getContractAbi      # Tool from a different provider
defillama-com/tool/getProtocolTvl     # Yet another provider
```

Select only the tools that serve the agent's purpose. A crypto research agent does not need every CoinGecko endpoint -- just `simplePrice` and `coinMarkets` might be enough.

## Agent Tests

:::note
Every agent must have a minimum of 3 tests. This ensures the agent's tool selection and output quality are verified across different usage scenarios.
:::

Tests validate agent behavior at three levels:

| Level | Field | What it checks | Deterministic? |
|-------|-------|-----------------|----------------|
| **Tool Usage** | `expectedTools` | Did the agent call the right tools? | Yes |
| **Content** | `expectedContent` | Does the output contain expected keywords? | Partial |
| **Quality** | Manual review | Is the output coherent and useful? | No |

Each test case defines an input prompt, the tools the agent should reach for, and keywords the response should contain:

```javascript
{
    _description: 'Token price lookup',
    input: 'What is the current price of Bitcoin?',
    expectedTools: ['coingecko-com/tool/simplePrice'],
    expectedContent: ['bitcoin', 'price', 'USD']
}
```

- **`expectedTools`** is deterministic -- the agent must call exactly these tools for the given input.
- **`expectedContent`** is a partial check -- the response should contain these strings, but additional content is fine.
- **Quality review** is manual -- read the output and verify it makes sense as a coherent answer.

## Directory Structure

Each agent lives in its own directory within the catalog's `agents/` folder:

```
agents/crypto-research/
├── agent.mjs              # Manifest (export const agent)
├── prompts/
│   └── research-guide.mjs
├── skills/
│   └── token-analysis.mjs
└── resources/             # Optional own databases
```

The `agent.mjs` file is the entry point. Prompts and skills are referenced by relative path from the manifest and follow the same format as schema-level skills and prompt architecture.
