---
title: "CSV and TSV from a URL — With a Mandatory Parse Config"
description: "Why a CSV file can't describe itself, and how the csv-tsv-sqlite-toolkit loads geo CSV/TSV from a URL into memory by forcing every parse decision to be explicit — no silent defaults."
date: 2026-06-02
author: "FlowMCP Team"
tags: ["data-formats", "csv", "tsv", "add-on", "url", "open-data"]
lang: en
---

> 2026-06-02 · FlowMCP Team · #data-formats #csv #add-on #url

> **Architecture note:** an earlier version of this add-on built a sealed SQLite file. It was corrected to a **URL + in-memory** model in Memo 096: the complete file is fetched in one request, validated on load, and queried from memory — no `.db` file, no quality seal, no converter step.

CSV is the most common shape open data ships in — and the most ambiguous. A spreadsheet of places, coordinates, populations, capital flags looks trivial until you actually have to parse it. Is the separator a comma or a semicolon? Is `52,5` one decimal number or two columns? Which column is the latitude? The file itself won't tell you. The new **`csv-tsv-sqlite-toolkit`** loads geo CSV/TSV from a URL into memory — and its whole design is built around forcing you to answer those questions instead of guessing.

## The problem: CSV is not self-describing

This is the key difference from its sibling [`geojson-sqlite-toolkit`](https://github.com/FlowMCP/geojson-sqlite-toolkit). A GeoJSON file carries its own structure — geometry types, coordinate order, properties — so a loader can read it without being told anything. A CSV cannot. The same file of European cities might use a comma separator with point decimals (`Berlin,52.52,13.41`) or a semicolon separator with comma decimals (`Berlin;52,52;13,41`). Both are valid CSV. Guess wrong and you silently get garbage: one column instead of three, strings where numbers belong, latitudes that are off by an order of magnitude.

Three things genuinely cannot be derived from the bytes:

- the **separator** (comma, semicolon, or tab),
- the **decimal notation** (point or comma),
- which columns carry **latitude and longitude**.

A loader that quietly picks defaults for these is a loader that will eventually mangle your data without a word.

## No silent defaults

So the toolkit refuses to guess. It enforces a **mandatory parse config**, and if any required field is missing, the load **aborts** with a `CSV-URL-005` error — it never falls back to a default.

| Field | Type | Allowed values |
|-------|------|----------------|
| `separator` | enum | `comma` (`,`), `semicolon` (`;`), `tab` (`\t`) |
| `decimal` | enum | `point` (`1.5`), `comma` (`1,5`) |
| `latColumn` | string | header name of the latitude column |
| `lonColumn` | string | header name of the longitude column |
| `typeCoercion` | object | column → `integer` \| `number` \| `string` \| `boolean` |

This is the heart of the toolkit. Every decision that could go wrong silently is instead a decision you make on the record. The trade is deliberate: a little more typing up front, and in return a load that is reproducible and honest about what it did. The configured geo and `typeCoercion` columns are checked against the actual header **on load** — if a declared column is missing, the load aborts rather than serving silent garbage.

**TSV is just CSV with a tab separator.** There is no separate code path — a TSV file is loaded by declaring `separator: 'tab'`.

### The 0/1 trap

The same principle governs types. A column of `0`s and `1`s is the classic ambiguity: is it a boolean flag, or a small integer? The toolkit takes the conservative position. A `0`/`1` column **without** an explicit type stays an **Integer** — it is *never* silently turned into a Boolean. You get a Boolean **only** when `typeCoercion` declares that column as `boolean`. (This matches FlowMCP's own `boolean()` rule, so types behave the same way everywhere.)

## How it plugs into FlowMCP

The toolkit follows the same add-on pattern as its sibling `geojson-sqlite-toolkit`: own repo → thin URL schema → in-memory load → auto-injected tools. On `flowmcp add`, the add-on fetches the **complete** CSV/TSV in a **single HTTPS request**, parses it with the mandatory `parseConfig`, validates the declared columns exist, and holds the rows **in memory** keyed by URL — there is no SQLite file and no quality seal. A schema then just declares the URL:

```javascript
export const schema = {
    namespace: 'places',
    name: 'places-csv-v1',
    version: '1.0.0',
    main: {
        resources: [
            {
                source:       'sqlite-csv',
                mode:         'url',
                url:          'https://example.org/places.csv',
                addon:        'csv-tsv-sqlite-toolkit',
                addonVersion: '>=0.1.0',
                addonSource:  'github:FlowMCP/csv-tsv-sqlite-toolkit',
                parseConfig: {
                    separator: 'semicolon',
                    decimal:   'comma',
                    latColumn: 'latitude',
                    lonColumn: 'longitude',
                    typeCoercion: { population: 'integer' }
                }
            }
        ],
        tools: [
            // Default spatial tools are injected automatically.
        ]
    }
}
```

When the FlowMCP CLI sees a `source: 'sqlite-csv'` resource, it loads and validates the file on add, reads the capability matrix, then auto-injects the spatial tools the loaded file can actually answer:

| Tool | Returns | Requires |
|------|---------|----------|
| `featuresInBBox` | rows within a latitude/longitude bounding box | `spatialQuery` |
| `nearPoint` | rows near a coordinate, Haversine-sorted | `spatialQuery` |
| `byType` | exact-match attribute filter on any column | `attributeFilter` |

Tool names are prefixed with the schema namespace — `places.nearPoint`, `places.featuresInBBox`. If the loaded data lacks a capability (say it has no usable coordinate columns), the matching tool is simply not injected. No 404, no error at call time, no hallucinated answer. Because the query methods live in one central add-on, a fix propagates to every schema that uses it.

## Distribution and data policy

Like its sibling, the toolkit ships **via GitHub, not the npm registry**:

```bash
npm install github:FlowMCP/csv-tsv-sqlite-toolkit
```

Provider CSV/TSV datasets carry their own licenses and are **never** shipped in the repo — only a synthetic CC0 fixture for tests. The schema points at the provider's own HTTPS URL; the data stays at the provider, and the engine stays with FlowMCP. The model assumes the whole file comes back in **one** request — paginated sources (e.g. WFS) are out of scope.

## Why this matters

CSV is where open data lives, and silent parsing is where open-data pipelines quietly go wrong. The `csv-tsv-sqlite-toolkit` makes the awkward parts of CSV impossible to skip: you state the separator, the decimal notation, the coordinate columns, and the type of every ambiguous column, or the load stops and tells you why. What you get back is a validated, in-memory dataset behind three spatial tools wired into FlowMCP for free. No guessing, no defaults, no surprises — and, since Memo 096, no on-disk artifact either.

---

> 📖 Read also:
> - *[FlowMCP v4.1 — GTFS as the First Data Class with Its Own Add-on](/blog/2026-05-flowmcp-v41-gtfs-add-on/)* — the add-on pattern this toolkit follows, on a heavy CSV-in-ZIP dataset.
> - *[GeoJSON as a URL-Loaded In-Memory Resource](/blog/2026-06-geojson-url-in-memory/)* — the self-describing sibling that needs no parse config.
</content>
