---
title: "FlowMCP v4.3 — Two Tracks: Development and Grading-Monitoring"
description: "FlowMCP Spec v4.3 splits the schema lifecycle into two tracks and aligns grading to the breaking Grading-Spec 3.0.0, where a failed pretest now emits a blocked record instead of aborting — alongside a leaner CLI, a single grading path, and four geodata add-ons."
date: 2026-06-02
author: "FlowMCP Team"
tags: ["release", "v43", "grading", "lifecycle", "spec"]
lang: en
---

> 2026-06-02 · FlowMCP Team · #release #v43 #grading

A lifecycle works best when each part is allowed to do its own job. Until now, FlowMCP treated *building* a schema and *grading* it as a single sequential gate: validate, then grade, in one straight line. With **v4.3** that line is cut in two. The substance of this release is the **two-track lifecycle split** and the alignment to a new, breaking **Grading-Spec 3.0.0**. The schema *format* itself does not change.

## Why split the lifecycle

The development lifecycle and the grading-monitoring track answer different questions. One asks: *is this schema correct enough to ship?* The other asks: *what is the state of every schema we are watching, including the ones that are still broken?* Forcing both through the same gate meant a schema that failed validation simply produced nothing — no record, no signal, no place to track it. The information that mattered most for monitoring was the information that got thrown away.

v4.3 separates the two so each can be honest. The **development lifecycle** — the six stages from research to production — stays in the Schemas-Spec. **Monitoring, issue tracking, and the grade rollup** move out into the Grading-Spec, in a new `§26 monitoring-track`.

## Emit-on-failure: a failed pretest no longer aborts

The most concrete change sits in the grading contract. Grading delegation now targets **`gradingSpec/3.0.0`** (up from `2.0.0`), and the behaviour of the deterministic pretest flips:

- **Before:** a schema that had not cleared validation caused grading to **hard-abort**. No record came out.
- **Now:** the deterministic pretest emits a **`blocked` node** with `reason: validation-failed` and continues. The schema that failed validation still produces a monitoring record — it is simply marked blocked.

This is why the grading bump is **MAJOR**: the contract changed in a way that is not backward-compatible. The legacy `grading/2.0.0/` directory is retained, unchanged, for anything still pinned to it.

### Emit-on-failure in practice

```bash
# A schema that has not cleared validation still produces a monitoring record:
flowmcp grading deterministic myprovider/broken-schema
# → emits a `blocked` node (reason: validation-failed) instead of aborting
```

Before v4.3 the same run would have hard-aborted with nothing to track. Now the broken schema is visible in the monitoring track as a `blocked` record — without ever advancing toward production.

## The development gate is unchanged

This is the part worth saying plainly: **emit-on-failure does not loosen the bar for shipping.** A `blocked` monitoring record does **not** advance a schema toward production. The development gate stays exactly as it was — `flowmcp validate` must return **0 errors** before a schema reaches `stage:production`. The relaxation applies only to the monitoring track, where a record may now exist in a `blocked` state for a schema that has not yet cleared `stage:validation`. Building still requires a clean validation; only the *visibility* of failures improved.

## A new invariant: VAL019

v4.3 also adds one new validation rule, **VAL019** — a folder↔namespace invariant. A `providers/<dir>/` directory name **MUST** equal the `main.namespace` of every schema it contains. It sits alongside the existing `CAT002` / `AGT001` / `SKL003` checks and ships with an unparseable-folder fallback and a rename-on-parse lifecycle. Small rule, real payoff: the folder layout can no longer drift away from what the schemas inside declare.

## Beyond the spec — the v4.3 ecosystem

The spec split landed alongside a round of ecosystem changes that make the two-track idea practical day to day:

- **A leaner CLI (Memo 099).** The activation step is gone — the old `add` / `import` / `group` commands no longer exist. Every schema in a configured `schemaFolders[]` directory is immediately callable, so the workflow is just `flowmcp search <query>` (or `flowmcp list`) → `flowmcp call <tool> '{...}'`. A tool whose API key is missing shows up as `[disabled: missing KEY]` rather than failing silently.
- **One grading path (Memo 102).** Grading collapsed to a single path: `flowmcp grading deterministic <id>` runs the structural validate plus the live data pretest (HTTP 200 **and** non-empty data), and `flowmcp grading non-deterministic <ns>` drives the LLM scoring. There is no separate import step — schemas are read live from `schemaFolders[]`, and the workbench island is purely the output store.
- **Four geodata add-ons.** v4.3-era FlowMCP ships four external toolkit add-ons, each its own repository, none baked into `flowmcp-core`:
  - `geo-gtfs-toolkit` — GTFS transit feeds as a sealed local SQLite database.
  - `geo-geojson-toolkit` and `geo-csv-tsv-toolkit` — fetch a complete GeoJSON or CSV/TSV file by URL, validate it on load, and query it from memory (no SQLite file, no quality seal).
  - `geo-overpass-toolkit` — run live Overpass (OpenStreetMap) queries behind a cached HTTP source.

  Each add-on names its package `geo-*-toolkit`; the GitHub repositories keep their original names (for example `github:FlowMCP/geojson-sqlite-toolkit`).

## Where to read it

The two-track lifecycle is documented in the Schemas-Spec at **`21-schema-lifecycle.md`**, and the monitoring track that now owns the grade rollup lives in the **[Grading-Spec v3.0.0](/grading/overview/)**, `§26`. Two tracks, two specs — each free to do its own job.
