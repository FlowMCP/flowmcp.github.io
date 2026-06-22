---
title: "The Amnesiac Agent: What a Pre-Built Schema Saves in Tokens, Dollars, and CO₂"
description: "Every AI agent wakes up with no memory of your API and re-derives it from scratch — every session, for everyone. A scripted, honest accounting of what a pre-built FlowMCP schema saves instead, measured on 47 real Berlin open-data sources, with ranges where we can only estimate."
date: 2026-06-22
author: "FlowMCP Team"
tags: ["token-economics", "in-context-learning", "progressive-disclosure", "context-engineering", "open-data", "sustainability"]
lang: en
---

When we show FlowMCP to someone who runs a public dataset — a city office, an association, a registry — the first question is almost always the same, and it is a fair one:

> *"Why shouldn't people just use our database directly? We already have documentation."*

Your documentation is good. That is not the problem. The problem is that **every agent has to re-read and re-derive it, from scratch, every single time** — because between sessions, an AI agent remembers nothing. A schema does that work **once, for everyone**, and the savings in tokens, money, and energy are larger than they look.

This post is the long answer, and it is meant to be **fundable, citable, and honest**: every hard number below comes from a deterministic script — not a model's guess — and wherever we can only estimate, we say so and give a range. We have built and graded **518 schemas across 412 namespaces** so far, so some of this is measured; the rest is modelled on top of that experience, and we mark which is which.

**The short version, in five numbers:**

| What | Number |
|------|--------|
| One consumer call | **~1,500 tokens**, vs ~26,500 to explore raw — a **17.7×** cut (6–47× across the range) |
| Build pays for itself after | **~7 calls** by a single user; **~1** across the whole ecosystem |
| Eyeballing one Berlin schema file | **~3,276 tokens** — about **8× cheaper** than a full grading |
| The entire 518-schema corpus | **~$5,746** on Opus 4.8 (as little as **$337** on a small model) |
| Building all of it emits | **20.6 – 68.2 – 535.7 kg CO₂** — a range, because inference energy is undisclosed |

## The exploration cost nobody bills you for

Every time an agent meets an unfamiliar data source, it pays an **exploration cost**: find the endpoint, read the docs, understand the auth, fetch a response, work out the shape of the JSON, map the fields it actually needs. None of that is the answer the user asked for — it is the *cost of getting to* the answer. And it recurs: a different agent, a new session, a slightly changed API, and the meter starts again from zero.

A pre-built schema sets that cost to **roughly zero for the consumer**. The agent does not explore; it **searches** a catalogue of schemas and **calls** the one it needs. The exploration happened once, when the schema was built — and from then on it is amortised across everyone who ever calls it.

This is, to be clear, **not a novel idea.** It is a clean, rationalised implementation of a principle the field already knows well. The value is not the concept; it is having actually done the work, graded it, and kept it maintained.

## Why the agent always starts from zero — the Memento problem

Between sessions, a large language model is **stateless**. Each call is processed fresh. The only "memory" a single call has is whatever sits in its context window; nothing carries over unless something *outside* the model wrote it down. Learning a task purely from what is in that window — with no change to the model's weights — is called **In-Context Learning** ([Brown et al., 2020](https://arxiv.org/abs/2005.14165), the GPT-3 paper).

The film *[Memento](https://en.wikipedia.org/wiki/Memento_(film))* (Christopher Nolan, 2000) is the blueprint. Its protagonist, Leonard Shelby, has anterograde amnesia: he cannot form new long-term memories and resets after a short span. He copes with an **external memory** — tattoos, Polaroids, handwritten notes. A pre-built schema (like a `CLAUDE.md`, or a RAG store) is exactly that note: the thing that fills the blank page instantly with *"here is where to look."* Without it, the agent re-derives everything each morning; with it, it bootstraps in seconds.

The honest caveat — because metaphors oversell — is that an LLM is *not* amnesiac **within** a session; as long as something is in the window, it has full access. The amnesia is **between** sessions, and for anything not in the window. So the metaphor fits the *waking up*, not the train of thought. "Leonard's notes = a schema" is an image, not a technical claim.

## A concrete example: 47 Berlin data sources

Rather than argue in the abstract, we'll cost out a real set: the Berlin open-data sources already wired into the **FlowMCP Data Configurator** (a demo built on `flowmcp-schemas-private`). These figures are generated from the live payload by a script:

| Metric | Value |
|--------|-------|
| Namespaces | **47** |
| Tools | **293** (avg 6.2 per namespace) |
| det-verified | 32 |
| Distinct schemas | **36** (the 12 `oparl-*` entries are **one** schema) |
| Access | 41 keyless · 4 keyed · 2 local |

The crucial detail: **one namespace covers a whole topic area**, not a single endpoint. `kulturdatenberlin` is 7 tools over ~13,000 cultural events. `transportrestvbb` is the entire Berlin public-transit layer. And the strongest illustration — **one** `oparl` schema fans out, via a shared list, to **11 of Berlin's 12 districts**, with the same 8 tools, *without a single new schema file*. The configurator shows 12 `oparl` entries; under the hood it is one schema. That is why the **36 distinct schemas** matter more than the 47 display entries.

The real value shows up when a citizen's question touches several sources at once. Take the worked anchor for this post — *"The air is bad today; where can I get to instead?"* — which combines two keyless, det-verified namespaces: `luftdatenberlin.getAirQualityIndex` and `transportrestvbb.getReachableFrom`. One question, two whole domains, zero exploration.

## What it cost *us* to build (the honest side)

Building schemas is not free, and we won't pretend otherwise. From our measured corpus (modelled on empirical anchors), per schema:

| Setup step | low / central / high (tokens) |
|------------|-------------------------------|
| Creation | 40,000 / **60,000** / 90,000 |
| Grading (per namespace, full 6-area) | 62,000 / **132,626** / 195,000 |
| Setup *S* (creation + allocated grading) | 89,313 / **165,486** / 245,097 |

For the 36 distinct schemas in the Berlin configurator, that is roughly **2.2 million tokens of creation** (central) — and again, the 11 districts ride on one of those schemas, not eleven. This is the investment. The whole point of everything below is that it is paid **once** and amortised across **every** consumer.

## Two levels of trust

The real lever is an **asymmetry of trust**, and it comes in two levels.

**Level 1 — trust the engine (once, expensive).** You decide one time that you trust the FlowMCP engine to execute schemas safely and correctly. That is a genuine, one-time effort.

**Level 2 — trust the schema (cheap, repeatable).** Once you trust the engine, adding schemas is cheap, because a schema is small and easy to check. You have two cheap options:

- **Delegate the grading.** The full 6-area grading (~**132,626 tokens** per namespace, modelled) is something you do *not* have to do yourself — you can trust whoever already did it, or the FlowMCP grading mirror.
- **Glance at it yourself.** If you still want to eyeball a schema ("is anything weird in here?"), that costs a fraction. We verified this against real files: a Berlin schema measures **~3,276 tokens** (median of four — `luftdatenberlin`, `kulturdatenberlin`, `transportrestvbbext`, `berlinclub`), and a focused review call runs ~16,776 tokens empirically. Either way it is **~8× cheaper** than a full grading.

So: trust the engine once (expensive), then load schemas freely (almost free) — and even the optional self-check is a sliver of a full grading.

## What the *consumer* saves, per call

Now the other side of the ledger. What does a single user save each time they pull data through a schema instead of letting the agent fetch and parse raw web content? Modelled on cited real-world anchors — the [Cloudflare](https://blog.cloudflare.com/) markdown-for-agents result (~80% reduction) and a [dev.to study](https://dev.to/) measuring an HTML→clean-text token tax with a **7.4× median**, up to 47.8×:

| Quantity (tokens, first read) | low / central / high |
|-------------------------------|----------------------|
| Manual fetch *M* | 8,500 / **26,500** / 90,000 |
| FlowMCP call *F* | 1,400 / **1,500** / 1,900 |
| Saving Δ | 7,100 / **25,000** / 88,100 |
| **Reduction factor** | 6.1× / **17.7×** / 47.4× |

Those 6–47× **independently reproduce** the measured HTML token tax — the model mirrors the studies, it does not invent the spread.

The single-user **break-even** is `N* = ceil(S / (M − F))` ≈ **7 tool-calls** (central; 3–13 across the bands). After about seven uses, one user has already repaid the build cost. Amortised across the whole ecosystem (`S/U`, where U is the number of consumers), `N*` approaches **1** — effectively immediate.

### A frequency scenario

Take the "bad air" anchor and assume one user asks it on a schedule. Savings (central Δ = 25,000 tokens/call) over a year:

| Frequency | Calls/year | Tokens saved/year | CO₂ saved/year |
|-----------|-----------|-------------------|----------------|
| Once a month | 12 | ~0.30 M | ~20 g |
| Weekly | 52 | ~1.30 M | ~85 g |
| 5×/week | ~260 | ~6.50 M | ~426 g |

These are *per user, per source*, and they are the conservative first-read figure — in multi-round sessions the saving is **strictly larger**, because a raw payload would otherwise be re-billed on every follow-up turn. Multiply by a population of users and it adds up fast.

## Same work, different price tag

Tokens are the physics; dollars are how it lands on an invoice. The build cost of our **entire** 518-schema corpus, priced as metered API across model tiers (the dominant component is cache-reads):

| Model | Tier | Corpus cost | vs Opus |
|-------|------|-------------|---------|
| claude-fable-5 | frontier-plus | $11,493 | 2× |
| claude-opus-4-8 | frontier | **$5,746** | 1× |
| openai-gpt-5.5 | frontier | $5,201 | 0.91× |
| claude-sonnet-4-6 | mid | $3,448 | 0.6× |
| google-gemini-2.5-pro | mid | $1,390 | 0.24× |
| claude-haiku-4-5 | small | $1,149 | 0.2× |
| openai-gpt-5.4-mini | small | $780 | 0.14× |
| google-gemini-2.5-flash | small | $337 | 0.06× |

The honest caveat: a weaker model is cheaper *per token* but in practice needs more turns to get the same job right, so the small-model figures understate their real cost. The other honest number from the same pipeline: **27.1%** of the work is avoidable learning/alignment overhead — exactly the part a pre-built schema removes.

## Why it works — and why it isn't new

Three mechanisms, all of them well documented.

**Progressive disclosure.** Loading *every* tool definition into context up front is expensive: Anthropic reports tool definitions consuming **134K tokens** before optimisation, and ~**55K tokens** for just five connected MCP servers. Their own fixes show the lever clearly — a "tool search" approach takes **77K → 8.7K tokens (85%)**, and code-execution-with-MCP takes a scenario from **150K → 2K (98.7%)** ([Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp), [Advanced tool use](https://www.anthropic.com/engineering/advanced-tool-use)). FlowMCP's `search → call` is the same principle — *load capability only when the task needs it* — applied to **data sources** instead of tools. We did not invent this; we cite it openly. FlowMCP is the rationalised implementation, not the idea.

**Avoiding context bloat.** It is not only about cost; **quality drops too.** As a context window fills, a model's ability to use what's in it degrades — Chroma's *[Context Rot](https://research.trychroma.com/context-rot)* study shows all 18 tested models becoming less reliable as input grows, non-linearly; a single distractor measurably lowers performance; and a ~300-token focused prompt beats a ~113K-token full prompt *containing the same answer*. ([Lost in the Middle](https://arxiv.org/abs/2307.03172) and [NoLiMa](https://arxiv.org/abs/2502.05167) document the same long-context degradation.) Pulling raw HTML into the window is **context pollution**; the structured, ~1K-token response of a schema is the opposite — the "just-in-time retrieval" that [context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) recommends.

**Serendipity through curation.** Because a namespace gathers related tools, and namespaces sit next to each other in one searchable catalogue, an agent often surfaces *adjacent* sources the user didn't think to ask for. That is a FlowMCP value proposition, not an external study — we mark it as such.

## The ecological footprint — a range, never a point

Token savings translate directly into energy and CO₂. We have to be careful here: **Claude's inference energy is not published.** Everything below is extrapolated from other models, and the token-type weights are price-derived proxies, not measured energy. So we report a **range, never a single false-precise number.**

- Building the full 518-schema corpus: **20.6 – 68.2 – 535.7 kg CO₂** (a 26× spread — that *is* the honest uncertainty), roughly 280 km of driving at the central estimate.
- Saved per first-read call: **0.47 – 1.64 – 5.78 g CO₂.** (For reference: ~244 g CO₂ per km driven, ~12.4 g per smartphone charge — [EPA equivalencies](https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator).)

The argument is not "schemas are green." It is that **re-deriving the same data, raw, in thousands of separate sessions multiplies the energy**, where building it cleanly once does not.

## The honest ledger

Because this post is meant to be cited, here is what is what:

- **FACT (measured):** the 47 namespaces / 293 tools / 36 distinct schemas; the schema-file token sizes; the configurator counts. Generated by script from the live payload.
- **MODELLED (on empirical anchors, Memo-143 cost pipeline):** creation/grading/security-check costs; the per-call ROI and break-even; the model-price table; the CO₂ figures.
- **ESTIMATE / RANGE:** anything ecological (energy undisclosed → 26×/85× spreads reported as low–central–high); the security-check call size (the *file* is measured at ~3,276 tokens; the full call is anchored to an empirical ~17K median).
- **VALUE CLAIM, not a study:** "serendipity through curation."

Every hard number here is produced by a deterministic script that reads the source data live — so it can be re-run and checked, and so we are not asking you to trust a number a model typed out.

If you run a public dataset: your documentation is the hard part, and you already did it. A schema just makes sure that work is read **once, by everyone's agents, forever** — instead of being re-explored, raw, on every single visit.

---

### Sources

- Brown et al. (2020), *Language Models are Few-Shot Learners* — [arxiv.org/abs/2005.14165](https://arxiv.org/abs/2005.14165) (In-Context Learning).
- *Memento* (2000) — [en.wikipedia.org/wiki/Memento_(film)](https://en.wikipedia.org/wiki/Memento_(film)).
- Anthropic, *Code execution with MCP* — [anthropic.com/engineering/code-execution-with-mcp](https://www.anthropic.com/engineering/code-execution-with-mcp).
- Anthropic, *Advanced tool use* (Tool Search) — [anthropic.com/engineering/advanced-tool-use](https://www.anthropic.com/engineering/advanced-tool-use).
- Anthropic, *Effective context engineering for AI agents* — [anthropic.com/engineering/effective-context-engineering-for-ai-agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents).
- Chroma Research, *Context Rot* — [research.trychroma.com/context-rot](https://research.trychroma.com/context-rot).
- Liu et al., *Lost in the Middle* — [arxiv.org/abs/2307.03172](https://arxiv.org/abs/2307.03172).
- *NoLiMa: Long-Context Evaluation Beyond Literal Matching* — [arxiv.org/abs/2502.05167](https://arxiv.org/abs/2502.05167).
- EPA Greenhouse Gas Equivalencies — [epa.gov/energy/greenhouse-gas-equivalencies-calculator](https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator).

*Cost, token, and CO₂ figures derive from the FlowMCP measurement pipeline (Memo 143) and a deterministic figure script run against the live Berlin configurator payload. Modelled values are marked; ecological figures are ranges because model inference energy is undisclosed.*
