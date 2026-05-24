---
title: License & Terms of Services FAQ
description: How FlowMCP handles licensing, API Terms of Services, and data licenses across three layers.
---

FlowMCP operates in a three-layer license model. Understanding all three layers is essential before using FlowMCP in production or commercial contexts.

## The Three Layers

| Layer | What | Who Decides | What FlowMCP Does |
|-------|------|-------------|---------------------|
| **1. FlowMCP Schema Code** | Schema definitions (`.mjs`), Core library, CLI | FlowMCP (we) | **MIT-licensed** |
| **2. API Provider ToS** | What you may do with the called API | API Provider | **Link only — no classification** |
| **3. Data License** | What you may do with the returned data | Data publisher | **Link only — no classification** |

## What We Do

- Document the ToS URL where available (`meta.termsOfService` per schema)
- Document the date we last verified the link (`meta.termsOfServiceCheckedAt`)
- Document the language of the ToS document (`meta.termsOfServiceLanguage`)
- Mirror data license name when provider explicitly publishes one (`meta.dataLicenseName`)

## What We Do NOT Do

- We **do not** classify Terms of Services into legal categories
- We **do not** make recommendations about commercial use
- We **do not** reproduce ToS content in our schemas
- We **do not** provide legal advice

## Why We Don't Classify

Terms of Services are living documents — they change without notice. Classifying them requires legal expertise we don't have, and our jurisdiction is limited. Compliance is your responsibility.

## How Do I Check an API's Terms of Services?

1. Look at the schema file — `meta.termsOfService` has the URL (or `null` if unknown)
2. Visit the URL — note: it may have been updated since `termsOfServiceCheckedAt`
3. Review for:
   - Free vs commercial tier
   - Attribution requirements
   - LLM-training restrictions
   - Re-distribution rules

## What if I Need Legal Advice?

Consult a qualified lawyer in your jurisdiction. FlowMCP does not provide legal advice and has no liability for compliance decisions.

## Is `meta.dataLicense` Legally Binding?

No. We only mirror what the provider publishes on their site. The provider's actual terms control. We make no warranty.

## What If a Schema Has No `termsOfService` URL?

It means:
- We have not yet researched that provider, OR
- The provider does not publish a ToS (e.g. NASA APOD — Public Domain US Government data)

In either case, verify yourself before commercial use.

## How Often Do You Re-Check ToS URLs?

We aim to re-check every 6 months. A background audit script flags stale entries. Reactive updates happen when major ToS changes are publicly known.

## CLI Disclaimer Output

You can enable opt-in license disclaimers in the CLI:

```bash
# In flowmcp.config.json (global or project-local):
{
    "licenseDisclaimer": true
}

# Then:
flowmcp call coingecko_market_chart
# [License Info] Provider: coingecko
# [License Info] ToS: https://www.coingecko.com/en/terms (last checked: 2026-05-18)
# [License Info] We do not interpret ToS. Please review before commercial use.
```

Default: `licenseDisclaimer: false` (off).

## User Responsibility

You are solely responsible for:

- Reviewing each API provider's Terms of Services before use
- Complying with rate limits, attribution requirements, and data licenses
- Determining suitability for commercial, research, or production use
- Adhering to LLM-training restrictions and re-distribution clauses

FlowMCP makes **no warranty** about ToS compliance, data licensing, or fitness for any purpose. Use at your own risk.

## See Also

- [Specification: License & ToS ({{spec.specDir}}/23-license-and-tos.md)](https://github.com/FlowMCP/flowmcp-spec/blob/main/{{spec.specDir}}/23-license-and-tos.md)
- [DISCLAIMER.md in flowmcp-core](https://github.com/FlowMCP/flowmcp-core/blob/main/DISCLAIMER.md)
- [DISCLAIMER.md in flowmcp-cli](https://github.com/FlowMCP/flowmcp-cli/blob/main/DISCLAIMER.md)
