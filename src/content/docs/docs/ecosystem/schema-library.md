---
title: Schema Library
description: 187+ pre-built API schemas ready to use
---

The [FlowMCP Schema Library](https://github.com/FlowMCP/flowmcp-schemas) is a curated collection of 187+ production-ready schemas covering DeFi, blockchain analytics, utilities, and more. Each schema follows the FlowMCP v2.0.0 specification and is validated, tested, and ready to use.

**Browse schemas:** [flowmcp.github.io/flowmcp-schemas](https://flowmcp.github.io/flowmcp-schemas/)

## Categories

:::note[DeFi & Blockchain]
**Etherscan** -- Contract ABI, balances, transactions, gas tracking across EVM chains

**CoinGecko** -- Prices, market data, coin metadata, trending

**DeFi Llama** -- Protocol TVL, chain analytics, yields, stablecoin data

**Moralis** -- Token transfers, NFT data, wallet history

**Dune Analytics** -- SQL query execution and result retrieval

**CoinCap** -- Real-time asset pricing and exchange data
:::

:::note[Blockchain Infrastructure]
**Solscan** -- Solana account data, transactions, token info

**Helius** -- Solana RPC and DAS API

**CryptoCompare** -- Crypto pricing and historical data

**DeBank** -- Portfolio tracking across chains

**DexScreener** -- DEX pair analytics and trading data
:::

## How to Use

1. **Browse available schemas**

   Visit [flowmcp.github.io/flowmcp-schemas](https://flowmcp.github.io/flowmcp-schemas/) to explore all available schemas, or use the CLI:

   ```bash
   flowmcp search etherscan
   flowmcp search "gas price"
   flowmcp search defi
   ```

2. **Import schemas**

   Import the full schema library into your FlowMCP CLI:

   ```bash
   flowmcp import https://github.com/FlowMCP/flowmcp-schemas
   ```

   Or if you already ran `flowmcp init`, schemas may already be imported.

3. **Add tools to your project**

   Activate specific tools:

   ```bash
   flowmcp add coingecko_simplePrice
   flowmcp add etherscan_getGasOracle
   ```

   Or create a group with multiple tools:

   ```bash
   flowmcp group append defi --tools "flowmcp-schemas/coingecko/simplePrice.mjs,flowmcp-schemas/defillama/protocols.mjs"
   flowmcp group set-default defi
   ```

4. **Call tools**

   Execute tools directly:

   ```bash
   flowmcp call coingecko_simplePrice '{"ids":"bitcoin","vs_currencies":"usd"}'
   ```

   Or start an MCP server to expose them to AI clients:

   ```bash
   flowmcp run
   ```

## Using Schemas Programmatically

Import schemas directly in your Node.js code:

```javascript
import { FlowMCP } from 'flowmcp-core'

// Load a schema from file
const { status, main, handlerMap } = await FlowMCP.loadSchema( {
    filePath: './node_modules/flowmcp-schemas/coingecko/simplePrice.mjs'
} )

// Execute a tool call
const result = await FlowMCP.fetch( {
    main,
    handlerMap,
    userParams: { ids: 'bitcoin', vs_currencies: 'usd' },
    serverParams: {},
    routeName: 'simplePrice'
} )

console.log( result.dataAsString )
```

## API Keys

Some schemas require API keys. These are declared in the schema's `requiredServerParams` field:

| Provider | Required Key | Free Tier |
|----------|-------------|-----------|
| Etherscan | `ETHERSCAN_API_KEY` | Yes |
| CoinGecko | `COINGECKO_API_KEY` | Yes (limited) |
| Moralis | `MORALIS_API_KEY` | Yes |
| Dune Analytics | `DUNE_API_KEY` | Yes (limited) |
| Helius | `HELIUS_API_KEY` | Yes |

Store API keys in `~/.flowmcp/.env`:

```bash
ETHERSCAN_API_KEY=your_key_here
COINGECKO_API_KEY=your_key_here
MORALIS_API_KEY=your_key_here
```

:::note
Schemas without `requiredServerParams` (like CoinGecko ping or DeFi Llama protocols) work without any API keys.
:::

## Shared Lists

Many schemas reference shared lists for cross-provider value normalization. The most common shared list is `evmChains`, which provides a unified chain registry:

```javascript
// Schema references the shared list
sharedLists: [
    { ref: 'evmChains', version: '1.0.0', filter: { key: 'etherscanAlias', exists: true } }
]

// Parameter uses the list for enum generation
z: { primitive: 'enum({{evmChains:etherscanAlias}})', options: [] }
```

This means a single schema can support multiple EVM chains through the same parameter, with the chain list maintained centrally.

## Contributing

New schemas are welcome. Follow these steps:

1. **Fork the repository**

   Fork [FlowMCP/flowmcp-schemas](https://github.com/FlowMCP/flowmcp-schemas) on GitHub.

2. **Create your schema**

   Write your schema following the [Schema Creation Guide](/docs/guides/schema-creation). Place it in the appropriate provider directory.

3. **Validate**

   Run validation against the FlowMCP specification:

   ```bash
   flowmcp validate ./your-schema.mjs
   ```

4. **Test**

   Test with live API calls:

   ```bash
   flowmcp test single ./your-schema.mjs
   ```

5. **Submit a pull request**

   Open a PR with your schema. Include the validation and test results in the PR description.

### Quality Standards

All schemas in the library must meet these requirements:

- **v2.0.0 format** with all required fields (`namespace`, `name`, `description`, `version`, `routes`)
- **Output schemas** for all routes (`output.schema` with JSON Schema describing the response)
- **Documentation links** in the `docs` field
- **Tags** for discoverability
- **Passing validation** via `flowmcp validate`
- **Passing tests** via `flowmcp test single` (at least one route must return data)

:::caution
Schemas that fail validation or testing will not be merged. Run both `flowmcp validate` and `flowmcp test single` before submitting.
:::

## Links

- **Schema Browser**: [flowmcp.github.io/flowmcp-schemas](https://flowmcp.github.io/flowmcp-schemas/)
- **GitHub**: [FlowMCP/flowmcp-schemas](https://github.com/FlowMCP/flowmcp-schemas)
- **FlowMCP Spec**: [Specification v2.0.0](/docs/reference/specification)
