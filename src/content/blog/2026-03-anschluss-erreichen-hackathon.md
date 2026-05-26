---
title: "Making the Connection — How FlowMCP Became a Mobility Framework"
description: "Story from DB InfraGO's 'Anschluss erreichen' hackathon, with FlowMCP as the technical foundation for three mobility challenges."
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

The test areas were Berlin Hbf, S+U Jannowitzbruecke, Potsdam (4 stations) and Bad Belzig.

## How We Used FlowMCP

Our contribution addressed the **Mobility Data challenge**. The task: build an agent from a heterogeneous set of German mobility APIs that answers connection questions — "How do I get from Berlin Hbf to Bad Belzig with a connecting bike?", "What sharing options are there at the destination station?".

Over several preparation sprints we integrated the German mobility providers as REST API schemas into FlowMCP — DELFI, VBB, sharing APIs, bike-parking datasets. Back then still without the GTFS add-on: every schedule query went through as a REST call.

### What Worked Well

| Aspect | Effect |
|--------|--------|
| **Schema library as a reserve** | Instead of reading 8 different API docs on the day, we had a `flowmcp search mobility` list with ready-made integrations. |
| **AI key separation** | The demo ran on a machine with several pairs of eyes watching. API keys stayed in FlowMCP, never in the LLM conversation. |
| **Mock mode** | With flaky WiFi at the main station, mock mode helped us test the presentation independently of the network. |

### What We Learned

Mobility data is structured by **time**. GTFS feeds, service calendars, realtime endpoints — without deterministic time-window queries, the LLM gets lost in questions like "which of the three trains is tomorrow?". This is where v4's later answer showed up: **skills with prefill** and **pipes with output schema**.

Mobility data over REST calls works, but it is expensive for time-window queries (every question = one API call). This friction gave rise to v4.1: GTFS feeds are converted to SQLite locally once, after which thousands of queries run without any further network hit. More in the follow-up post.

## Result

We built a working mobility-data agent that talks to several German mobility APIs through a single FlowMCP schema library and answers connection questions along the first and last mile. The run at the main station confirmed the core hypothesis: a curated schema library beats live integration under time pressure.

## What We Take Away

| Insight | Consequence |
|---------|-------------|
| Schemas as a reserve beat live integration | confirms FlowMCP's core hypothesis |
| Mock mode is not "nice to have" | became mandatory in hackathon contexts |
| Mobility needs its own primitives | led to v4.1 GTFS add-on |
| Determinism + LLM composition needs structure | became skills + pipes (v4) |

## Sources

- Organizers: DB InfraGO, DB mindbox, Infostelle Radparken, Velokonzept
- Location: Berlin Hauptbahnhof, Washingtonplatz 2, 10557 Berlin (20–21 March 2026)

---

> 📖 Read also:
> - *[FlowMCP v4 — Skills, Selections, Pipes](/blog/2026-05-flowmcp-v4-skills-selections-pipes/)*
> - *[FlowMCP v4.1 — GTFS as a First-Class Data Type with Its Own Add-on](/blog/2026-05-flowmcp-v41-gtfs-add-on/)*
