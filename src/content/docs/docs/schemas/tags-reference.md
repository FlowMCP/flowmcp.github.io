---
title: Standard Tags Reference
description: Categorization tags for FlowMCP schemas — used in tag-filter routing and discovery
---
<!-- PAGEFIND-META-START -->
<span style="display:none" data-pagefind-meta="section">Docs > Schemas</span>
<!-- PAGEFIND-META-END -->

Standard tags categorize schemas for discovery and filtering. Each tag belongs to a cluster (semantic group). Schema authors set `tags: [...]` in `main` using these standard slugs.

## Tag Catalog

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

Clusters group related tags for high-level filtering:

- **crypto** — blockchain, defi, solana, evm, crypto-data
- **government** — government-de, government-eu
- **data** — analytics, weather-geo, news-media
- **web3** — nft-identity, web3-social
- **tools** — dev-tools
- **misc** — other

## Filter Routing

Tags drive URL-param-based filtering on the Schema Catalog page (Phase 8, in development):

```
/schemas?tag=defi              -> single-tag filter
/schemas?tag=defi,evm          -> multi-tag (intersection)
/schemas?cluster=crypto        -> all tags in cluster
```

The Tag-Cloud on the Landing page links into these URLs.

## Schema Author Conventions

- **Use semantic tags** describing the data domain, not API routes
- **Prefer existing standard tags** over inventing new ones — keeps discovery consistent
- **Maximum 5 tags per schema** — focus over breadth
- **No hardcoded route names** as tags (e.g. `provider.getRoute1`)

## Data Source

The canonical tag list lives in `src/data/standard-tags.mjs`. The build script picks them up automatically for Tag-Cloud rendering.
