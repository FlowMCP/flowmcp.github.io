---
title: "Agents"
description: "Agent manifests, model binding, system prompts, tool cherry-picking, and integrity verification"
---
<!-- PAGEFIND-META-START -->
<span style="display:none" data-pagefind-meta="section">Specification</span>
<!-- PAGEFIND-META-END -->

Agents are purpose-driven tool compositions that bundle tools from multiple providers for a specific task. They replace the simpler "Groups" concept from v2.0.0 with full manifest definitions including model binding, system prompts, and testable behavior.

:::note
This page documents the v4.0.0 Agent system. For the full specification, see [06-agents.md](https://github.com/FlowMCP/flowmcp-spec/blob/main/spec/v4.0.0/06-agents.md).
:::

## Agent vs Provider

| Aspect | Provider | Agent |
|--------|----------|-------|
| **Scope** | Single API source | Multiple providers combined |
| **Prompts** | Model-neutral | Model-specific with `testedWith` |
| **Model** | None (any model can use) | Bound to specific LLM |
| **Purpose** | Expose data | Accomplish tasks |
| **Tests** | Per-tool deterministic | Tool selection + content assertions |

## Manifest Format

Each agent is defined by a `manifest.json` file in the catalog's `agents/` directory.

```json
{
    "name": "crypto-research",
    "version": "flowmcp/4.0.0",
    "description": "Cross-provider crypto analysis agent",
    "model": "anthropic/claude-sonnet-4-5-20250929",
    "systemPrompt": "You are a crypto research analyst...",
    "tools": [
        "coingecko-com/tool/simplePrice",
        "etherscan/tool/getContractAbi",
        "defillama/tool/getProtocolTvl"
    ],
    "tests": [
        {
            "_description": "Basic token lookup",
            "input": "What is the current price of Ethereum?",
            "expectedTools": ["coingecko-com/tool/simplePrice"],
            "expectedContent": ["price", "USD"]
        }
    ]
}
```

## Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Agent name (kebab-case) |
| `description` | string | Human-readable purpose |
| `version` | string | Must be `"flowmcp/4.0.0"` |
| `model` | string | Target LLM (OpenRouter format with `/`) |
| `systemPrompt` | string | Agent persona and behavioral instructions |
| `tools` | string[] | Tool IDs in `namespace/type/name` format |
| `tests` | array | Minimum 3 test cases |

## Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `maxRounds` | number | 10 | Maximum LLM interaction rounds |
| `maxTokens` | number | 4096 | Maximum tokens per response |
| `prompts` | string[] | [] | Relative paths to prompt files |
| `sharedLists` | string[] | [] | Required shared list names |
| `inputSchema` | object | — | JSON Schema for agent input |

## Agent Tests

Each agent must have at least 3 tests. Tests validate tool selection (deterministic) and optionally content assertions.

```json
{
    "_description": "Cross-provider DeFi analysis",
    "input": "Compare TVL of Aave on Ethereum vs Arbitrum",
    "expectedTools": ["defillama/tool/getProtocolTvl"],
    "expectedContent": ["TVL", "Ethereum", "Arbitrum"]
}
```

- **`expectedTools`** — Deterministic: the agent must call exactly these tools
- **`expectedContent`** — Partial: the response should contain these strings

## Validation Rules

| Code | Rule |
|------|------|
| AGT001 | `manifest.json` must exist and be valid JSON |
| AGT002 | `name` must be kebab-case |
| AGT003 | `version` must be `"flowmcp/4.0.0"` |
| AGT004 | `model` must use OpenRouter format (contains `/`) |
| AGT005 | `tools[]` must not be empty |
| AGT006 | Each tool ID must be valid (`namespace/type/name`) |
| AGT007 | `tests[]` must have minimum 3 entries |
| AGT008 | Each test must have `_description`, `input`, `expectedTools` |

## CLI Commands

```bash
# Import an agent from a catalog
flowmcp import-agent crypto-research

# The agent's tools are activated locally
flowmcp list
```
