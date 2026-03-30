---
title: Prompts
description: "Erklaerende Namespace-Beschreibungen hinzufuegen, die KI-Agenten beibringen, wie sie deine Tools effektiv nutzen"
---

Prompts sind erklaerende Texte, die einem Namespace zugeordnet sind. Sie bringen KI-Agenten bei, wie die Tools eines Providers zusammenarbeiten -- Paginierungs-Muster, Fehlercodes, Rate Limits, Endpoint-Kombination. Prompts **erklaeren**, sie **instruieren** nicht (dafuer sind [Skills](/de/docs/schemas/skills/) da).

## Prompts vs Skills

| Aspekt | Prompts | Skills |
|--------|---------|--------|
| Zweck | Erklaeren wie Tools funktionieren | Schritt-fuer-Schritt-Workflows anweisen |
| Tonfall | "So funktioniert Paginierung..." | "Schritt 1: Rufe X auf. Schritt 2: Uebergib Ergebnis an Y." |
| Modellabhaengigkeit | Modellneutral | Modellspezifisch (`testedWith` erforderlich) |
| Scope | Einzelner Namespace | Kann Tools aus eigenem Schema referenzieren |

Siehe [Prompt-Architektur](/de/docs/specification/prompt-architecture/) fuer das vollstaendige Zwei-Stufen-System (Provider-Prompts vs Agent-Prompts).

## Prompts definieren

Prompts werden in `main.prompts` deklariert und aus externen `.mjs`-Dateien via `contentFile` geladen:

```javascript
export const main = {
    namespace: 'coingecko',
    // ... andere Felder ...
    prompts: {
        'about': { contentFile: './prompts/about.mjs' },
        'pagination-guide': { contentFile: './prompts/pagination-guide.mjs' }
    }
}
```

## Prompt-Dateiformat

Jeder Prompt ist eine `.mjs`-Datei, die ein `prompt`-Objekt exportiert:

```javascript
// prompts/about.mjs
export const prompt = {
    name: 'about',
    version: 'flowmcp-prompt/1.0.0',
    provider: 'coingecko',
    description: 'Overview of CoinGecko API capabilities and best practices',
    dependsOn: ['coingecko.simplePrice', 'coingecko.coinMarkets', 'coingecko.coinMarketChart'],
    references: [],
    content: `CoinGecko provides cryptocurrency market data through three main tools:

Use {{tool:simplePrice}} for current prices of one or more tokens.
Use {{tool:coinMarkets}} for market cap rankings with sorting and pagination.
Use {{tool:coinMarketChart}} for historical price data over {{input:days}} days.

All price endpoints return values in the currency specified by {{input:vsCurrency}}.
Rate limit: 30 requests per minute on the free tier.`
}
```

## Platzhalter-Syntax

Verwende `{{type:name}}`-Platzhalter im `content`-Feld, um Schema-Elemente zu referenzieren:

| Platzhalter | Loest auf zu | Beispiel |
|-------------|-------------|---------|
| `{{tool:name}}` | Ein Tool im selben Namespace | `{{tool:simplePrice}}` |
| `{{input:key}}` | Ein User-Eingabeparameter | `{{input:tokenId}}` |
| `{{resource:name}}` | Eine Resource im selben Namespace | `{{resource:companiesDb}}` |

:::note
**Die `about`-Konvention** -- Jeder Provider sollte einen `about`-Prompt haben, der die gesamten API-Faehigkeiten, gaengige Muster und Fallstricke beschreibt. Dies ist das Erste, was ein KI-Agent liest, wenn er einen neuen Namespace entdeckt.
:::

## Vollstaendiges Beispiel

Ein CoinGecko-Schema mit einem `about`-Prompt:

```javascript
// coingecko-coins.mjs
export const main = {
    namespace: 'coingecko',
    name: 'CoinData',
    version: '3.0.0',
    root: 'https://api.coingecko.com/api/v3',
    tools: {
        simplePrice: { /* ... */ },
        coinMarkets: { /* ... */ },
        coinMarketChart: { /* ... */ }
    },
    prompts: {
        'about': { contentFile: './prompts/about.mjs' }
    }
}
```

```javascript
// prompts/about.mjs
export const prompt = {
    name: 'about',
    version: 'flowmcp-prompt/1.0.0',
    provider: 'coingecko',
    description: 'How to use CoinGecko tools effectively',
    dependsOn: ['coingecko.simplePrice', 'coingecko.coinMarkets', 'coingecko.coinMarketChart'],
    references: [],
    content: `CoinGecko provides real-time and historical cryptocurrency data.

{{tool:simplePrice}} returns current prices. Pass comma-separated token IDs.
{{tool:coinMarkets}} returns paginated market data sorted by market cap.
  - Use page and per_page parameters for pagination (max 250 per page).
  - Default sort is market_cap_desc.
{{tool:coinMarketChart}} returns OHLC + volume over {{input:days}} days.
  - Granularity is automatic: 1-2 days = 5min, 3-30 days = hourly, 31+ = daily.

All endpoints accept {{input:vsCurrency}} (e.g. "usd", "eur", "btc").`
}
```
