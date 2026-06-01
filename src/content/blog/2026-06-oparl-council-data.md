---
title: "OParl — One Schema for Germany's Council Information Systems"
description: "How a single vendor-agnostic FlowMCP schema opens read access to German municipal council data — meetings, papers, people — across more than a hundred council systems."
date: 2026-06-01
author: "FlowMCP Team"
tags: ["data-formats", "oparl", "open-government", "open-data"]
lang: en
---

> 2026-06-01 · FlowMCP Team · #data-formats #oparl #open-government

German municipalities publish an enormous amount of their democratic work online: council meetings, agendas, motions, the people who sit on committees. The data is public — but it lives behind dozens of different council information systems (RIS), each from a different vendor, each with its own URL layout. **OParl** is the open standard that unifies them, and FlowMCP now speaks it with a single schema.

## What is OParl?

OParl is an open standard for **anonymous, read-only access to German council information systems**. It defines JSON-based REST APIs — no login, no sessions — for the recurring objects of municipal democracy: bodies, meetings, agenda items, papers (motions and documents), persons, and organizations (committees and parliamentary groups). Two versions are in the field today: OParl 1.1 (current) and OParl 1.0.

The catch is that OParl standardizes the *data shape*, not the *URL layout*. Different vendors expose the same objects under different paths. A tool that wants to read "the latest meetings of council X" has to know which vendor family X runs on.

## What the FlowMCP `oparl` schema does

FlowMCP hides that vendor split behind one schema. You name a council; the handler resolves the vendor family from the endpoint's URL pattern and routes the request to the right paths. Three pieces work together:

| Component | Role |
|-----------|------|
| **`oparl-registry`** | Discovery layer. `listEndpoints` returns all known German OParl councils; `getMetaData` returns a council's OParl version, vendor family, available object types, and license. The registry is preloaded daily (`preload { ttl: 86400 }`). |
| **`oparl`** | Access layer. Eight core tools cover the standard objects (see below). |
| **`oparl-select`** (skill) | UI helper. It uses `prefill` against `listEndpoints` so the council picker always reflects the live registry — never a stale hardcoded list. |

The eight access tools:

| Tool | Returns |
|------|---------|
| `getBodies` | The bodies (Körperschaften) of a council |
| `getMeetings` | Meetings of a body (paginated) |
| `getMeeting` | A single meeting with its agenda |
| `getPapers` | Papers / motions (paginated) |
| `getPaper` | A single paper |
| `getPersons` | Council members (paginated) |
| `getOrganizations` | Committees and groups (paginated) |
| `getAgendaItem` | A single agenda item (OParl 1.1) |

The vendor family — SD.NET RIM, ALLRIS, gremien.info — is detected automatically from the URL pattern. For the caller it is invisible: you ask for a council by name, and the schema does the rest.

## Coverage

The registry currently lists **more than 120 German council systems**, and because it is fetched from `dev.oparl.org/api/endpoints` daily, that number grows on its own as more municipalities come online. Berlin alone appears with several boroughs listed individually. Coverage is as wide as the public registry — from large city councils down to small municipalities of a few thousand inhabitants.

## What you can ask

- **"Show me the latest meetings of council X."** — `getMeetings` with reverse pagination.
- **"Who sits on this council? Who chairs which group?"** — `getPersons`, `getOrganizations`.
- **"What was decided on this motion?"** — `getPaper`, following the linked consultations and meetings.
- **"What changed since yesterday?"** — the `modified_since` parameter, for crawlers and sync jobs.

### Honest limits

OParl is a deliberately simple standard, and the schema does not paper over its gaps. The API has no full-text title search and no date sorting, and `created_since` filters by *record* date, not the *meeting* date. "All meetings in 2024" is therefore a two-step pattern (page through, filter client-side), not a single query. We map what the standard actually supports — nothing hallucinated on top.

## Why this matters

Council data is the rawest form of open government: who proposed what, who voted, when. Until now, working with it across municipalities meant writing a separate adapter per vendor. With OParl as a FlowMCP data class, an AI assistant can read any registered council through the same eight tools — and the implementation stays intentionally minimal: eight tools, a daily registry, no database. Exactly what the standard needs, nothing more.

---

> 📖 Read also:
> - *[SQLite — One Store for Local, Large, and Private Data](/blog/2026-06-local-data-sqlite-preload-shared-lists/)* — the data-anchoring mechanisms behind schemas like this one.
> - *[FlowMCP v4.1 — GTFS as the First Data Class with Its Own Add-on](/blog/2026-05-flowmcp-v41-gtfs-add-on/)* — another open-data class, the heavy-data counterpart to OParl's light API.
