---
title: Schemas & Sources
description: The three layers of FlowMCP — engine, schemas, and data operators — and why FlowMCP neither publishes nor displays schemas.
---

FlowMCP is built from three layers that are easy to confuse but stay strictly separate. Keeping them apart is the key to understanding what FlowMCP is responsible for and what it is not.

## Engine, Schemas, and Data Operators

The **engine** is the part FlowMCP builds and maintains. It is the Core library and the CLI that load a schema, sign the request, call the source, and normalize the response. The engine is MIT-licensed, open source, and the same audit covers every call that flows through it.

A **schema** is a thin declaration that tells the engine how to reach one data source and how to shape its response. Schemas are community contributions: anyone can write one for an API or dataset. They are not part of the engine, and a schema can be added, replaced, or removed without touching the engine at all.

A **data operator** is whoever runs the API or publishes the dataset behind a schema. They decide their own Terms of Service, data license, and rate limits. FlowMCP has no control over that layer — it only passes the call through and returns the answer.

These three layers never merge. The engine moves data, schemas describe sources, and operators own the data. Confusing them is the most common source of misunderstanding about what FlowMCP does.

## What FlowMCP Does Not Do

FlowMCP **does not publish schemas, and it does not show schemas on this website.** There is no catalog page, no schema browser, and no hosted list of sources here. Schemas live in their own repositories and are loaded by the CLI on demand; the website explains the engine and the model, not the individual schemas.

Because the data operators own the source and its terms, FlowMCP also makes no judgment about them. We record a few neutral facts where a provider publishes them — the Terms of Service URL (`meta.termsOfService`), the date we last checked it (`meta.termsOfServiceCheckedAt`), and the data license name when one is stated (`meta.dataLicenseName`) — and we link out to the original. We do not classify those terms, interpret them, or advise on commercial use. Reviewing a provider's Terms of Service, rate limits, and data license before you rely on a source remains your responsibility, and FlowMCP makes no warranty about fitness for any purpose.

## See Also

- [Specification: License & ToS ({{spec.specDir}}/23-license-and-tos.md)](https://github.com/FlowMCP/flowmcp-spec/blob/main/{{spec.specDir}}/23-license-and-tos.md)
- [DISCLAIMER.md in flowmcp-core](https://github.com/FlowMCP/flowmcp-core/blob/main/DISCLAIMER.md)
- [DISCLAIMER.md in flowmcp-cli](https://github.com/FlowMCP/flowmcp-cli/blob/main/DISCLAIMER.md)
