---
title: Integration (Coming Soon)
description: MVP 2 — How our schemas reach existing clients, why we chose OpenClaw and CLI, and what this means for users.
---

:::caution[In Planning]
This page describes the planned next phase. The architecture is designed, technical implementation has not started yet.
:::

## From Demo to Real Usage

FlowMCP schemas work end-to-end — from data source to AI agent response. But a standalone app is not the goal. Most people do not want to install yet another app. They want answers where they already are: in WhatsApp, Telegram, Slack, or their preferred AI assistant.

That is exactly what this phase is about: integrating our schemas and agents into **existing clients** — not as an island, but as a building block in a larger ecosystem.

## Why CLI-first?

When we designed the first architecture in October 2025, the plan was: everything via MCP servers. The Model Context Protocol was the standard, and it worked. But since then, something has changed.

In practice, AI agents work most reliably with **command-line interfaces**. The reasons are technical: session initialization with MCP is error-prone, state management across protocol boundaries is complicated, and instant updates work better with CLI.

**This does not mean MCP is dead.** MCP remains as a second channel — for clients that prefer it. FlowMCP supports both. But for the primary integration path, we choose CLI because it works most reliably today.

## OpenClaw: Why This Project?

[OpenClaw](https://docs.openclaw.ai) is an open-source AI assistant gateway under MIT license. It has existed only since November 2025 and has already reached over 330,000 GitHub stars — more than Linux, Kubernetes, and Blender combined. It is the fastest-growing software project on GitHub.

For us, OpenClaw is the right partner for several reasons:

**Cron jobs change everything.** Most AI interactions are reactive: the user asks, the AI responds. With OpenClaw, we can set up **proactive** queries. A cron job runs automatically — for example every morning at 7:30 AM — and delivers results without the user doing anything. This is not possible with pure MCP servers or MCPUI.

**Multi-channel, not multi-app.** OpenClaw delivers answers via WhatsApp, Telegram, Slack, Discord, and more. The user decides where to receive the data — not us. Our schemas work identically in every channel.

**No gatekeeper.** On other platforms (e.g., OpenAI MCPUI), you need approval to be visible. Not with OpenClaw. Open source means: anyone can install and use our plugin — immediately, without approval.

## Three Integration Levels

Integration is not a single step but a staged model. Each level brings our schemas closer to users:

| Level | What happens | For whom | Status |
|-------|-------------|----------|--------|
| **Level 1: MCP Server** | Our schemas are embedded directly as an MCP server in OpenClaw. All three usage architectures work: individual tools, sub-agents with their own intelligence, or full orchestration with a coordinator. | Developers using MCP clients | Possible |
| **Level 2: OpenClaw Plugin** | An npm package that registers each schema as a tool. Publishable on ClawHub, installable with one command. The fastest path for end users. | All OpenClaw users | Planned |
| **Level 3: NemoClaw Policy Preset** | A YAML file bundling all API endpoints of our schemas. Enterprise customers can unlock instantly — with the security policies their organization requires. | Companies and government agencies | Planned |

### Enterprise Security with NemoClaw

For use in companies and government agencies, open source alone is not enough. You need security policies, sandbox isolation, and controlled release processes.

[NVIDIA NemoClaw](https://docs.nvidia.com/nemoclaw/) is the enterprise security layer for OpenClaw (Apache 2.0, Alpha since March 2026). It offers deny-by-default network policies, sandbox isolation, and a blueprint system. A policy preset would bundle all API endpoints of our schemas — so a security officer could enable access to all open data sources with a single approval.

This matters because: public data is public, but access to it within an organization still needs to be regulated. NemoClaw makes this possible without us having to run enterprise infrastructure ourselves.

## Open and Free: Local Operation

Not everyone wants or can use cloud services. That is why we are working in parallel on a fully local solution:

- **llama.cpp** as a local LLM — no API key, no costs, full control over your own data
- Running on a **Raspberry Pi** — a device for under 100 euros, completely independent from cloud services
- Ideal for **individuals** who do not want to send their data to third parties, for **schools** working on limited budgets, and for **organizations** with strict data privacy requirements

Our schemas work locally just as they do in the cloud. That is the principle of open protocols: data and preparation are separate from the operating model. If you want to work locally, you can — without limitations.

## Example: Multi-Source Data Integration

A practical integration combines multiple FlowMCP schemas through a single MCP server.
For instance, a travel planning system could load schedule, weather, and location schemas —
giving any connected AI client access to all three data sources through one endpoint.

The same pattern works for any domain: environmental monitoring, public administration,
financial data, or any combination of structured data sources.

## Pilot Program

In parallel with technical integration, we are looking for **data partners** who want to co-develop AI connections for public data. We are not looking for money or labor — we are looking for data sources and the willingness to review a finished connection.

**[Meet the team →](/roadmap/team/)**

## Next Steps

This phase is in preparation. Specifically, we are working on:

1. **Validation** of existing schemas with real data partners — do they work in everyday use?
2. **Optimization** based on real-world usage — better answer quality, better error handling
3. **OpenClaw integration** — the plugin that makes schemas available as tools
4. **Local operation** — testing with llama.cpp on Raspberry Pi

More on the timeline: [Roadmap](/roadmap/overview/)
