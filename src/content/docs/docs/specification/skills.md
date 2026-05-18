---
title: "Skills"
description: "FlowMCP v4.0.0 skills — reusable AI agent instructions stored as .mjs files, mapping to MCP Prompts"
---

Skills are reusable AI agent instructions that compose tools and resources into multi-step workflows. They map to the MCP **Prompts** primitive and are declared in the `skills` key of a schema's `main` export. Each skill is stored as a separate `.mjs` file alongside the schema.

:::note
Skills are optional. Most schemas only need tools. Add skills when your schema has tools that work together in a predictable workflow that benefits from step-by-step guidance.
:::

## When to Use Skills

| Use Case | Skill Needed? |
|----------|---------------|
| Single tool call (get price, check status) | No |
| Multi-step workflow (fetch data, transform, report) | Yes |
| Common combination of tools that agents should know about | Yes |
| Simple tool with clear description | No |

Skills are most valuable when:
- Multiple tools from the schema work together in a specific sequence
- The workflow requires context about how to interpret intermediate results
- AI agents would benefit from structured guidance on tool composition

## Schema Declaration

Skills are referenced in the `main` export's `skills` array:

```javascript
export const main = {
    namespace: 'etherscan',
    name: 'ContractExplorer',
    version: '3.0.0',
    root: 'https://api.etherscan.io',
    tools: {
        getContractAbi: { /* ... */ },
        getSourceCode: { /* ... */ }
    },
    skills: [
        {
            name: 'full-contract-audit',
            file: 'full-contract-audit.mjs',
            description: 'Retrieve ABI and source code for a comprehensive contract audit'
        }
    ]
}
```

### Skill Reference Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Skill identifier. Must match `^[a-z][a-z0-9-]*$` (lowercase, hyphens). |
| `file` | `string` | Yes | Path to the `.mjs` skill file, relative to the schema. Must end in `.mjs`. |
| `description` | `string` | Yes | What this skill does. Visible to AI clients. |

## Skill File Format

Each skill is a `.mjs` file that exports a `skill` object:

```javascript
const content = `
## Instructions

You are performing a comprehensive smart contract audit.

### Step 1: Retrieve ABI
Call {{tool:getContractAbi}} with the provided {{input:address}}.
Parse the ABI to identify all public functions, events, and modifiers.

### Step 2: Retrieve Source Code
Call {{tool:getSourceCode}} with the same {{input:address}}.
Analyze the Solidity source for:
- Reentrancy vulnerabilities
- Access control patterns
- Gas optimization opportunities

### Step 3: Cross-Reference
Compare the ABI with the source code to verify:
- All public functions are documented
- Event emissions match expected patterns
- Modifier usage is consistent

### Step 4: Report
Produce a Markdown report with:
- Function summary table
- Security findings (Critical / Warning / Info)
- Gas optimization suggestions
`

export const skill = {
    name: 'full-contract-audit',
    version: 'flowmcp-skill/1.0.0',
    description: 'Retrieve ABI and source code for a comprehensive contract audit.',
    requires: {
        tools: [ 'getContractAbi', 'getSourceCode' ],
        resources: [],
        external: []
    },
    input: [
        { key: 'address', type: 'string', description: 'Ethereum contract address (0x...)', required: true }
    ],
    output: 'Markdown report with ABI summary, security findings, and optimization suggestions.',
    content
}
```

## Skill Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Must match the `name` in the schema's `skills` array entry. |
| `version` | `string` | Yes | Must be `'flowmcp-skill/1.0.0'`. |
| `description` | `string` | Yes | What this skill does. |
| `requires` | `object` | Yes | Dependencies: `tools`, `resources`, and `external` arrays. |
| `input` | `array` | No | User-provided input parameters. |
| `output` | `string` | No | Description of what the skill produces. |
| `content` | `string` | Yes | The instruction text with placeholders. |

### `requires` Object

| Field | Type | Description |
|-------|------|-------------|
| `tools` | `string[]` | Tool names from the schema that this skill uses. Must match tool names in `main.tools`. |
| `resources` | `string[]` | Resource names from the schema that this skill uses. Must match names in `main.resources`. |
| `external` | `string[]` | External capabilities not provided by the schema (for documentation purposes). |

### `input` Array

Each input parameter:

| Field | Type | Description |
|-------|------|-------------|
| `key` | `string` | Parameter name (camelCase). Referenced in content as `{{input:key}}`. |
| `type` | `string` | Must be `string`, `number`, or `boolean`. |
| `description` | `string` | What this input parameter is for. |
| `required` | `boolean` | Whether the user must provide this value. |

## Placeholder System

The `content` field supports four types of placeholders:

| Placeholder | Syntax | Resolves To | Example |
|-------------|--------|-------------|---------|
| Tool reference | `{{tool:name}}` | Tool name from `requires.tools` | `{{tool:getContractAbi}}` |
| Resource reference | `{{resource:name}}` | Resource name from `requires.resources` | `{{resource:verifiedContracts}}` |
| Skill reference | `{{skill:name}}` | Another skill in the same schema | `{{skill:quick-check}}` |
| Input reference | `{{input:key}}` | User-provided input value | `{{input:address}}` |

### Placeholder Rules

1. `{{tool:x}}` — `x` should be listed in `requires.tools`
2. `{{resource:x}}` — `x` should be listed in `requires.resources`
3. `{{skill:x}}` — `x` must reference another skill in the same schema (no circular references)
4. `{{input:x}}` — `x` should match an `input[].key`

Unresolved placeholders produce validation warnings (not errors), except for `{{skill:x}}` which must resolve.

## Versioning

All skills use the version string `'flowmcp-skill/1.0.0'`. This version identifies the skill format, not the skill's content version. When the skill format changes, this version will be updated.

```javascript
version: 'flowmcp-skill/1.0.0'
```

## Constraints

| Constraint | Value | Rationale |
|------------|-------|-----------|
| Max skills per schema | 4 | Skills compose tools; keep schemas focused |
| Skill name pattern | `^[a-z][a-z0-9-]*$` | Lowercase with hyphens |
| Skill file extension | `.mjs` | ES module format |
| Version | `flowmcp-skill/1.0.0` | Fixed for v4.0.0 |
| Content | Non-empty string | Must contain instructions |
| No circular references | Via `{{skill:x}}` | Prevents infinite loops |

## Complete Example

A schema with tools, a resource, and a skill:

```javascript
// etherscan-contracts.mjs
export const main = {
    namespace: 'etherscan',
    name: 'ContractExplorer',
    description: 'Explore verified smart contracts with API tools and local data',
    version: '3.0.0',
    root: 'https://api.etherscan.io',
    requiredServerParams: [ 'ETHERSCAN_API_KEY' ],
    requiredLibraries: [],
    headers: {},
    tools: {
        getContractAbi: {
            method: 'GET',
            path: '/api',
            description: 'Returns the ABI of a verified smart contract',
            parameters: [ /* ... */ ]
        },
        getSourceCode: {
            method: 'GET',
            path: '/api',
            description: 'Returns the Solidity source code of a verified contract',
            parameters: [ /* ... */ ]
        }
    },
    skills: [
        {
            name: 'full-contract-audit',
            file: 'full-contract-audit.mjs',
            description: 'Comprehensive contract audit using ABI, source code, and local metadata'
        }
    ]
}
```

## Validation Rules

Skills are validated by rules SKL001-SKL025. Key rules include:

| Code | Rule |
|------|------|
| SKL002 | Maximum 4 skills per schema |
| SKL005 | Skill file must end in `.mjs` |
| SKL008 | `skill.name` must match the name in `main.skills` entry |
| SKL009 | Version must be `'flowmcp-skill/1.0.0'` |
| SKL013 | `requires.tools` entries must match tool names in schema |
| SKL014 | `requires.resources` entries must match resource names in schema |
| SKL025 | No circular skill references via `{{skill:x}}` placeholders |

See [Validation Rules](/docs/specification/validation-rules/) for the complete list.

## Group-Level Skills vs Schema-Level Skills

FlowMCP has two types of skills:

| Type | Location | Format | Purpose |
|------|----------|--------|---------|
| **Schema-level** | `.mjs` files alongside schema | `export const skill` object | Distributed with the schema, composing that schema's tools |
| **Group-level** | `.md` files in `.flowmcp/skills/` | Markdown with sections | Project-specific workflows across multiple schemas |

Schema-level skills (this page) are part of the schema and travel with it. Group-level skills (see [Groups & Skills](/docs/specification/groups-prompts/)) are project-local and can reference tools from any schema in the group.
