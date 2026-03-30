---
title: Schema-Bibliothek
description: 187+ vorgefertigte API-Schemas sofort einsatzbereit
---

Die [FlowMCP Schema-Bibliothek](https://github.com/FlowMCP/flowmcp-schemas) ist eine kuratierte Sammlung von 187+ produktionsreifen Schemas fuer DeFi, Blockchain-Analytik, Utilities und mehr. Jedes Schema folgt der FlowMCP v2.0.0-Spezifikation und ist validiert, getestet und einsatzbereit.

**Schemas durchsuchen:** [flowmcp.github.io/flowmcp-schemas](https://flowmcp.github.io/flowmcp-schemas/)

## Kategorien

:::note[DeFi & Blockchain]
**Etherscan** -- Contract ABI, Kontostande, Transaktionen, Gas-Tracking ueber EVM-Chains

**CoinGecko** -- Preise, Marktdaten, Coin-Metadaten, Trending

**DeFi Llama** -- Protokoll-TVL, Chain-Analytik, Yields, Stablecoin-Daten

**Moralis** -- Token-Transfers, NFT-Daten, Wallet-Historie

**Dune Analytics** -- SQL-Query-Ausfuehrung und Ergebnisabruf

**CoinCap** -- Echtzeit-Asset-Preise und Exchange-Daten
:::

:::note[Blockchain-Infrastruktur]
**Solscan** -- Solana-Kontodaten, Transaktionen, Token-Informationen

**Helius** -- Solana RPC und DAS API

**CryptoCompare** -- Krypto-Preise und historische Daten

**DeBank** -- Portfolio-Tracking ueber Chains hinweg

**DexScreener** -- DEX-Pair-Analytik und Handelsdaten
:::

## Verwendung

1. **Verfuegbare Schemas durchsuchen**

   Besuche [flowmcp.github.io/flowmcp-schemas](https://flowmcp.github.io/flowmcp-schemas/) um alle verfuegbaren Schemas zu erkunden, oder nutze die CLI:

   ```bash
   flowmcp search etherscan
   flowmcp search "gas price"
   flowmcp search defi
   ```

2. **Schemas importieren**

   Importiere die gesamte Schema-Bibliothek in deine FlowMCP CLI:

   ```bash
   flowmcp import https://github.com/FlowMCP/flowmcp-schemas
   ```

   Falls du bereits `flowmcp init` ausgefuehrt hast, sind die Schemas moeglicherweise bereits importiert.

3. **Tools zum Projekt hinzufuegen**

   Aktiviere bestimmte Tools:

   ```bash
   flowmcp add coingecko_simplePrice
   flowmcp add etherscan_getGasOracle
   ```

   Oder erstelle eine Gruppe mit mehreren Tools:

   ```bash
   flowmcp group append defi --tools "flowmcp-schemas/coingecko/simplePrice.mjs,flowmcp-schemas/defillama/protocols.mjs"
   flowmcp group set-default defi
   ```

4. **Tools aufrufen**

   Fuehre Tools direkt aus:

   ```bash
   flowmcp call coingecko_simplePrice '{"ids":"bitcoin","vs_currencies":"usd"}'
   ```

   Oder starte einen MCP-Server, um sie AI-Clients bereitzustellen:

   ```bash
   flowmcp run
   ```

## Schemas programmatisch verwenden

Importiere Schemas direkt in deinem Node.js-Code:

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

Einige Schemas erfordern API Keys. Diese werden im `requiredServerParams`-Feld des Schemas deklariert:

| Anbieter | Erforderlicher Key | Kostenloses Kontingent |
|----------|-------------------|----------------------|
| Etherscan | `ETHERSCAN_API_KEY` | Ja |
| CoinGecko | `COINGECKO_API_KEY` | Ja (limitiert) |
| Moralis | `MORALIS_API_KEY` | Ja |
| Dune Analytics | `DUNE_API_KEY` | Ja (limitiert) |
| Helius | `HELIUS_API_KEY` | Ja |

Speichere API Keys in `~/.flowmcp/.env`:

```bash
ETHERSCAN_API_KEY=your_key_here
COINGECKO_API_KEY=your_key_here
MORALIS_API_KEY=your_key_here
```

:::note
Schemas ohne `requiredServerParams` (wie CoinGecko ping oder DeFi Llama protocols) funktionieren ohne API Keys.
:::

## Shared Lists

Viele Schemas referenzieren Shared Lists zur anbieteruebergreifenden Wertnormalisierung. Die haeufigste Shared List ist `evmChains`, die ein einheitliches Chain-Register bereitstellt:

```javascript
// Schema references the shared list
sharedLists: [
    { ref: 'evmChains', version: '1.0.0', filter: { key: 'etherscanAlias', exists: true } }
]

// Parameter uses the list for enum generation
z: { primitive: 'enum({{evmChains:etherscanAlias}})', options: [] }
```

Das bedeutet, ein einzelnes Schema kann mehrere EVM-Chains ueber denselben Parameter unterstuetzen, wobei die Chain-Liste zentral gepflegt wird.

## Beitragen

Neue Schemas sind willkommen. Folge diesen Schritten:

1. **Repository forken**

   Forke [FlowMCP/flowmcp-schemas](https://github.com/FlowMCP/flowmcp-schemas) auf GitHub.

2. **Schema erstellen**

   Schreibe dein Schema gemaess dem [Schema Creation Guide](/docs/guides/schema-creation). Platziere es im entsprechenden Anbieter-Verzeichnis.

3. **Validieren**

   Fuehre die Validierung gegen die FlowMCP-Spezifikation aus:

   ```bash
   flowmcp validate ./your-schema.mjs
   ```

4. **Testen**

   Teste mit Live-API-Aufrufen:

   ```bash
   flowmcp test single ./your-schema.mjs
   ```

5. **Pull Request einreichen**

   Eroeffne einen PR mit deinem Schema. Fuege die Validierungs- und Testergebnisse in die PR-Beschreibung ein.

### Qualitaetsstandards

Alle Schemas in der Bibliothek muessen diese Anforderungen erfuellen:

- **v2.0.0-Format** mit allen Pflichtfeldern (`namespace`, `name`, `description`, `version`, `routes`)
- **Output-Schemas** fuer alle Routes (`output.schema` mit JSON Schema zur Beschreibung der Antwort)
- **Dokumentations-Links** im `docs`-Feld
- **Tags** fuer Auffindbarkeit
- **Bestandene Validierung** via `flowmcp validate`
- **Bestandene Tests** via `flowmcp test single` (mindestens eine Route muss Daten zurueckgeben)

:::caution
Schemas, die Validierung oder Tests nicht bestehen, werden nicht gemerged. Fuehre sowohl `flowmcp validate` als auch `flowmcp test single` vor dem Einreichen aus.
:::

## Links

- **Schema-Browser**: [flowmcp.github.io/flowmcp-schemas](https://flowmcp.github.io/flowmcp-schemas/)
- **GitHub**: [FlowMCP/flowmcp-schemas](https://github.com/FlowMCP/flowmcp-schemas)
- **FlowMCP-Spezifikation**: [Specification v2.0.0](/docs/reference/specification)
