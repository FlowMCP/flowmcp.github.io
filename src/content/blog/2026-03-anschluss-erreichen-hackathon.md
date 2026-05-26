---
title: "Making the Connection — How FlowMCP Became a Mobility Framework"
description: "Story from DB InfraGO's 'Anschluss erreichen' hackathon, where FlowMCP's main contributor reached 3rd place with a multi-agent mobility assistant."
date: 2026-03-23
author: "FlowMCP Team"
tags: ["hackathon", "mobility", "deutsche-bahn", "berlin"]
lang: en
---

## What Was "Anschluss erreichen"?

On **20 and 21 March 2026** (Friday 10:00 to Saturday 18:00), **DB InfraGO**, **DB mindbox**, the **Infostelle Radparken** and **Velokonzept** hosted a 2-day hackathon on connecting mobility at **Berlin Hauptbahnhof** (Washingtonplatz 2, 10557 Berlin). Three challenges were on offer:

| Challenge | Topic | Core Question |
|-----------|-------|---------------|
| **Mobility Data** | Data usage | How can mobility data improve journeys along the first/last mile? |
| **Connecting Mobility** | Intermodality | How can bikes, scooters, sharing and pedestrian traffic improve station accessibility? |
| **Bike Parking** | Secure parking | How can access to secure bike parking at stations be simplified? |

The test areas were Berlin Hbf, S+U Jannowitzbruecke, Potsdam (4 stations) and Bad Belzig. Our team — **Open Data AI** — entered the **Mobility Data challenge**, and FlowMCP's main contributor **reached 3rd place**.

The full project is open source: **[github.com/a6b8/hackathon-anschluss-erreichen](https://github.com/a6b8/hackathon-anschluss-erreichen)**.

## What We Connected

The task: from a heterogeneous set of German mobility APIs, build an assistant that answers connection questions — "How do I get from Berlin Hbf to Bad Belzig with a connecting bike?", "What sharing options are there at the destination?".

We wired up **9 public APIs** (no auth keys needed) as FlowMCP schemas, exposing **27 tools** in total:

- **transport.rest** (DB and VBB schedules), **Overpass / OpenStreetMap** (bike parking & amenities), **Nominatim** (geocoding), **BrightSky** (DWD weather), **nextbike** (bike sharing), **infraVelo** (Berlin cycling infrastructure), **FlixBus** (long-distance routes & pricing), and **V-Locker** (17 secure bike-storage boxes) — the last one a schema we wrote ourselves for the hackathon.

Back then this ran on **FlowMCP v3.0.0**, served through the **mcp-agent-server** over streamable HTTP, on Node.js 22 + Express, with a small Leaflet.js + marked.js frontend.

## The Architecture: an Agent Server Before v4

The project ran on the **[MCP Agent Server](https://github.com/FlowMCP/mcp-agent-server)** — an idea that *predated* the FlowMCP v4 release and was, at the time, highly experimental. The hackathon was the stress test; afterwards the agent-server concept was baked into v4 proper and the learnings carried into the spec.

We deliberately chose **Level&nbsp;3 — Orchestration** from the three usage levels the docs describe under [Agents](/concepts/primitives/#agents) (Level 1: tools only · Level 2: a single sub-agent · Level 3: an orchestrator coordinating several). The shape:

- A **main "communicator" agent** (Claude Sonnet) routed each request to the right specialist.
- **Four expert sub-agents** (Claude Haiku) did the actual work: **Station Survival** (toilets, food, hotels), **Ticket Purchasing** (DB vs. FlixBus price comparison), **Bike Parking** (parking & infrastructure), and **Connection Navigator** (feasibility during delays).
- The communicator held **follow-up questions** with the user through a purpose-built interface — the idea being to run these clarifications via **Elicitation**.

That orchestration-with-clarifications pattern is exactly the gap v4 later closed.

## What We Learned

Mobility data is structured by **time**. GTFS feeds, service calendars, realtime endpoints — without deterministic time-window queries, an LLM gets lost in questions like "which of the three trains is tomorrow?". And routing through several specialist agents only works smoothly if the orchestrator can ask the user a clarifying question and compose structured results.

Both observations became **v4**: **skills** for complex, multi-step queries, first-class **follow-up questions**, and **agents + selections** as proper primitives. The hackathon came first as a user test; only after it did we feel confident enough to ship v4.

A second friction was cost: mobility data over REST is expensive for time-window queries (every question = one API call). That friction gave rise to **v4.1**, where GTFS feeds are converted to a local SQLite database once, after which thousands of queries run without any further network hit. More in the follow-up post.

## Result

We built a working, multi-agent mobility assistant that talks to nine German mobility APIs through a single FlowMCP schema library and answers connection questions along the first and last mile. The run at the main station confirmed the core hypothesis: a curated schema library beats live integration under time pressure — and it was good for **3rd place**.

| Insight | Consequence |
|---------|-------------|
| Schemas as a reserve beat live integration | confirms FlowMCP's core hypothesis |
| Orchestration needs clarifying questions | became follow-up questions + agents (v4) |
| Mobility needs its own primitives | led to the v4.1 GTFS add-on |
| Determinism + LLM composition needs structure | became skills + selections (v4) |

## A Prize, Two Months Later

On **19 May 2026**, at the "Anschluss erreichen" conference (Design Offices Berlin Humboldthafen, ~350 attendees), the prize was awarded — handed over by the **Federal Minister for Transport, Patrick Schnieder**. We were there, and we picked up a prize from the minister. ([Conference page](https://radparken.info/veranstaltung/anschluss-erreichen-2026/))

## Sources

- Project repository: [a6b8/hackathon-anschluss-erreichen](https://github.com/a6b8/hackathon-anschluss-erreichen)
- Organizers: BMV, DB InfraGO, DB mindbox (with Infostelle Radparken and Velokonzept)
- Location: Berlin Hauptbahnhof, Washingtonplatz 2, 10557 Berlin (20–21 March 2026)

---

> 📖 Read also:
> - *[FlowMCP v4 — Skills, Selections, Pipes](/blog/2026-05-flowmcp-v4-skills-selections-pipes/)*
> - *[FlowMCP v4.1 — GTFS as a First-Class Data Type with Its Own Add-on](/blog/2026-05-flowmcp-v41-gtfs-add-on/)*
