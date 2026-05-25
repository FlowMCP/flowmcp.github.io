---
title: Primitives
description: The four FlowMCP primitives — Resources, Prompts, Skills, Agents — explained in brief.
---
<!-- PAGEFIND-META-START -->
<span style="display:none" data-pagefind-meta="section">Concepts</span>
<!-- PAGEFIND-META-END -->


FlowMCP groups everything an AI agent needs into four primitives: Resources, Prompts, Skills, Agents. The first three live inside a [schema](/concepts/schemas/) and describe what one provider offers. Agents combine tools from many schemas into a purpose-built unit. This page gives a brief, conceptual overview — for the full field definitions, validation rules, and examples, follow the spec links per section.

## Resources

A resource is a local dataset bundled with a schema, typically a SQLite database. The FlowMCP runtime loads the `.db` file and exposes each defined query as an MCP resource — no network calls, no API keys, no rate limits. Resources are ideal for bulk-downloaded open data such as company registers, transit schedules, or sanctions lists, where the data is large, rarely changes, and offline access matters.

Spec: [Resources](/specification/resources/).

## Prompts

A prompt is an explanatory text scoped to a namespace. Prompts teach an AI agent how a provider's tools work together — pagination patterns, error semantics, rate-limit guidance, how to combine endpoints. Prompts **explain**; they do not **instruct**. They are model-neutral, so any AI client benefits.

Spec: [Prompts](/specification/prompts/).

## Skills

A skill is a multi-step workflow instruction embedded in a schema. Where a prompt explains context, a skill tells an LLM exactly what to do, step by step: which tool to call first, how to pass the result onward, when to branch. Each skill declares its tool dependencies, defines typed input parameters, and records which model it was tested with.

Spec: [Skills](/specification/skills/).

## Agents

An agent is a purpose-driven composition that bundles tools from multiple providers into a single, testable unit. Where individual schemas wrap a single API, agents combine the right tools for a specific task — for example, a mobility agent might pull from a train-schedule schema, a weather schema, and a bike-sharing schema simultaneously. An agent has its own LLM, its own system prompt, and a curated tool set, and it runs an agentic loop — understand the question, pick a tool, evaluate the result, decide whether more information is needed.

![Agent Structure: LLM, System Prompt, Skills, Tool Set with Agentic Loop](/images/agent-manifest-aufbau.png)

FlowMCP recognises three usage architectures, from simple to complex: Level 1 (Tools Only — the client AI calls individual tools directly, no extra LLM), Level 2 (Sub-Agent — a specialised agent with its own LLM and agentic loop), Level 3 (Orchestration — a coordinator agent distributes work to multiple sub-agents). Not every request needs a full agent; many use cases are perfectly served by Level 1.

![Three usage architectures: Tools Only, Sub-Agent, Orchestration](/images/diagram-2-usage-architectures.png)

Spec: [Agents](/specification/agents/).
