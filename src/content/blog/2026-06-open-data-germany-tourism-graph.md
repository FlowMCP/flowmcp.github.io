---
title: "Open Data Germany × FlowMCP — German Tourism as a Live Geo Source"
description: "How the geo-dzt-toolkit turns Germany's national tourism knowledge graph into a live FlowMCP geo source — radius search, renderable multi-vertex trail routes, and a DHID bridge to public transit — with an honest contract for what you can actually assume."
date: 2026-06-09
author: "FlowMCP Team"
tags: ["geo", "dzt", "tourism", "germany", "add-on", "live-query", "open-data"]
lang: en
---

> 2026-06-09 · FlowMCP Team · #geo #dzt #add-on #live-query

> **Another Live-Query add-on.** Like [`geo-overpass-toolkit`](https://github.com/FlowMCP/geo-overpass-toolkit), the new **[`geo-dzt-toolkit`](https://github.com/FlowMCP/geo-dzt-toolkit)** answers queries with one HTTP request per call against a live source — here the **DZT Knowledge Graph** (Deutsche Zentrale für Tourismus / "Open Data Germany"), a country-scale tourism graph of roughly half a million entities: events, points of interest, trails, lodging and food.

OpenStreetMap knows where the restaurants and bus stops are. It does **not** know what's playing tonight, which trail is a circular loop, or what a hotel costs. Germany's national tourism graph does — it is modelled in schema.org and the ODTA tourism vocabulary, and it is open. This add-on wires it into the FlowMCP `geo` provider.

## The shape of the source

The DZT graph has **no GeoSPARQL**, so there is no native "find things within N metres" primitive — and an unbounded scan over its un-indexed coordinates just times out (HTTP 524). The toolkit emulates radius the same way the SQLite add-ons do: a lat/lon **bounding-box filter over-fetches**, then a client-side **Haversine** pass trims the result to the true circle. Everything is read-only, returned as RFC 7946 GeoJSON (longitude first), and **every feature carries its own licence**.

Because the tools are keyed (a free Open-Data-Germany key), they live in their own schema file so the keyless `geo` tools stay usable without any key — only the DZT tools disable when the key is absent.

## Three things you can do

**1. Find tourism near a point.** A coordinate and a radius return a distance-sorted FeatureCollection:

```bash
flowmcp call geo_nearby_dzt_geo '{"lat":48.1374,"lon":11.5755,"radiusMeters":2000,"limit":10}'
```

**2. Render real routes.** A trail is not two points and a straight line. It is a multi-vertex polyline — a few hundred to well over a thousand coordinates — that follows the path bend by bend. `geoTrails` returns them as GeoJSON `LineString` features you can draw directly:

```bash
flowmcp call geo_trails_geo '{"name":"Gartenparadies","limit":1}'
# → a LineString of 1,259 vertices, lon-first, with _vertexCount and licence
```

The geometry lives in `schema:geo → schema:line` as one whitespace-separated string of `lon,lat` triples; parsing is a `split` and a `map`. Almost every trail in the graph carries it, so "render this route on a map" is a local, dependency-free operation — no map API in the loop.

**3. Bridge tourism to public transit.** Inside the graph, a point of interest is linked to its nearest transit stop through a reified link object that already carries a **pre-computed walking distance** and the stop's **DHID** — the German open-data transit identifier. Ask for it with `enrich`:

```bash
flowmcp call geo_nearby_dzt_geo '{"lat":48.1374,"lon":11.5755,"radiusMeters":2000,"enrich":"transit"}'
# → features gain _nearestTransitStop: { dhid, walkingDistance }
```

That DHID is the join key into the wider FlowMCP transit world (the zHV registry, the station resolver), so "attraction → nearest stop → onward journey" is one graph hop, not a fuzzy address match.

## What you can safely assume

Knowledge graphs are generous with optional fields and stingy with guarantees, so we measured coverage per type instead of trusting the spec. The result is a small, honest contract:

- The **one universal guarantee is `name`**. Build around it.
- The **geo anchor is type-specific**: points of interest, lodging, food and trails carry `schema:geo`; an **Event anchors on `schema:location`, not `geo`** (it has no `geo` at all). Handle both.
- Everything else is nullable. `image` is the most over-estimated field — present for only a minority of entities — and several fields the formal specification marks as *required* are empty in practice. Assume `name`; null-check the rest.

## Scope, honestly

This is a discovery and rendering tool, not a booking engine. Prices exist in the graph but only as free text inside an event description — there is no machine-readable price field. "Ratings" are hotel star classifications, not crowd reviews. Images are hosted on provider CDNs and usable **only with attribution**. The toolkit carries the per-object licence through on every feature so you can honour it downstream — and states these limits up front rather than papering over them.
