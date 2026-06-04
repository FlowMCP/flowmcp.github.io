---
title: Use Cases
description: Two scenarios that show FlowMCP + AI in action — how scattered data becomes one answer.
---
<!-- PAGEFIND-META-START -->
<span style="display:none" data-pagefind-meta="section">About</span>
<!-- PAGEFIND-META-END -->

Two scenarios that show FlowMCP + AI in action — not how to build an agent, but how FlowMCP turns scattered data sources into one usable answer. Both cases assume an AI agent (Claude, GPT, or similar) connected to a research tool, planning software, or CLI workflow, with FlowMCP-CLI running as the data-access layer.

---

## Use Case 1: Deep Research

### Setup

A research workflow — a custom pipeline, an internal dashboard, or a Notion / Obsidian workspace — has an AI agent attached. The agent's job is to pull together data from many sources to scope or answer a research question. FlowMCP-CLI runs alongside as the agent's tool for finding and calling normalized data sources.

### The Prompt

> We are planning an open-data project on air quality in German inner cities. Find data sources for fine-dust measurement stations, the open-data portals of Berlin, Munich, and Hamburg, weather stations for correlation, and give me a list with provider, license, sample endpoint, and update frequency.

### What FlowMCP Does

1. **Search the catalog** — The agent calls `flowmcp search` with tags like `airquality`, `opendata`, `berlin`, `weather`. FlowMCP returns matching schemas across many providers with provider name, license, and short description.
2. **Sample each schema** — For promising hits, the agent runs a sample call (`flowmcp call <schema> <route>`). FlowMCP holds the API keys, signs the request, and returns the normalized response. The agent sees the data shape without seeing credentials.
3. **Combine and summarize** — The agent merges results from federal, city, and weather sources, deduplicates overlapping stations, and produces a table the user can act on.

### Fixed Data Sources, One Answer

The agent draws on a fixed set of curated data sources — federal, city, and weather feeds that were normalized once and are now reused on every request. Because those sources share a consistent shape and a single auth path, the agent merges them into one consolidated answer instead of reading a separate API documentation for each one. The work of understanding each source happens once, in the schema, and every agent benefits from it afterwards.

> Instead of feeding the AI hundreds of tokens of API docs per request, it searches a normalized catalog. One schema investment, any number of agents.

### Next steps

- [CLI Setup →](/quickstart/quickstart/) — first call in under 5 minutes

---

## Use Case 2: Mobility — Catching the Connection

### Setup

The GTFS pilot is real and documented (see [GTFS Pilot Guide](/guides/gtfs-pilot/)). FlowMCP v4.1 ships an add-on concept: external toolkits like `geo-gtfs-toolkit` extend the CLI with local SQLite databases for static schedules. The combination — static GTFS lookup plus live REST API for delays — is what makes this case work as a single CLI call instead of a juggling act between two agents.

### The Prompt

> I'm at Berlin Hbf, heading to Munich. My ICE at 8:05 is 12 minutes late. Do I still catch the connecting IC in Nuremberg at 12:33? If not, what's the next option?

### What FlowMCP Does

1. **GTFS-SQLite lookup** (via `geo-gtfs-toolkit` add-on, local DB) — Static schedule for ICE 8:05 → connecting IC 12:33, scheduled transfer time 9 min, platform layout in Nuremberg.
2. **Live delay query** (Deutsche Bahn REST API via FlowMCP schema) — Current arrival forecast in Nuremberg 12:29 (was 12:17), so transfer time is now 4 min — critical.
3. **Alternative search** (GTFS-SQLite + REST combined) — Next IC 13:33 as fallback, arriving Munich 14:55.
4. **AI answer** — "IC 12:33 with only 4 min transfer is not reliable. Backup: IC 13:33, arriving Munich 14:55 instead of 13:13."

**Local SQLite for static lookup + Live API through FlowMCP — one CLI call, one answer.** Without FlowMCP, the agent would have to orchestrate the static GTFS query and the live REST API separately, parse different formats, and merge them by hand.

### Next steps

- [GTFS Pilot Guide →](/guides/gtfs-pilot/) — the full mobility add-on story
- [CLI Setup →](/quickstart/quickstart/) — first call in under 5 minutes
