---
title: FAQ
description: Frequently asked questions about FlowMCP — installation, MCP clients, schemas, contributions.
---

## What is FlowMCP exactly?

FlowMCP is a schema library + engine that normalises data sources into AI-callable tools. The library currently contains — production-ready schemas (v4) covering — data sources. The engine routes calls, validates inputs/outputs, and handles authentication. AI agents call FlowMCP; FlowMCP calls the underlying APIs.

## Do I need an MCP-compatible client?

No. FlowMCP is **CLI-first**. The MCP server mode is optional. If you have a client that supports dynamic tool loading, MCP works — otherwise the CLI is the preferred entry point.

## What does CLI-first mean in practice?

You run `flowmcp call <schema>.<tool> '{...}'` from your terminal, an LLM call, or a Node/Python script. Tools are loaded on demand — no need to keep — tools in context.

## Where do API keys live?

API keys live in `~/.flowmcp/.env`, optionally with project overrides. The AI never sees a key — it only sees calls and responses. This is intentional: if an AI made direct REST calls, it would expose keys.

## How do I add a new schema?

See the [Specification](/specification/) and `repos/flowmcp-schemas-private` for the schema-creation guide. Validation rules have explicit IDs (e.g. RES001). PRs go to the schemas repo with tests.

## Can I run FlowMCP offline?

Yes — for schemas that hit local resources (e.g. the `gtfs-sqlite-toolkit` add-on with a converted SQLite DB). For schemas calling remote APIs, you still need network access.

## What is the spec version status?

- **v4** — active production spec, includes Skills, Selections, Output-Schema, Pipes
- **v4.1** — add-on layer (e.g. `gtfs-sqlite-toolkit`)
- **v3** — archive, still loadable but no new schemas
- **v1.x / v2** — legacy, in archive

## Why is FlowMCP "MCP" if it is CLI-first?

The name dates from the project's start as an MCP server experiment. The substance shifted toward a CLI-first schema layer; the name persists for continuity with the MCP ecosystem.

## Where can I report issues?

GitHub Issues per repo. Find the most relevant repository under [github.com/FlowMCP](https://github.com/FlowMCP) and open an issue there. For schema-related questions, use `flowmcp-schemas`. For CLI bugs, use `flowmcp-cli`.

## What is the v4 Self-Contained Skill Pattern?

Skills bring their own parameter reference along — schema data goes **before** workflow instructions. In a lab test, skills with full parameter/enum/example info hit 5/5 success against LLMs; skills with name + description only hit 0/5. The pattern is documented in the v4 specification.

## Are FlowMCP schemas free to use?

Yes, MIT licensed. Some underlying APIs require keys (you supply); the data they return follows their own license — e.g. GTFS feeds under CC-BY 4.0 require attribution in your output. FlowMCP exposes that attribution in the response.
