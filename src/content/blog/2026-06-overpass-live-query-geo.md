---
title: "OpenStreetMap Around a Point — The Overpass Live-Query Add-on"
description: "How the geo-overpass-toolkit turns the Overpass API into a safe, reusable geo source — curated multi-key categories, pre-built combined selections, and one union query per call so rate limits never bite."
date: 2026-06-03
author: "FlowMCP Team"
tags: ["data-formats", "geo", "overpass", "openstreetmap", "add-on", "live-query", "open-data"]
lang: en
---

> 2026-06-03 · FlowMCP Team · #geo #overpass #add-on #live-query

> **A third add-on category.** The earlier geo add-ons are either *in-memory-static* ([geojson](https://github.com/FlowMCP/geo-geojson-toolkit) / [csv-tsv](https://github.com/FlowMCP/geo-csv-tsv-toolkit)) or *sealed-SQLite* ([gtfs](https://github.com/FlowMCP/geo-gtfs-toolkit)). The new **`geo-overpass-toolkit`** is the first **Live-Query** add-on: one HTTP request per call against the public Overpass API, with a response cache.

The question this add-on answers is the most ordinary one in geo: *"where am I, and what is around me?"* OpenStreetMap already knows — it has the restaurants, the pharmacies, the bus stops, the playgrounds. The hard part was never the data; it was asking for it without getting hurt.

## The problem: Overpass is powerful and sharp

The Overpass API is the right tool to query live OSM, but it has three edges that cut beginners:

- **Tag chaos.** "Is there a pharmacy nearby?" is `amenity=pharmacy`. A drugstore (German *Drogerie*) is `shop=chemist` — a completely different tag. A *Späti* is `shop=convenience` or `shop=kiosk`. Ask with the wrong tag and you get nothing, with no error.
- **Rate limits.** Fire ten little queries for ten categories and you get ten slots plus cooldowns — and then HTTP 429. The number of *clauses* in a query is not the limit; the *result size* is.
- **Result-size truncation.** Ask for full geometry over a wide area and the server quietly trims your answer.

A naive wrapper hides these and fails unpredictably. This add-on does the opposite: it bakes the sharp edges into reusable, tested building blocks.

## One union query, not N requests

The core rule is **over-fetch beats under-fetch**: a single Overpass *union* query covering many tags costs **one** slot, whereas ten separate category queries cost ten slots and trip the rate limit. So both selectors collapse to exactly one request:

```
nearPoint({ lat, lon, radiusMeters, selection })       // one pre-built bundle
nearPoint({ lat, lon, radiusMeters, categories: [...] }) // your own bundle, still ONE query
```

The builder always emits `out tags center` (never `out geom`), keeps a radius ceiling, and sends a descriptive `User-Agent` (a generic one earns an HTTP 406). One slot, bounded result, attribution attached.

## An escalation ladder

You meet the data at whatever level you need, and step down only when you want more control:

1. **Selection** — a pre-built, combined template with the tag gotchas baked in (`public_transport`, `daily_shopping`, `food_drink`, `health`, `culture`).
2. **`categories[]`** — assemble your own bundle from a curated catalog of **238 categories across 8 groups**, multi-key and OR-matched, so *Drogerie ≠ Apotheke*, *Späti*, *Baumarkt* and *Döner* all resolve correctly.
3. **`discoverCategories`** — "what is actually here?" — one probe query returns categories and counts, no geometry.
4. **`runOverpassQL`** — the raw escape hatch for experts, with guards (`[out:json]` enforced, a filter/bbox/area required, `[timeout]`/`[maxsize]` auto-prepended, writes rejected).

## The same standard as every geo add-on

Every result is a normalized RFC-7946 **FeatureCollection** with `[lon, lat]` coordinates and the canonical anchor fields — `osm_id`, `name`, `category`, `_source`, `licence`, `_distanceMeters`. That is the exact shape the geojson, csv-tsv and gtfs add-ons emit, with the same method family (`nearPoint`, `inBoundingBox`, `byType`). One standard across all four means results are directly comparable and pipeable.

## Plugged into the geo entry point — opt-in, never default

The canonical `geo` provider can fan `geoNearby` out across local sources (GTFS, Overture) and, **only when you ask for it**, Overpass:

```
geoNearby({ lat, lon, radiusMeters, sources: "overpass", selection: "public_transport" })
```

Overpass is never a silent default: request it without a `selection` or `categories[]` and you get an explicit error, not a guess. The four operational blockers — rate-limit, cache, ODbL attribution, keyless access — live *inside* the add-on, so the geo provider never has to carry them.

## Scope: discovery, not navigation

This is a point-and-area discovery tool. There is **no routing and no topology** — that is deliberately out of scope. And one honest limit worth stating: **events are not in OpenStreetMap.** OSM has the venue; it does not have what's playing tonight. For that, a source like [kulturdaten.berlin](https://github.com/FlowMCP) is complementary.

OpenStreetMap has always known what's around you. The Overpass add-on just makes it safe to ask.
