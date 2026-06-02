---
title: "GeoJSON as a Sealed SQLite Resource"
description: "How the geojson-sqlite-toolkit turns GeoJSON FeatureCollections into quality-sealed SQLite databases and lets FlowMCP auto-inject spatial query tools — without a single line of parsing config."
date: 2026-06-02
author: "FlowMCP Team"
tags: ["data-formats", "geojson", "add-on", "sqlite", "spatial", "open-data"]
lang: en
---

> 2026-06-02 · FlowMCP Team · #data-formats #geojson #add-on #sqlite

GeoJSON is the format the geospatial web settled on: points, lines, and polygons wrapped in a plain JSON envelope. It is everywhere — administrative boundaries, points of interest, sensor locations, route geometries. But a raw GeoJSON file is awkward to query. "Which features fall inside this bounding box?" or "what is near this coordinate?" means re-parsing the whole file and looping over every feature on every call. The **`geojson-sqlite-toolkit`** add-on fixes that: it converts a GeoJSON FeatureCollection **once** into a quality-sealed SQLite database, and the FlowMCP CLI auto-injects the spatial query tools on top.

## What is GeoJSON?

GeoJSON — standardized as **RFC 7946** — describes geographic features as JSON. A `FeatureCollection` holds a `features[]` array; each feature carries a `geometry` (coordinates as `[lon, lat]`) and a free-form `properties` object. Point, LineString, Polygon, and their Multi-variants are all expressible in the same envelope.

The decisive trait for an add-on is that GeoJSON is **self-describing**. The structure is fixed by the spec, and the attributes travel inside `properties`. There are no column headers to interpret, no separators to guess. So unlike a CSV add-on — which needs explicit parse hints — the GeoJSON converter needs **minimal configuration**. You point it at a file; the shape is already known.

## What is `geojson-sqlite-toolkit`?

It is a **sibling of [`gtfs-sqlite-toolkit`](/blog/2026-05-flowmcp-v41-gtfs-add-on/)** in FlowMCP's data-format add-on family. Like its sibling, it is **not** a generic loader baked into `flowmcp-core`. It is a standalone repository with the full pipeline: its own converter, its own sealed SQLite output, and auto-injection through a `FlowMcpAdapter`. It is distributed via **GitHub, not npm**:

```bash
npm install github:FlowMCP/geojson-sqlite-toolkit
```

The converter does four things:

| Step | What happens |
|------|--------------|
| 1. Parse + validate | Reads and `JSON.parse`s the input, validates it against RFC 7946. |
| 2. Flatten | Writes one row per feature into a `features` table. |
| 3. Seal | Stamps `meta.qualitySeal = 'sqlite-geojson'` — but only when there are no errors and no warnings. |
| 4. Swap atomically | Writes via a temporary `.new` file and an atomic swap, so a half-built DB never appears. |

The seal value `sqlite-geojson` is the contract. It is what a schema references, and it is what the CLI verifies before it trusts the database.

### A representative point — never a silent guess

Some spatial queries need a single point per feature. A polygon or a line does not have one obviously, so the toolkit reduces non-Point geometries to a representative point by an **explicit, documented rule** — never a silent "just take the first coordinate":

| Geometry | Representative point |
|----------|----------------------|
| Point | the point itself |
| MultiPoint | mean of all points |
| LineString | the middle vertex |
| MultiLineString | middle vertex of the longest sub-line |
| Polygon | centroid of the outer ring |
| MultiPolygon | centroid of the outer ring of the first part |

The rule applied to each feature is stored per row, and the full mapping is recorded in the DB's `meta`. The bounding box, by contrast, always spans **every** coordinate of a feature — so a bounding-box query stays exact regardless of which representative point a feature was reduced to.

## The spatial tools

Once a DB is sealed, three queries are available. The radius is given in **meters** at the API; distances are computed with the haversine formula internally:

| Tool | What it answers |
|------|-----------------|
| `featuresInBBox` | All features inside a bounding box (`minLon`, `minLat`, `maxLon`, `maxLat`). |
| `nearPoint` | Features within a radius of a coordinate, sorted by distance, with `distanceM` in the output. |
| `byType` | Features filtered by geometry type and/or a property key/value. |

## How a schema picks them up

A FlowMCP schema never lists these tools by hand. It declares the sealed database as a `sqlite-geojson` resource, and the CLI does the rest — it verifies the seal, reads the capability matrix, and injects exactly the matching tools:

```javascript
export const schema = {
    namespace: 'mygeo',
    name: 'mygeo-features-v1',
    version: '2.0.0',
    main: {
        resources: [
            {
                source:       'sqlite-geojson',
                mode:         'file-based',
                path:         '${FLOWMCP_RESOURCES}/my-features.db',
                addon:        'geojson-sqlite-toolkit',
                addonVersion: '>=0.1.0',
                addonSource:  'github:FlowMCP/geojson-sqlite-toolkit'
            }
        ],
        tools: []
    }
}
```

`${FLOWMCP_RESOURCES}` resolves to the user's own resources directory. The schema stays thin, the engine stays with FlowMCP, and the provider data stays in the user's own database — it never lives in the add-on repo. There are no API keys, because there is no API.

## Why this matters

The add-on concept is the same one GTFS pioneered, applied to a second format: convert an awkward source **once** into a sealed SQLite database, attach a quality seal and a capability matrix, and let the CLI inject only the tools the data can actually answer. GTFS was the heavy-feed case — tens of CSVs in a ZIP. GeoJSON is the self-describing case — one envelope, minimal config. Both end up in the same place: ordinary indexed tables, queryable by deterministic tools, with the engine in one repository and the data in the user's own.

---

> 📖 Read also:
> - *[FlowMCP v4.1 — GTFS as the First Data Class with Its Own Add-on](/blog/2026-05-flowmcp-v41-gtfs-add-on/)* — the sibling add-on, where the sealed-SQLite pattern began.
> - *[SQLite — One Store for Local, Large, and Private Data](/blog/2026-06-local-data-sqlite-preload-shared-lists/)* — the data-anchoring mechanisms behind add-ons like this one.
