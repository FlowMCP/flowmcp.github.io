---
title: "Groups & Skills"
description: "FlowMCP v4.0.0 cherry-pick groups with integrity hashes and skills for multi-tool composition"
---

Groups let you create named collections of specific tools, resources, and skills from across multiple schemas. Skills attach reusable AI agent workflows to groups, guiding AI agents through multi-step tasks.

:::note
This page combines the Groups and Group Skills sections from the [formal specification](https://github.com/FlowMCP/flowmcp-spec). In v4.0.0, "Group Prompts" have been renamed to "Group Skills" to align with MCP terminology.
:::

## Groups

A typical FlowMCP installation has hundreds of schemas with thousands of tools. Most projects only need a handful of specific tools. Groups solve this by letting you:

1. **Select specific tools and resources** from any schema
2. **Name the collection** for reuse
3. **Verify integrity** with cryptographic hashes
4. **Share collections** across projects and teams

### Group Definition

Groups are defined in `.flowmcp/groups.json`:

```json
{
    "specVersion": "3.0.0",
    "groups": {
        "my-crypto-monitor": {
            "description": "Crypto price and TVL monitoring tools",
            "tools": [
                "etherscan/contracts.mjs::tool::getContractAbi",
                "coingecko/coins.mjs::tool::getSimplePrice",
                "coingecko/coins.mjs::tool::getCoinMarkets",
                "defillama/protocols.mjs::tool::getTvlProtocol",
                "etherscan/contracts.mjs::resource::verifiedContracts"
            ],
            "hash": "sha256:a1b2c3d4e5f6...",
            "includeSchemaSkills": true
        }
    }
}
```

### Type Discriminator Syntax

In v4.0.0, tool references use type discriminators to distinguish between tools, resources, and skills:

| Discriminator | Format | Example |
|---------------|--------|---------|
| `::tool::` | `namespace/file.mjs::tool::name` | `etherscan/contracts.mjs::tool::getContractAbi` |
| `::resource::` | `namespace/file.mjs::resource::name` | `etherscan/contracts.mjs::resource::verifiedContracts` |
| `::skill::` | `namespace/file.mjs::skill::name` | `etherscan/contracts.mjs::skill::contract-audit` |

For backward compatibility, the v2 format `namespace/file.mjs::routeName` (without type discriminator) is still accepted and is treated as `::tool::`.

### `includeSchemaSkills`

When `includeSchemaSkills` is set to `true`, the group automatically includes all skills from schemas whose tools are already in the group.

### Hash Verification

Integrity hashes ensure group definitions haven't changed unexpectedly.

**Per-tool hash** — calculated from the `main` block only (no handler code):

```
toolHash = SHA-256( JSON.stringify( {
    namespace, version, tool: { name, method, path, parameters, output },
    sharedListRefs: [ { ref, version } ]
} ) )
```

**Per-group hash** — calculated from sorted tool references and their individual hashes:

```
groupHash = SHA-256( JSON.stringify(
    tools.sort().map( ( toolRef ) => ({ ref: toolRef, hash: getToolHash( toolRef ) }) )
) )
```

### Verification CLI

```bash
flowmcp group verify my-crypto-monitor
```

```bash
# Success
Group "my-crypto-monitor": 4 tools, all hashes valid

# Hash Mismatch
Group "my-crypto-monitor": HASH MISMATCH
  - etherscan/contracts.mjs::tool::getContractAbi: expected sha256:abc... got sha256:def...
```

### Group Operations

| Operation | Command | Description |
|-----------|---------|-------------|
| Create | `flowmcp group create <name>` | Create empty group |
| Add tool | `flowmcp group add <name> <tool-ref>` | Add tool and recalculate hash |
| Remove tool | `flowmcp group remove <name> <tool-ref>` | Remove tool and recalculate hash |
| Verify | `flowmcp group verify <name>` | Check all hashes |
| List | `flowmcp group list` | Show all groups |
| Export | `flowmcp group export <name>` | Export as shareable JSON |
| Import | `flowmcp group import <file>` | Import from JSON (verifies hashes) |

### Group Constraints

| Constraint | Value |
|------------|-------|
| Name pattern | `^[a-z][a-z0-9-]*$` (lowercase, hyphens allowed) |
| Max tools per group | 50 |
| All tools must be resolvable | Schema + tool must exist |
| No duplicate tool references | Within a group |

---

## Group Skills

Skills bridge the deterministic tool layer with non-deterministic AI orchestration. Groups define **which** tools are available; skills define **how** to use them together.

### Separation of Concerns

| Layer | Nature | Responsibility |
|-------|--------|----------------|
| Schema | Deterministic | Defines individual tool behavior |
| Group | Deterministic | Defines which tools are available |
| Skill | Non-deterministic | Defines how tools compose into workflows |

### Skill File Format

Group-level skills are stored as `.md` files in `.flowmcp/skills/`:

```
.flowmcp/
├── groups.json
├── skills/
│   ├── token-analysis.md
│   └── portfolio-snapshot.md
└── tools/
```

:::note
Group-level skills (`.md` files in `.flowmcp/skills/`) are different from schema-level skills (`.mjs` files alongside the schema). Group-level skills are project-specific workflows. Schema-level skills are part of the schema's MCP Prompts. See [Skills](/docs/specification/skills/) for schema-level skill documentation.
:::

### Required Sections

| Section | Heading | Required | Description |
|---------|---------|----------|-------------|
| Title | `# <title>` | Yes | First line of the file |
| Description | `## Description` | No | 1-3 sentences about the skill |
| Input | `## Input` | No | Parameters the user provides |
| Workflow | `## Workflow` | Yes | Step-by-step instructions referencing tools |
| Output | `## Output` | No | Final artifact description |

### Example Skill File

```markdown
# Standard Token Analysis

## Description
Generate a comprehensive technical analysis report for any financial instrument.

## Input
- `tokenName` (string, required): Name or ticker symbol of the instrument

## Workflow
### Step 1: Symbol Resolution
Search for `{tokenName}` using `searchSymbol`.

### Step 2: Fetch Price Data
Call `getOhlcv` with interval: 1d, period1: 200 days ago.

### Step 3: Compute Indicators
Compute `getRelativeStrengthIndex`, `getSimpleMovingAverage`, `getMovingAverageConvergenceDivergence`.

### Step 4: Generate Charts
Call `generateCandlestickChart` and `generateLineChart`.

### Step 5: Report
Produce a Markdown document with indicator summary and embedded charts.

## Output
- Markdown document with embedded base64 chart images
- Indicator summary with BUY/SELL/HOLD signals
```

### Skill CLI Commands

| Command | Description |
|---------|-------------|
| `flowmcp skill list` | List all skills across all groups |
| `flowmcp skill search <query>` | Search skills by title or description |
| `flowmcp skill show <group>/<name>` | Display full skill content |
| `flowmcp skill add <group> <name> --file <path>` | Add skill to a group |
| `flowmcp skill remove <group> <name>` | Remove skill from group |

### Skill Validation Rules

| Code | Rule |
|------|------|
| PRM001 | Skill name must match `^[a-z][a-z0-9-]*$` |
| PRM002 | File must exist at declared path |
| PRM003 | File must have `# Title` (first line) |
| PRM004 | File must have `## Workflow` section |
| PRM005 | Tool references must resolve in group (warning) |
| PRM006 | Group must have at least one tool |
| PRM007 | No duplicate skill names within a group |
| PRM008 | Filename must match skill name |
