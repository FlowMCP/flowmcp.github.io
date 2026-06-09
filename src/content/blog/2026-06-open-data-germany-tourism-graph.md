---
title: "Open Data Germany × FlowMCP — A Tourism Graph You Can Combine"
description: "An experiment in joining Germany's national tourism knowledge graph with other open-data sources via the geo-dzt-toolkit — keyed access, renderable trail routes, a DHID bridge to public transit, an honest coverage contract, and a per-object Creative Commons licence model you must actually read."
date: 2026-06-09
author: "FlowMCP Team"
tags: ["geo", "dzt", "tourism", "germany", "add-on", "live-query", "open-data", "licensing"]
lang: en
---

> 2026-06-09 · FlowMCP Team · #geo #dzt #add-on #open-data

The **DZT Knowledge Graph** (Deutsche Zentrale für Tourismus / "Open Data Germany") is a country-scale tourism graph: 200,000-plus datasets — tourism objects (POIs, tours, events, gastronomy, hotels) plus infrastructure — drawn from all 16 federal states, public since June 2023, modelled in schema.org extended with the ODTA tourism ontology. It is a *knowledge graph* (RDF, queried by SPARQL), not a flat REST API.

## First, the honest part: this is an experiment, and the source has its own MCP server

Open Data Germany already publishes its **own** MCP server dedicated to this graph — ["MCP Server – AI access to the Open Data Knowledge Graph"](https://open-data-germany.org/en/mcp-server-ai-access-to-the-open-data-knowledge-graph/): *"With the MCP Server (Model Context Protocol), we provide the Open Data Knowledge Graph of German tourism for modern AI applications."* If all you need is the DZT data, **use theirs** — it is the source's own, focused tool.

The FlowMCP [`geo-dzt-toolkit`](https://github.com/FlowMCP/geo-dzt-toolkit) is a different bet. It is an **experiment in *combining*** the DZT graph with other open-data sources behind one geo entry point — public transit (the zHV/DHID registry), geocoding (Nominatim, OpenPLZ), and OpenStreetMap ([Overpass](https://github.com/FlowMCP/geo-overpass-toolkit)). The value here is not re-exposing DZT; it is the **joins** between it and the rest of the open-data world.

## Access needs a key

The graph is open, but retrieval is gated: you need a free API key, sent as the `x-api-key` header, obtained on registration via the project's [data-access page](https://open-data-germany.org/en/retrieve-open-data/) (contact `open-data@germany.travel`). So the DZT tools are **keyed** — without the key they show up disabled, while the keyless `geo` tools (forward/reverse/nearby/…) keep working untouched. That separation is deliberate: a missing tourism key never blocks the rest of geo.

## Where it fits

The geo add-ons form a small family: in-memory-static ([geojson](https://github.com/FlowMCP/geo-geojson-toolkit) / [csv-tsv](https://github.com/FlowMCP/geo-csv-tsv-toolkit)), sealed-SQLite ([gtfs](https://github.com/FlowMCP/geo-gtfs-toolkit)), and live-query ([overpass](https://github.com/FlowMCP/geo-overpass-toolkit), now DZT). What makes DZT special among them is **tourism semantics OSM does not carry**: events with dates, trails as renderable routes, hotel ratings, and pre-computed links to transit stops. OSM knows the venue; DZT knows what's on, how long the trail is, and which stop is nearest. The graph has no GeoSPARQL, so radius is emulated — a bounding-box filter over-fetches, then a client-side Haversine trims to the true circle.

## Three things you can do

**1. Find tourism near a point** — distance-sorted GeoJSON (lon-first):

```bash
flowmcp call geo_nearby_dzt_geo '{"lat":48.1374,"lon":11.5755,"radiusMeters":2000,"limit":10}'
```

**2. Render real routes** — a trail is a multi-vertex polyline (a few hundred to well over a thousand points) that follows the path bend by bend; `geoTrails` returns GeoJSON `LineString` features you can draw directly, no map API in the loop:

```bash
flowmcp call geo_trails_geo '{"name":"Gartenparadies","limit":1}'
# → a LineString of 1,259 vertices, with _vertexCount and licence per feature
```

**3. Bridge tourism to public transit** — each entity links to its nearest stop with a pre-computed walking distance and the stop's **DHID** (the German open-data transit identifier); `enrich:transit` surfaces it, and the DHID is the join key into the rest of the FlowMCP transit world:

```bash
flowmcp call geo_nearby_dzt_geo '{"lat":48.1374,"lon":11.5755,"radiusMeters":2000,"enrich":"transit"}'
# → features gain _nearestTransitStop: { dhid, walkingDistance }
```

## What you can safely assume

We measured coverage per type instead of trusting the spec. The one universal guarantee is `name`. The geo anchor is type-specific — POIs, lodging, food and trails carry `schema:geo`, but an **Event anchors on `schema:location`, not `geo`** (it has no `geo` at all). Everything else is nullable; `image` especially is present for only a minority of entities. Assume `name`; null-check the rest.

## Licences — one graph, many licences, read them per object

"Open data" here does **not** mean one licence. Every object carries its **own** Creative Commons licence in `schema:license`, and they are not equivalent — the difference decides what you may legally do:

| Licence | You may use it | Conditions |
|---|---|---|
| **CC0** | freely, including commercially | none — effectively public domain |
| **CC BY** | freely, including commercially | **attribute** the source |
| **CC BY-SA** | freely, including commercially | attribute **and** share any derivative under the *same* licence (share-alike) |
| **…-NC** variants | **non-commercial only** | a commercial product may not use the object |
| **…-ND** variants | as-is only | **no modifications / derivatives** allowed |

This matters because a single radius result can mix a CC0 trail with an attribution-only POI and a more restrictive object — there is no blanket "it's open data, so anything goes." Official DZT guidance treats only CC0 / CC BY / CC BY-SA as true open data and discourages the `-ND` variants, but what is actually attached is decided **per object**. That is exactly why the toolkit attaches the per-object `schema:license` to **every** feature (and images, which are CDN-hosted and attribution-bound): so you can honour the precise terms downstream instead of guessing.

## Scope

This is a discovery, rendering and bridging tool — not a booking engine and not routing. Prices exist only as free text in event descriptions; "ratings" are hotel star classifications, not crowd reviews. The point of the experiment is narrow and specific: make the DZT graph **combinable** with the rest of German open data, with its licences carried through honestly so you always know what you are allowed to do.
