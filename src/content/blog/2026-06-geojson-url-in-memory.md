---
title: "GeoJSON as a URL-Loaded In-Memory Resource"
description: "How the geo-geojson-toolkit fetches a complete GeoJSON FeatureCollection by URL, validates it on load, and lets FlowMCP auto-inject spatial query tools served from memory — without a single line of parsing config."
date: 2026-06-02
author: "FlowMCP Team"
tags: ["data-formats", "geojson", "add-on", "url", "spatial", "open-data"]
lang: en
---

> 2026-06-02 · FlowMCP Team · #data-formats #geojson #add-on #url

> **Architecture note:** an earlier version of this add-on built a sealed SQLite file. It was corrected to a **URL + in-memory** model in Memo 096: the complete file is fetched in one request, validated on load, and queried from memory — no `.db` file, no quality seal, no converter step.

GeoJSON is the format the geospatial web settled on: points, lines, and polygons wrapped in a plain JSON envelope. It is everywhere — administrative boundaries, points of interest, sensor locations, route geometries. But a raw GeoJSON file is awkward to query. "Which features fall inside this bounding box?" or "what is near this coordinate?" means re-parsing the whole file and looping over every feature on every call. The **`geo-geojson-toolkit`** add-on fixes that: it fetches a GeoJSON FeatureCollection **once** from a URL, holds it in memory, and the FlowMCP CLI auto-injects the spatial query tools on top.

## What is GeoJSON?

GeoJSON — standardized as **RFC 7946** — describes geographic features as JSON. A `FeatureCollection` holds a `features[]` array; each feature carries a `geometry` (coordinates as `[lon, lat]`) and a free-form `properties` object. Point, LineString, Polygon, and their Multi-variants are all expressible in the same envelope.

The decisive trait for an add-on is that GeoJSON is **self-describing**. The structure is fixed by the spec, and the attributes travel inside `properties`. There are no column headers to interpret, no separators to guess. So unlike a CSV add-on — which needs explicit parse hints — the GeoJSON loader needs **no configuration**. You point it at a URL; the shape is already known.

## What is `geo-geojson-toolkit`?

It is a **sibling of [`geo-gtfs-toolkit`](/blog/2026-05-flowmcp-v41-gtfs-add-on/)** in FlowMCP's data-format add-on family. Like its sibling, it is **not** a generic loader baked into `flowmcp-core`. It is a standalone repository with the full pipeline: its own URL store, its own in-memory query methods, and auto-injection through a `FlowMcpAdapter`. It is distributed via **GitHub, not npm**:

```bash
npm install github:FlowMCP/geo-geojson-toolkit
```

On init (the resource loads on first use — there is no `add` step), the add-on does four things:

| Step | What happens |
|------|--------------|
| 1. Fetch | Fetches the **COMPLETE** GeoJSON document in a **single HTTPS request**. |
| 2. Parse + validate | `JSON.parse`s the response and validates it against RFC 7946 — **validate-on-load** replaces the old quality seal. Invalid GeoJSON aborts the load. |
| 3. Reduce | Flattens every feature into a query-ready row (with an explicit representative point). |
| 4. Hold in memory | Keeps the rows **in memory**, keyed by URL. There is no `.db` file and no on-disk artifact. |

There is no converter step, no seal, and no `dbPath`. Validate-on-load is the contract: a file that does not parse as RFC 7946 GeoJSON never makes it into memory, so the tools only ever serve a file that was checked.

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

The rule applied to each feature is stored per row. The bounding box, by contrast, always spans **every** coordinate of a feature — so a bounding-box query stays exact regardless of which representative point a feature was reduced to.

## The spatial tools

Once a file is loaded, three queries are available, served from memory. The radius is given in **meters** at the API; distances are computed with the Haversine formula internally:

| Tool | What it answers |
|------|-----------------|
| `featuresInBBox` | All features inside a bounding box (`minLon`, `minLat`, `maxLon`, `maxLat`). |
| `nearPoint` | Features within a radius of a coordinate, sorted by distance, with `distanceM` in the output. |
| `byType` | Features filtered by geometry type and/or a property key/value. |

Because the methods live in one central add-on, a fix propagates to every schema that uses it — there is no per-file copy to keep in sync.

## How a schema picks them up

A FlowMCP schema never lists these tools by hand. It declares a thin URL resource, and the CLI does the rest — it fetches and validates the file on load, reads the capability matrix, and injects exactly the matching tools:

```javascript
export const schema = {
    namespace: 'mygeo',
    name: 'mygeo-features-v1',
    version: '2.0.0',
    main: {
        resources: [
            {
                source:       'geo-geojson',
                mode:         'url',
                url:          'https://example.org/features.geojson',
                addon:        'geo-geojson-toolkit',
                addonVersion: '>=0.1.0',
                addonSource:  'github:FlowMCP/geo-geojson-toolkit'
            }
        ],
        tools: []
    }
}
```

The schema stays thin, the engine stays with FlowMCP, and the provider data stays at the provider's own URL — it never lives in the add-on repo. There are no API keys, because there is no API.

## Scope: complete, single-step downloads

The URL model assumes the whole FeatureCollection comes back in **one** request. That covers the common case — a published, static GeoJSON file. Paginated or query-per-page sources such as **WFS are out of scope**: a single `loadFromUrl` cannot reconstruct them, and quietly stitching pages together would be exactly the kind of silent guess the toolkit avoids.

## Why this matters

The add-on concept is the same one GTFS pioneered, applied to a second format: take an awkward source, prepare it **once**, validate it, and let the CLI inject only the tools the data can actually answer. GeoJSON is the self-describing case — one envelope, no config. Where the original design built and sealed a SQLite file on disk, the corrected design (Memo 096) fetches the complete file by URL and serves queries from memory: a thinner schema, no on-disk artifact, and a single central implementation behind every spatial tool.

---

> 📖 Read also:
> - *[FlowMCP v4.1 — GTFS as the First Data Class with Its Own Add-on](/blog/2026-05-flowmcp-v41-gtfs-add-on/)* — the sibling add-on, where the data-format add-on pattern began.
> - *[SQLite — One Store for Local, Large, and Private Data](/blog/2026-06-local-data-sqlite-preload-shared-lists/)* — the data-anchoring mechanisms behind add-ons like this one.
</content>
