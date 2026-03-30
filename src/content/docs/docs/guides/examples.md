---
title: Examples
description: Practical FlowMCP schema examples for common patterns
---

These examples demonstrate the four most common FlowMCP schema patterns, from the simplest possible schema to multi-step async workflows. All examples use the v3.0.0 format.

## 1. Minimal Schema

The simplest possible schema: a single tool with no parameters, no handlers, and no shared lists. This is the CoinGecko API ping endpoint.

```javascript
// coingecko-ping.mjs
export const main = {
    namespace: 'coingecko',
    name: 'Ping',
    description: 'Check CoinGecko API server status',
    version: '3.0.0',
    docs: [ 'https://docs.coingecko.com/reference/simple-ping' ],
    tags: [ 'utility', 'health' ],
    root: 'https://api.coingecko.com/api/v3',
    requiredServerParams: [],
    requiredLibraries: [],
    headers: {},
    tools: {
        ping: {
            method: 'GET',
            path: '/ping',
            description: 'Check if CoinGecko API is online',
            parameters: [],
            output: {
                mimeType: 'application/json',
                schema: {
                    type: 'object',
                    properties: {
                        gecko_says: { type: 'string', description: 'Response message from CoinGecko' }
                    }
                }
            }
        }
    }
}
```

**Key takeaways:**
- No `requiredServerParams` -- this API needs no authentication
- No `handlers` export -- the raw API response is returned as-is
- The `output.schema` describes what the AI client receives
- `parameters: []` means no user input is needed

## 2. Multi-Tool Schema with Handlers

Multiple tools in one schema, with `postRequest` handlers that filter and reshape API responses. This wraps the DeFi Llama protocol analytics API.

### Main export

```javascript
// defillama-protocols.mjs
export const main = {
    namespace: 'defillama',
    name: 'ProtocolAnalytics',
    description: 'DeFi Llama protocol TVL and analytics data',
    version: '3.0.0',
    docs: [ 'https://defillama.com/docs/api' ],
    tags: [ 'defi', 'tvl', 'analytics' ],
    root: 'https://api.llama.fi',
    requiredServerParams: [],
    requiredLibraries: [],
    headers: {},
    tools: {
        getProtocols: {
            method: 'GET',
            path: '/protocols',
            description: 'List all DeFi protocols with TVL data',
            parameters: [],
            output: {
                mimeType: 'application/json',
                schema: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', description: 'Protocol name' },
                            slug: { type: 'string', description: 'URL-safe identifier' },
                            tvl: { type: 'number', description: 'Total value locked in USD' },
                            chain: { type: 'string', description: 'Primary chain' },
                            category: { type: 'string', description: 'Protocol category' }
                        }
                    }
                }
            }
        },
        getTvl: {
            method: 'GET',
            path: '/tvl/{{protocolSlug}}',
            description: 'Get current TVL for a specific protocol',
            parameters: [
                {
                    position: { key: 'protocolSlug', value: '{{USER_PARAM}}', location: 'insert' },
                    z: { primitive: 'string()', options: [ 'min(1)' ] }
                }
            ],
            output: {
                mimeType: 'application/json',
                schema: { type: 'number' }
            }
        },
        getProtocolTvl: {
            method: 'GET',
            path: '/protocol/{{protocolSlug}}',
            description: 'Get detailed TVL history for a protocol',
            parameters: [
                {
                    position: { key: 'protocolSlug', value: '{{USER_PARAM}}', location: 'insert' },
                    z: { primitive: 'string()', options: [ 'min(1)' ] }
                }
            ],
            output: {
                mimeType: 'application/json',
                schema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Protocol name' },
                        tvl: { type: 'array', items: { type: 'object' } },
                        currentChainTvls: { type: 'object', description: 'TVL per chain' }
                    }
                }
            }
        },
        getChainTvl: {
            method: 'GET',
            path: '/v2/historicalChainTvl/{{chainName}}',
            description: 'Get historical TVL for a specific chain',
            parameters: [
                {
                    position: { key: 'chainName', value: '{{USER_PARAM}}', location: 'insert' },
                    z: { primitive: 'string()', options: [ 'min(1)' ] }
                }
            ],
            output: {
                mimeType: 'application/json',
                schema: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            date: { type: 'number', description: 'Unix timestamp' },
                            tvl: { type: 'number', description: 'TVL in USD' }
                        }
                    }
                }
            }
        }
    }
}
```

### Handlers export

```javascript
export const handlers = ( { sharedLists, libraries } ) => ( {
    getProtocols: {
        postRequest: async ( { response } ) => {
            const items = response
                .filter( ( item ) => item.tvl > 0 )
                .map( ( item ) => {
                    const { name, slug, tvl, chain, category } = item

                    return { name, slug, tvl, chain, category }
                } )

            return { response: items }
        }
    },
    getProtocolTvl: {
        postRequest: async ( { response } ) => {
            const { name, tvl, currentChainTvls } = response
            const simplified = {
                name,
                tvl: tvl || [],
                currentChainTvls: currentChainTvls || {}
            }

            return { response: simplified }
        }
    }
} )
```

**Key takeaways:**
- Four tools in one schema covering related endpoints
- `location: 'insert'` substitutes parameters into the URL path
- The `handlers` export transforms responses for two of the four tools
- Tools without handlers return the raw API response
- The handler factory receives `{ sharedLists, libraries }` even when unused

## 3. Shared List Schema

Demonstrates shared list references and `{{listName:fieldName}}` interpolation. This Etherscan gas tracker schema uses the `evmChains` shared list to generate a chain selector enum.

### Schema

```javascript
// etherscan-gas.mjs
export const main = {
    namespace: 'etherscan',
    name: 'GasTracker',
    description: 'EVM gas price tracking via Etherscan API',
    version: '3.0.0',
    docs: [ 'https://docs.etherscan.io/api-endpoints/gas-tracker' ],
    tags: [ 'evm', 'gas', 'transactions' ],
    root: 'https://api.etherscan.io/v2/api',
    requiredServerParams: [ 'ETHERSCAN_API_KEY' ],
    requiredLibraries: [],
    headers: {},
    sharedLists: [
        {
            ref: 'evmChains',
            version: '1.0.0',
            filter: { key: 'etherscanAlias', exists: true }
        }
    ],
    tools: {
        getGasOracle: {
            method: 'GET',
            path: '/api',
            description: 'Get current gas prices for an EVM chain',
            parameters: [
                {
                    position: { key: 'chainName', value: '{{USER_PARAM}}', location: 'query' },
                    z: { primitive: 'enum({{evmChains:etherscanAlias}})', options: [] }
                },
                {
                    position: { key: 'module', value: 'gastracker', location: 'query' },
                    z: { primitive: 'string()', options: [] }
                },
                {
                    position: { key: 'action', value: 'gasoracle', location: 'query' },
                    z: { primitive: 'string()', options: [] }
                },
                {
                    position: { key: 'apikey', value: '{{SERVER_PARAM:ETHERSCAN_API_KEY}}', location: 'query' },
                    z: { primitive: 'string()', options: [] }
                }
            ],
            output: {
                mimeType: 'application/json',
                schema: {
                    type: 'object',
                    properties: {
                        LastBlock: { type: 'string', description: 'Latest block number' },
                        SafeGasPrice: { type: 'string', description: 'Safe gas price in Gwei' },
                        ProposeGasPrice: { type: 'string', description: 'Proposed gas price in Gwei' },
                        FastGasPrice: { type: 'string', description: 'Fast gas price in Gwei' }
                    }
                }
            }
        }
    }
}
```

### Shared list definition (evmChains)

```javascript
// Shared list: evmChains v1.0.0
export const list = {
    meta: {
        name: 'evmChains',
        version: '1.0.0',
        description: 'Unified EVM chain registry with provider-specific aliases',
        fields: [
            { key: 'alias', type: 'string', description: 'Canonical chain alias' },
            { key: 'chainId', type: 'number', description: 'EVM chain ID' },
            { key: 'name', type: 'string', description: 'Human-readable chain name' },
            { key: 'etherscanAlias', type: 'string', optional: true, description: 'Etherscan API chain parameter' },
            { key: 'moralisChainSlug', type: 'string', optional: true, description: 'Moralis chain slug' }
        ],
        dependsOn: []
    },
    entries: [
        { alias: 'ETHEREUM_MAINNET', chainId: 1, name: 'Ethereum Mainnet', etherscanAlias: 'ETH', moralisChainSlug: 'eth' },
        { alias: 'POLYGON_MAINNET', chainId: 137, name: 'Polygon Mainnet', etherscanAlias: 'POLYGON', moralisChainSlug: 'polygon' },
        { alias: 'ARBITRUM_ONE', chainId: 42161, name: 'Arbitrum One', etherscanAlias: 'ARBITRUM', moralisChainSlug: 'arbitrum' },
        { alias: 'BASE_MAINNET', chainId: 8453, name: 'Base Mainnet', etherscanAlias: 'BASE', moralisChainSlug: 'base' },
        { alias: 'AVALANCHE_C_CHAIN', chainId: 43114, name: 'Avalanche C-Chain', etherscanAlias: null, moralisChainSlug: 'avalanche' }
    ]
}
```

**Key takeaways:**
- `sharedLists` declares which shared lists this schema needs
- `filter: { key: 'etherscanAlias', exists: true }` excludes chains without an Etherscan alias (Avalanche is filtered out)
- `enum({{evmChains:etherscanAlias}})` generates `enum(["ETH","POLYGON","ARBITRUM","BASE","BSC"])` at load time
- `{{SERVER_PARAM:ETHERSCAN_API_KEY}}` injects the API key from the environment
- Fixed parameters like `module` and `action` have hardcoded values (not `{{USER_PARAM}}`)

## 4. Async Workflow Schema

A multi-step API workflow with execute, poll status, and retrieve results. This wraps the Dune Analytics query execution pipeline.

```javascript
// dune-query-engine.mjs
export const main = {
    namespace: 'dune',
    name: 'QueryEngine',
    description: 'Execute and retrieve Dune Analytics SQL queries',
    version: '3.0.0',
    docs: [ 'https://docs.dune.com/api-reference/executions' ],
    tags: [ 'analytics', 'sql', 'blockchain' ],
    root: 'https://api.dune.com',
    requiredServerParams: [ 'DUNE_API_KEY' ],
    requiredLibraries: [],
    headers: {},
    tools: {
        executeQuery: {
            method: 'POST',
            path: '/api/v1/query/{{queryId}}/execute',
            description: 'Execute a saved Dune query',
            parameters: [
                {
                    position: { key: 'queryId', value: '{{USER_PARAM}}', location: 'insert' },
                    z: { primitive: 'number()', options: [ 'min(1)' ] }
                },
                {
                    position: { key: 'x-dune-api-key', value: '{{SERVER_PARAM:DUNE_API_KEY}}', location: 'body' },
                    z: { primitive: 'string()', options: [] }
                }
            ],
            output: {
                mimeType: 'application/json',
                schema: {
                    type: 'object',
                    properties: {
                        execution_id: { type: 'string', description: 'Unique execution identifier' },
                        state: { type: 'string', description: 'Current execution state' }
                    }
                }
            }
        },
        getExecutionStatus: {
            method: 'GET',
            path: '/api/v1/execution/{{executionId}}/status',
            description: 'Check the status of a query execution',
            parameters: [
                {
                    position: { key: 'executionId', value: '{{USER_PARAM}}', location: 'insert' },
                    z: { primitive: 'string()', options: [] }
                },
                {
                    position: { key: 'x-dune-api-key', value: '{{SERVER_PARAM:DUNE_API_KEY}}', location: 'body' },
                    z: { primitive: 'string()', options: [] }
                }
            ],
            output: {
                mimeType: 'application/json',
                schema: {
                    type: 'object',
                    properties: {
                        execution_id: { type: 'string' },
                        state: { type: 'string', description: 'Current state' },
                        queue_position: { type: 'number', description: 'Position in execution queue', nullable: true }
                    }
                }
            }
        },
        getExecutionResults: {
            method: 'GET',
            path: '/api/v1/execution/{{executionId}}/results',
            description: 'Get the results of a completed query execution',
            parameters: [
                {
                    position: { key: 'executionId', value: '{{USER_PARAM}}', location: 'insert' },
                    z: { primitive: 'string()', options: [] }
                },
                {
                    position: { key: 'x-dune-api-key', value: '{{SERVER_PARAM:DUNE_API_KEY}}', location: 'body' },
                    z: { primitive: 'string()', options: [] }
                }
            ],
            output: {
                mimeType: 'application/json',
                schema: {
                    type: 'object',
                    properties: {
                        execution_id: { type: 'string' },
                        state: { type: 'string' },
                        result: {
                            type: 'object',
                            properties: {
                                rows: { type: 'array', items: { type: 'object' } },
                                metadata: {
                                    type: 'object',
                                    properties: {
                                        column_names: { type: 'array', items: { type: 'string' } },
                                        total_row_count: { type: 'number' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
```

**Key takeaways:**
- Three tools form an async workflow: execute, poll, retrieve
- The AI agent calls `executeQuery` first to get an `execution_id`
- Then polls `getExecutionStatus` until `state` is `"QUERY_STATE_COMPLETED"`
- Finally retrieves results with `getExecutionResults`
- Each tool uses `{{SERVER_PARAM:DUNE_API_KEY}}` for authentication
- The AI client orchestrates the multi-step flow using the tool descriptions

:::note
Async workflow schemas work naturally with AI agents. The agent reads the tool descriptions, understands the execute-poll-retrieve pattern, and orchestrates the calls in sequence.
:::

## Pattern Summary

| Pattern | When to use | Example |
|---------|-------------|---------|
| **Minimal** | Simple endpoints with no auth | Health checks, public APIs |
| **Multi-Tool** | Related endpoints from one API | Protocol analytics, user management |
| **Shared List** | Multi-chain or multi-provider schemas | EVM chain selection, exchange lists |
| **Async Workflow** | APIs with execute/poll/retrieve patterns | Query engines, batch processing |
