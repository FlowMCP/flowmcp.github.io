---
title: "ID Schema"
description: "Unified namespace/type/name format for referencing tools, resources, and prompts"
---
<!-- PAGEFIND-META-START -->
<span style="display:none" data-pagefind-meta="section">Specification</span>
<!-- PAGEFIND-META-END -->

FlowMCP v4.0.0 introduces a unified ID format for referencing any element in the catalog: tools, resources, prompts, and lists.

:::note
For the full specification, see [16-id-schema.md](https://github.com/FlowMCP/flowmcp-spec/blob/main/spec/v4.0.0/16-id-schema.md).
:::

## Format

```
namespace/resourceType/name
```

| Component | Pattern | Examples |
|-----------|---------|----------|
| `namespace` | `[a-z][a-z0-9-]*` | `coingecko-com`, `etherscan`, `defillama` |
| `resourceType` | `tool`, `resource`, `prompt`, `list` | — |
| `name` | `[a-zA-Z][a-zA-Z0-9]*` | `simplePrice`, `getContractAbi` |

## Examples

| Full Form | Short Form | Context |
|-----------|------------|---------|
| `coingecko-com/tool/simplePrice` | `coingecko-com/simplePrice` | Tool reference |
| `etherscan/resource/contracts` | `etherscan/contracts` | Resource reference |
| `crypto-research/prompt/token-deep-dive` | — | Prompt reference |
| `shared/list/evmChains` | `shared/evmChains` | Shared list |

## Short Form

The short form `namespace/name` is allowed when the resource type is unambiguous:

- In `manifest.tools[]` — always means `tool`
- In `manifest.sharedLists[]` — always means `list`
- In `prompt.dependsOn[]` for Agent-Prompts — always means `tool`

## Usage in Placeholders

In prompt content, `[[...]]` with `/` is resolved as an ID reference:

```
Use [[coingecko-com/tool/simplePrice]] to get the price of [[tokenId]].
```

- `[[coingecko-com/tool/simplePrice]]` — Reference (resolved via ID schema)
- `[[tokenId]]` — Parameter (user input, no `/`)

## Validation Rules

| Code | Rule |
|------|------|
| ID001 | ID must contain at least one `/` separator |
| ID002 | Namespace must match `[a-z][a-z0-9-]*` |
| ID003 | Resource type (if present) must be `tool`, `resource`, `prompt`, or `list` |
| ID004 | Name must match `[a-zA-Z][a-zA-Z0-9]*` |
| ID005 | Short form allowed only in unambiguous contexts |
| ID006 | Reserved namespace `shared` for shared lists only |
