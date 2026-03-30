---
title: Frequently Asked Questions
description: Answers to the most common questions about Open Data Enabled AI.
---

## Do you provide data?

No. We create **schemas** that make existing public data easier to reach for AI systems. The data stays with the provider — we store nothing, host nothing, change nothing. We build the adapter between the data source and the AI.

## Why do you need so many data sources?

Because real questions in everyday life are never simple.

"Should I bike tomorrow?" sounds like a simple question. But to answer it well, the AI needs:
- **Weather data** — Will it rain tomorrow?
- **Route data** — How far is it?
- **Sharing data** — Is there a bike nearby?
- **Calendar data** — Do I even have an appointment outside?

A single data source delivers a single answer. Only the combination makes the answer truly useful. That is exactly what our schemas make possible.

Concrete examples: [Use Cases →](/use-cases/)

## Do I need an API key?

For most of our schemas, no. We deliberately start with data sources that are **freely accessible without an API key** — weather data, public transit schedules, geocoding, bike sharing, and more.

Schemas that require an API key are clearly marked.

## What is a schema?

A schema describes how to query a data source — structured and standardized. It is like an **adapter** between the data provider's API and the AI.

One schema per data provider. Multiple tools (individual queries) per schema. The AI does not need to read the API documentation itself — the schema has already done that work.

More: [Schemas and Tools →](/schemas-and-tools/)

## Can I use your schemas without OpenClaw?

Yes. Our schemas work with **any MCP-compatible client** — over 100 applications, including Claude, ChatGPT, Cursor, VS Code Copilot, and many more. OpenClaw is just one of many options.

Which client for whom: [Clients and Compatibility →](/mcp-clients/)

## Is this free?

Yes. Everything is **open source under MIT license** — the schemas, the tools, the code, the documentation. Free to use for everyone, without restrictions.

## Do you store my data?

No. We have **no backend**. The schemas run locally on your device or through the client of your choice. We see no requests, store no data, have no access to your queries.
