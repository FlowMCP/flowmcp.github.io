---
title: Standard-Tags-Referenz
description: Kategorisierungs-Tags fuer FlowMCP-Schemas — verwendet im Tag-Filter-Routing und in der Discovery
---

Standard-Tags kategorisieren Schemas fuer Discovery und Filterung. Jedes Tag gehoert zu einem Cluster (semantische Gruppe). Schema-Autoren setzen `tags: [...]` in `main` mit diesen Standard-Slugs.

## Tag-Katalog

| Slug | Label | Cluster |
|------|-------|---------|
| `blockchain` | Blockchain | crypto |
| `defi` | DeFi | crypto |
| `solana` | Solana | crypto |
| `evm` | EVM | crypto |
| `crypto-data` | Crypto Data | crypto |
| `government-de` | Government DE | government |
| `government-eu` | Government EU | government |
| `analytics` | Analytics | data |
| `nft-identity` | NFT & Identity | web3 |
| `weather-geo` | Weather & Geo | data |
| `web3-social` | Web3 Social | web3 |
| `news-media` | News & Media | data |
| `dev-tools` | Dev Tools & Utilities | tools |
| `other` | Other | misc |

## Cluster-Filter

Cluster gruppieren verwandte Tags fuer High-Level-Filterung:

- **crypto** — blockchain, defi, solana, evm, crypto-data
- **government** — government-de, government-eu
- **data** — analytics, weather-geo, news-media
- **web3** — nft-identity, web3-social
- **tools** — dev-tools
- **misc** — other

## Filter-Routing

Tags treiben URL-Parameter-basierte Filterung auf der Schema-Katalog-Seite:

```
/schemas?tag=defi              -> Single-Tag-Filter
/schemas?tag=defi,evm          -> Multi-Tag (Schnittmenge)
/schemas?cluster=crypto        -> Alle Tags im Cluster
```

Die Tag-Cloud auf der Landing-Seite verlinkt in diese URLs.

## Schema-Autor-Konventionen

- **Semantische Tags verwenden**, die die Datendomain beschreiben — keine API-Routes
- **Bestehende Standard-Tags bevorzugen**, statt neue zu erfinden — bewahrt Discovery-Konsistenz
- **Maximal 5 Tags pro Schema** — Fokus statt Breite
- **Keine hardcoded Route-Namen** als Tags (z. B. `provider.getRoute1`)

## Datenquelle

Die kanonische Tag-Liste lebt in `src/data/standard-tags.mjs`. Das Build-Script liest sie automatisch fuer Tag-Cloud-Rendering.
