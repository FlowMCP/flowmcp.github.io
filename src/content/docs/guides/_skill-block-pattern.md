---
title: Skill-Block Pattern (internal)
description: Convention for embedding a copyable skill snippet at the top of a tutorial. Not rendered in the sidebar.
---

# Skill-Block Pattern

This page documents the internal pattern used by FlowMCP tutorials to expose a copyable skill snippet to LLM users (Claude Code, Cursor, etc.).

The `_` prefix in the filename keeps Starlight from listing this page in the sidebar — it exists purely as guidance for tutorial authors.

## What a skill block is

A "skill block" is a markdown snippet, placed at the top of a tutorial, that an LLM user can copy with one click and drop into `~/.claude/skills/<skill-name>/SKILL.md`. The format mirrors the existing `SKILL.md` schema used by Anthropic's Claude Code skill system, so no transformation is needed on the user's side.

## Schema

Every skill block follows this fixed schema (YAML frontmatter + structured markdown body):

```markdown
---
name: flowmcp-<tutorial-slug>
description: <one-sentence description of what the skill does>
---

# <Skill Title>

<2-3 sentences: when to use this skill, what happens, prerequisites>

## Steps

1. <Step 1>
2. <Step 2>
3. <Step 3>

## References

- Tutorial: https://flowmcp.github.io/guides/<tutorial-slug>/
- FlowMCP CLI: https://github.com/FlowMCP/flowmcp-cli
```

## How to embed it in a tutorial

Use the `CopyMarkdown` component in `mode="slot"` and put the skill block inside an MDX template literal so the raw string is passed through unchanged:

```mdx
import CopyMarkdown from '../../../components/CopyMarkdown.astro'

<CopyMarkdown mode="slot" lang="en" label="Copy this skill to ~/.claude/skills/">
{`---
name: flowmcp-my-tutorial
description: <one-sentence description>
---

# My Tutorial Skill

...skill body...
`}
</CopyMarkdown>
```

## Rules

- One skill block per tutorial — keep it focused on the tutorial's outcome.
- Skill name is always `flowmcp-<tutorial-slug>` so it is discoverable and namespace-safe.
- The body should be self-contained: a fresh LLM session must be able to act on the steps without reading the surrounding tutorial.
- Reference URLs in the `References` section must use absolute `https://flowmcp.github.io/...` paths so the snippet survives being copied out of context.
- Installation / reference pages do not get a skill block — only tutorials with an end-to-end workflow.

## Phase 7 tutorials with skill blocks

- `guides/hackathon-kit` → `flowmcp-hackathon-kit`
- `guides/agent-creation` → `flowmcp-agent-creation`
- `guides/gtfs-pilot` → `flowmcp-gtfs-pilot`

CLI Setup (`quickstart/installation`) gets only the whole-page copy button — it has no tutorial-workflow character.
