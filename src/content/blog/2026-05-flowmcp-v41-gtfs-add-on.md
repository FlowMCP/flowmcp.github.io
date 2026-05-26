---
title: "FlowMCP v4.1 — GTFS as the First Data Class with Its Own Add-on"
description: "How the gtfs-sqlite-toolkit turns GTFS feeds into auditable SQLite resources and makes FlowMCP the first real mobility engine."
date: 2026-05-25
author: "FlowMCP Team"
tags: ["release", "v41", "gtfs", "add-on", "mobility", "open-data"]
lang: en
---

> ℹ️ **Note:** The pilot measurements (conversion times, latencies, output snippets) come from the ongoing GTFS pilot and will be added once the measurement series are complete.

GTFS feeds are the lingua franca of public transit — and at the same time a classic example of the data-format problem: between 30 and 60 CSV files in a ZIP, several hundred megabytes for the DELFI feed, several gigabytes once unpacked. An LLM cannot hold this file in context. A REST API around it helps, but who audits it? Who maintains it?

With **v4.1**, FlowMCP solves this differently. GTFS becomes the first data class with its own **add-on** — `gtfs-sqlite-toolkit`. The toolkit converts feeds into **sealed SQLite databases** and tells a FlowMCP CLI, via a capability matrix, which queries are meaningfully possible. Schemas then only reference the DB — no maintenance of CSV parsers, no API hosting costs.

## What is GTFS?

GTFS — General Transit Feed Specification — is an open standard for schedule data, originally developed by Google for transit searches and today the worldwide de facto standard for public transit data. A GTFS feed contains roughly 30 CSV files: stops, routes, trips, stop-times, calendar, transfers, ...

We look at two German feeds:

| Feed | Source | Size | License | Update |
|------|--------|------|---------|--------|
| DELFI (Germany-wide) | `download.gtfs.de/germany/free/latest.zip` | ~245 MB | CC-BY 4.0 (DELFI e.V.) | daily |
| VBB (Berlin/Brandenburg) | `vbb.de/vbbgtfs` | ~83 MB | CC-BY 4.0 (VBB GmbH) | Wed+Fri |

Both endpoints respond with HTTP 200 without an auth header. The license requires attribution in every response that uses this data.

## What is `gtfs-sqlite-toolkit`?

The toolkit is the **first FlowMCP add-on**. It converts a GTFS feed (CSV in ZIP) into a SQLite database with three properties:

| Property | Meaning |
|----------|---------|
| **Quality seal** | A `meta` table in the DB contains the hash, date, spec revision, and provider — the DB is uniquely referenceable. |
| **Capability matrix** | 12 booleans that map which file the feed ships with (`stops`, `routes`, `transfers`, `shapes`, ...). |
| **Capability-driven auto-injection** | The FlowMCP CLI reads the capability matrix and injects only the tools that the feed can actually answer. |

A schema then looks like this:

```javascript
export const schema = {
    namespace: 'gtfsde',
    name: 'gtfsde-transit-v2',
    version: '2.0.0',
    main: {
        resources: [
            {
                source:       'sqlite-gtfs',
                mode:         'file-based',
                path:         '${FLOWMCP_RESOURCES}/gtfs-de.db',
                addon:        'gtfs-sqlite-toolkit',
                addonVersion: '>=0.1.0',
                addonSource:  'github:FlowMCP/gtfs-sqlite-toolkit'
            }
        ],
        tools: [
            // Default tools are injected automatically.
        ]
    }
}
```

The schema is small. The engine stays with FlowMCP. The database content stays with the user's own DB. There are no API keys, because there is no API — the data is free.

## Pilot Results: DELFI + VBB

We put both feeds into the pilot.

### Conversion

Expected orders of magnitude from the pilot: DELFI starts at around 245 MB ZIP and grows after conversion to roughly 800 MB to 2 GB SQLite, VBB from around 83 MB ZIP to roughly 300 to 700 MB. We will add the exact conversion times and quality-seal statuses once the measurement series are complete.

### Performance

The latency measurement (P50/P95) for `searchStops`, `findRoute`, and `nextDeparture` is running in the pilot. SQLite index hits on the converted databases allow thousands of queries without any further network hit — we will provide the concrete numbers later.

### Five Use Cases

#### 1. "Next S-Bahn from Berlin Hbf to Spandau"

```bash
flowmcp call gtfsvbb.findRoute '{"origin":"Berlin Hbf","destination":"Spandau"}'
```

_Example output to follow once the pilot measurement series is complete._

#### 2. "Berlin Hbf → Hamburg Hbf, fastest"

```bash
flowmcp call gtfsde.findRoute '{"origin":"Berlin Hbf","destination":"Hamburg Hbf","criterion":"fastest"}'
```

_Example output to follow once the pilot measurement series is complete._

#### 3. "Bus lines Karlsruhe Sunday"

```bash
flowmcp call gtfsde.findRoutesByCalendar '{"city":"Karlsruhe","day":"sunday"}'
```

_Example output to follow once the pilot measurement series is complete._

#### 4. "Stations within a 10km radius of coordinate X"

```bash
flowmcp call gtfsde.searchStopsByGeo '{"lat":52.52,"lon":13.41,"radius_m":10000}'
```

_Example output to follow once the pilot measurement series is complete._

#### 5. "Connection to event Y in city Z" *(combinatorics)*

This use case chains **two schemas** together and is the killer proof for the FlowMCP vision: schemas are small, the engine is a single one, and the combinatorics happen on top.

```bash
# Step 1: search for the event
flowmcp call eventbrite.search '{"name":"Berlin Mobility Conference","date":"2026-06-15"}'
# → venue=Tempelhof, lat=52.473, lon=13.402

# Step 2: find nearby stops
flowmcp call overpass-osm.nearbyStops '{"lat":52.473,"lon":13.402,"radius_m":800}'
# → [Tempelhof, Platz der Luftbruecke, ...]

# Step 3: route there
flowmcp call gtfsvbb.findRoute '{"origin":"Berlin Hbf","destination":"Tempelhof","date":"2026-06-15T18:00"}'
# → S-Bahn S41 → Bus M46
```

_Executed outputs and latencies to follow once the pilot measurement series is complete._

## The Add-on Concept in General

GTFS is the first add-on, but not the only one. The concept is generic:

| Step | What happens |
|------|--------------|
| 1. Add-on writes a SQLite DB with a `meta` table | hash, spec revision, provider, capabilities |
| 2. Schema references `source: 'sqlite-<type>'` + `addon: '<repo>'` + `addonSource: 'github:org/repo'` | schema stays thin |
| 3. FlowMCP CLI reads capabilities | injects only matching tools |
| 4. AI calls tools | DB operations are deterministic, fast (index hits) |

Capability matrix examples from GTFS:

- `hasStops` (file `stops.txt` present) → `searchStops` is injected
- `hasShapes` (file `shapes.txt` present) → `getRouteShape` is injected
- `hasTransfers` → `findTransfer` is injected
- `hasFareRules` → `getFare` is injected

Schemas that receive a feed missing `transfers.txt` simply do not see `findTransfer` in the tool set. No 404, no error message, no hallucinated answer.

## Open Data and the Law

Both feeds used are licensed under **CC-BY 4.0**. This requires attribution in every response passed on. FlowMCP applies this in the output structure:

```json
{
    "data": { "route_id": "ICE793", "dep_time": "09:34" },
    "licenseAttribution": "Daten: DELFI e.V. / VBB GmbH, CC-BY 4.0",
    "source": "gtfs-de | gtfs-vbb"
}
```

Why is this data free? The German **E-Government Act §12a** (introduced in 2017, amended in 2021) obliges federal and state authorities to make their data holdings available as open data by default. DELFI, as the federal states' special-purpose association for mobility data, and VBB, as a public transit association, are both subject to these requirements. CC-BY 4.0 is the chosen license form.

## What's Next

| Next step | Status |
|-----------|--------|
| Realtime (GTFS-RT) | separate endpoint, not covered in the pilot — follow-up iteration |
| Further add-ons (OFAC, OSM, Wikidata) | under discussion |
| Schema validator for add-on capabilities | follow-up memo |



---

> 📖 Read also:
> - *[FlowMCP v4 — Skills, Selections, Pipes](/blog/2026-05-flowmcp-v4-skills-selections-pipes/)* — the pipes concept chains these GTFS tools elegantly.
> - *Catching the Connection — How FlowMCP Became a Mobility Framework* — hackathon validation of the mobility use cases.
