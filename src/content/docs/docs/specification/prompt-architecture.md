---
title: "Prompt Architecture"
description: "Two-tier prompt system: Provider-Prompts (model-neutral) and Agent-Prompts (model-specific)"
---

FlowMCP v4.0.0 introduces a two-tier prompt architecture that separates model-neutral guidance from model-specific workflows. This replaces the simpler "Group Prompts" system from v2.

:::note
For the full specification, see [12-prompt-architecture.md](https://github.com/FlowMCP/flowmcp-spec/blob/main/spec/v4.0.0/12-prompt-architecture.md).
:::

## Two Prompt Types

| Aspect | Provider-Prompt | Agent-Prompt |
|--------|----------------|--------------|
| **Scope** | Single namespace | Multiple providers |
| **Model** | Model-neutral | Model-specific (`testedWith`) |
| **Field** | `namespace` | `agent` |
| **`dependsOn`** | Bare names (`getPrice`) | Full IDs (`ns/tool/name`) |
| **Location** | `providers/{ns}/prompts/` | `agents/{name}/prompts/` |

## Provider-Prompt Example

```javascript
export const prompt = {
    name: 'price-comparison',
    version: 'flowmcp-prompt/1.0.0',
    namespace: 'coingecko-com',
    description: 'Compare prices across multiple tokens',
    dependsOn: ['simplePrice', 'getCoinMarkets'],
    content: `Compare the prices of [[tokenList]] using...`
}
```

## Agent-Prompt Example

```javascript
export const prompt = {
    name: 'token-deep-dive',
    version: 'flowmcp-prompt/1.0.0',
    agent: 'crypto-research',
    testedWith: 'anthropic/claude-sonnet-4-5-20250929',
    description: 'Deep token analysis across providers',
    dependsOn: [
        'coingecko-com/tool/simplePrice',
        'etherscan/tool/getContractAbi'
    ],
    content: `Analyze [[tokenSymbol]] by first checking...`
}
```

## Placeholder Syntax

Prompts use `[[...]]` placeholders for dynamic content:

| Pattern | Type | Example |
|---------|------|---------|
| `[[name]]` (no `/`) | Parameter (user input) | `[[tokenSymbol]]`, `[[chainId]]` |
| `[[ns/tool/name]]` (with `/`) | Reference (resolved via ID) | `[[coingecko-com/tool/simplePrice]]` |

## Composable References

Prompts can reference other prompts via the `references[]` field (maximum 1 level deep):

```javascript
export const prompt = {
    name: 'full-analysis',
    references: [
        'coingecko-com/prompt/price-comparison'
    ],
    content: `First, [[coingecko-com/prompt/price-comparison]]. Then...`
}
```

## Validation Rules

| Code | Rule |
|------|------|
| PRM001 | `version` must be `"flowmcp-prompt/1.0.0"` |
| PRM002 | Provider-Prompt must have `namespace`, must NOT have `agent` or `testedWith` |
| PRM003 | Agent-Prompt must have `agent` and `testedWith`, must NOT have `namespace` |
| PRM004 | `dependsOn` tools must use bare names in Provider-Prompts |
| PRM005 | `dependsOn` tools must use full IDs in Agent-Prompts |
| PRM006 | `references[]` limited to 1 level deep |
