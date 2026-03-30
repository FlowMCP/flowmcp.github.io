---
title: Overview
description: "FlowMCP schemas define how data sources become MCP-compatible tools — one .mjs file per provider"
---

A schema is a single `.mjs` file that wraps a data source for AI agents. Each schema declares its tools, resources, prompts, and skills in a static `main` export. An optional `handlers` export adds response transformation.

FlowMCP v3.0.0 supports four primitives:

:::note[Tools]
REST API endpoints. Map parameters to URLs, inject authentication, validate inputs. The core primitive — every schema has at least one tool. See [Tools](/docs/schemas/tools/).
:::

:::note[Resources]
Local SQLite databases. Fast, deterministic queries for bulk data like company registers, transit schedules, or sanctions lists. See [Resources](/docs/schemas/resources/).
:::

:::note[Prompts]
Explanatory texts that teach AI agents how a provider's tools work together — pagination patterns, error codes, data interpretation. See [Prompts](/docs/schemas/prompts/).
:::

:::note[Skills]
Multi-step workflow instructions. Reusable pipelines that compose tools and resources into higher-level operations. See [Skills](/docs/schemas/skills/).
:::

## Schema Structure

Every schema exports two things:

| Export | Required | Purpose |
|--------|----------|---------|
| `main` | Yes | Declarative configuration — tools, resources, prompts, skills. JSON-serializable and hashable. |
| `handlers` | No | Response transformation — pre/post processing for API responses. |

:::tip
Most schemas only need `main`. Add `handlers` when API responses need transformation before reaching the AI agent.
:::
