---
title: Beispiele
description: Praktische FlowMCP-Schema-Beispiele fuer gaengige Muster
---

Diese Beispiele demonstrieren die vier haeufigsten FlowMCP-Schema-Muster, vom einfachsten moeglichen Schema bis zu mehrstufigen asynchronen Workflows. Alle Beispiele verwenden das v3.0.0-Format.

## 1. Minimales Schema

Das einfachste moegliche Schema: ein einzelnes Tool ohne Parameter, ohne Handler und ohne Shared Lists. Dies ist der CoinGecko-API-Ping-Endpunkt.

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

**Kernpunkte:**
- Keine `requiredServerParams` -- diese API braucht keine Authentifizierung
- Kein `handlers`-Export -- die rohe API-Antwort wird direkt zurueckgegeben
- Das `output.schema` beschreibt, was der KI-Client erhaelt
- `parameters: []` bedeutet keine Benutzereingabe noetig

## 2. Multi-Tool-Schema mit Handlern

Mehrere Tools in einem Schema, mit `postRequest`-Handlern, die API-Antworten filtern und umformen. Dies wrappt die DeFi Llama Protocol Analytics API.

### Main-Export

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

### Handlers-Export

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

**Kernpunkte:**
- Vier Tools in einem Schema fuer verwandte Endpunkte
- `location: 'insert'` setzt Parameter in den URL-Pfad ein
- Der `handlers`-Export transformiert Antworten fuer zwei der vier Tools
- Tools ohne Handler geben die rohe API-Antwort zurueck
- Die Handler-Factory erhaelt `{ sharedLists, libraries }` auch wenn ungenutzt

## 3. Shared-List-Schema

Demonstriert Shared-List-Referenzen und `{{listName:fieldName}}`-Interpolation. Dieses Etherscan Gas Tracker Schema nutzt die `evmChains` Shared List, um ein Chain-Selektor-Enum zu generieren.

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

**Kernpunkte:**
- `sharedLists` deklariert, welche Shared Lists dieses Schema braucht
- `filter: { key: 'etherscanAlias', exists: true }` schliesst Chains ohne Etherscan-Alias aus (Avalanche wird gefiltert)
- `enum({{evmChains:etherscanAlias}})` generiert `enum(["ETH","POLYGON","ARBITRUM","BASE","BSC"])` beim Laden
- `{{SERVER_PARAM:ETHERSCAN_API_KEY}}` injiziert den API-Schluessel aus der Umgebung
- Feste Parameter wie `module` und `action` haben hartcodierte Werte (nicht `{{USER_PARAM}}`)

## 4. Asynchrones Workflow-Schema

Ein mehrstufiger API-Workflow mit Ausfuehren, Status abfragen und Ergebnisse abrufen. Dies wrappt die Dune Analytics Query-Execution-Pipeline.

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

**Kernpunkte:**
- Drei Tools bilden einen asynchronen Workflow: Ausfuehren, Abfragen, Abrufen
- Der KI-Agent ruft zuerst `executeQuery` auf, um eine `execution_id` zu erhalten
- Dann fragt er `getExecutionStatus` ab, bis `state` `"QUERY_STATE_COMPLETED"` ist
- Schliesslich ruft er Ergebnisse mit `getExecutionResults` ab
- Jedes Tool verwendet `{{SERVER_PARAM:DUNE_API_KEY}}` zur Authentifizierung
- Der KI-Client orchestriert den mehrstufigen Ablauf anhand der Tool-Beschreibungen

:::note
Asynchrone Workflow-Schemas funktionieren natuerlich mit KI-Agents. Der Agent liest die Tool-Beschreibungen, versteht das Execute-Poll-Retrieve-Muster und orchestriert die Aufrufe sequenziell.
:::

## Muster-Zusammenfassung

| Muster | Wann verwenden | Beispiel |
|--------|---------------|---------|
| **Minimal** | Einfache Endpunkte ohne Auth | Health-Checks, oeffentliche APIs |
| **Multi-Tool** | Verwandte Endpunkte einer API | Protocol Analytics, Benutzerverwaltung |
| **Shared List** | Multi-Chain- oder Multi-Provider-Schemas | EVM-Chain-Auswahl, Boersen-Listen |
| **Async Workflow** | APIs mit Execute/Poll/Retrieve-Muster | Query-Engines, Batch-Verarbeitung |
