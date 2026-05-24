---
title: Tools
description: What a FlowMCP tool is, how tools are selected, and how the tool execution flow works.
---

## What is a Tool?

A tool is a single, named operation that an AI agent can call. From the agent's perspective the tool is the smallest unit of action: pass typed inputs, receive a structured result. Under the hood the tool wraps one HTTP request to a data provider's API — but the agent does not need to know that. The tool description, parameter list, and result shape are all the agent sees. Each tool belongs to exactly one [schema](/concepts/schemas/), and a schema typically contains 2-8 tools.

## Tool Selection

Tools are not selected as a flat list. They flow through a funnel — from provider via schema and individual tools down to the curated Tool Set that an agent actually uses. Not every tool is needed for every task; the funnel is how relevance is enforced.

![Tool Selection: Provider -> Schemas -> Tools -> Tool Set](/images/tool-auswahl.png)

A Tool Set is the explicit list of tools an agent may call. It is part of the agent definition (see [Primitives — Agents](/concepts/primitives/#agents)). The same tool can appear in many Tool Sets across many agents; the tool itself stays the same.

## Tool Execution Flow

A tool call goes through four stages. First, the agent (or client) invokes the tool by its fully qualified name with the input payload. Second, the FlowMCP runtime validates the payload against the parameter definitions in the schema — types, required fields, value ranges, enum membership. Third, if validation passes, the runtime resolves any `requiredServerParams` (e.g. API keys from the environment) and applies modifiers like header injection or path templating, then performs the HTTP request to the provider. Fourth, the response is shaped to match the declared output schema and returned to the caller. Errors at any stage produce a structured error response — never a raw exception.

The full step-by-step contract, including the modifier hooks (`preRequest`, `postRequest`), is documented in the spec: [FlowMCP Spec v4.1.0 — Tool Execution](/specification/overview/).

## Trying a Tool

The quickest way to try a tool is via the FlowMCP CLI:

```bash
flowmcp search <provider>
flowmcp add <namespace>
flowmcp call <namespace.toolName> '{"param":"value"}'
```

The CLI handles validation, environment lookup, and HTTP execution end to end. For programmatic use, the same flow is available via the core API — see [Programmatic API](/reference/core-methods/).
