---
title: "FlowMCP Grading v2 — A Versioned Standard for a Network of Gradings"
description: "FlowMCP now delegates schema grading to its own independently versioned standard, the Grading-Spec v2.0 — published as its own docs area so anyone can grade by the same rules."
date: 2026-05-31
author: "FlowMCP Team"
tags: ["release", "grading", "spec", "standard", "v2"]
featured: true
lang: en
---

A schema is only as useful as it is clear. FlowMCP has always graded schemas — but until now the rules for *how* a schema is scored and graded lived as an internal protocol. With this release, grading becomes a **published, versioned standard in its own right**: the **Grading-Spec v2.0**.

## Why this matters: a network of gradings

The point of a written, versioned grading standard is not the grade itself. It is **reproducibility across people**. When the rules — the eleven areas, the five-status model, the thresholds, the veto list — are public and versioned, a second person can grade a schema and arrive at a comparable result. Other maintainers and external contributors can grade by the *same* standard.

That is the groundwork for a **contributor network**: not a single team handing down grades, but an open standard that many people apply, producing a shared, comparable body of gradings. Grading stops being an internal tool and becomes something others can join.

## FlowMCP delegates — it does not absorb

The FlowMCP Schemas-Spec (now **v4.2**) remains the highest instance — it defines what a schema, a selection, and the primitives are. What is new in 4.2 is a clean **delegation**: FlowMCP hands the grading model to a separate, independently versioned standard and points to it. The two specs have separate version numbers but are connected — the Schemas-Spec owns the upstream scoring transport, the Grading-Spec owns the grading model on top of it.

## What's new

- **v2, honestly numbered.** The earlier `1.0`/`1.1` line was a short-lived experiment. The current break is real, so it is released as **2.0.0** rather than carrying a misleading minor number.
- **Eleven grading areas** with a five-status node model and a derived rollup.
- **Delegation is the substance of the 4.2 bump** — FlowMCP delegates grading to its own versioned sub-standard.
- **Its own docs area** — Grading is navigation point 5, with its own version badge (v2.0), separate from the Specification badge.
- **CLI grading is experimental** — usable today via the `grading` command area, but its surface may still change.
- **Peripheral modules follow** — the grading reference implementation moves to a code-only repository; the single source of truth for the standard is the spec.

## Where to read it

The Grading standard lives at **[/grading/](/grading/overview/)** — its own area in the docs, versioned independently of the Schemas-Spec. The reference implementation is the `flowmcp-grading` repository (code only); the standard itself is the spec.

This is a first step. The standard is written down, versioned, and published — so the next gradings, wherever they come from, can speak the same language.
