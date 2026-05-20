---
title: "Catalog"
description: "Catalog manifest, registry.json, named catalogs, and import flow"
---

A Catalog is the top-level organizational unit in FlowMCP v3. It is a named directory containing a `registry.json` manifest that describes all shared lists, provider schemas, and agent definitions.

:::note
For the full specification, see [15-catalog.md](https://github.com/FlowMCP/flowmcp-spec/blob/main/spec/v4.0.0/15-catalog.md).
:::

## Catalog Structure

```
flowmcp-community/
├── registry.json           # Catalog manifest
├── _lists/                 # Shared lists (root level)
├── _shared/                # Shared helpers (root level)
├── providers/              # Provider schemas
│   ├── coingecko-com/
│   │   ├── simplePrice.mjs
│   │   └── prompts/
│   └── etherscan/
│       └── contracts.mjs
└── agents/                 # Agent definitions
    ├── crypto-research/
    │   ├── manifest.json
    │   └── prompts/
    └── defi-monitor/
        └── manifest.json
```

## Registry Manifest

The `registry.json` file declares everything the catalog contains:

```json
{
    "name": "flowmcp-community",
    "version": "4.0.0",
    "description": "Official FlowMCP community catalog",
    "schemaSpec": "4.0.0",
    "shared": [
        { "file": "_lists/evm-chains.mjs", "name": "evmChains" }
    ],
    "schemas": [
        {
            "namespace": "coingecko-com",
            "file": "providers/coingecko-com/simplePrice.mjs",
            "name": "CoinGecko Simple Price",
            "requiredServerParams": [],
            "hasHandlers": false,
            "sharedLists": []
        }
    ],
    "agents": [
        {
            "name": "crypto-research",
            "description": "Cross-provider crypto analysis",
            "manifest": "agents/crypto-research/manifest.json"
        }
    ]
}
```

## Multiple Catalogs

Multiple catalogs can coexist side by side. Each is fully self-contained with no cross-catalog dependencies.

```
schemas/v4.0.0/
├── flowmcp-community/     # Official catalog
├── my-company-tools/      # Company-internal
└── experimental/          # Personal experiments
```

## Import Flow

```bash
# Phase 1: Download catalog
flowmcp import-registry https://example.com/registry.json

# Phase 2: Activate an agent
flowmcp import-agent crypto-research
```

## Validation

```bash
flowmcp validate-catalog <catalog-directory>
```

| Code | Rule |
|------|------|
| CAT001 | `registry.json` must exist |
| CAT002 | `name` must match directory name |
| CAT003 | All `shared[].file` paths must resolve |
| CAT004 | All `schemas[].file` paths must resolve |
| CAT005 | All `agents[].manifest` paths must resolve |
| CAT006 | Orphaned files reported as warnings |
| CAT007 | `schemaSpec` must be valid version |
