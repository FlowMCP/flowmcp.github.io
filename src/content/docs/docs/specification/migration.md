---
title: "Migration Guide"
description: "FlowMCP migration guides — v1 to v2 and v2 to v3 upgrade instructions"
---

This guide covers migrating schemas between FlowMCP versions. Both migration paths are documented below.

:::note
The full migration specification is maintained at [github.com/FlowMCP/flowmcp-spec](https://github.com/FlowMCP/flowmcp-spec). This page provides a practical walkthrough.
:::

## v2 to v3 Migration

The v4.0.0 release renames `routes` to `tools` and adds two new MCP primitives: **Resources** (SQLite-based read-only data) and **Skills** (reusable AI agent instructions).

### What Changed

| v2 | v3 | Description |
|----|-----|-------------|
| `main.routes` | `main.tools` | Primary key rename — `routes` accepted as deprecated alias |
| `version: '2.0.0'` | `version: '3.0.0'` | Version field update |
| `namespace/file.mjs::routeName` | `namespace/file.mjs::tool::routeName` | Type discriminator in group references |
| `prompts` (in groups) | `skills` (in groups) | Group prompts renamed to group skills |
| — | `main.resources` | New: SQLite-based read-only data |
| — | `main.skills` | New: AI agent instruction files |
| — | `includeSchemaSkills` | New: Auto-include schema skills in groups |

### Automated Migration

```bash
# Migrate a single schema
flowmcp migrate ./schemas/coingecko/Ping.mjs

# Migrate all schemas in a directory
flowmcp migrate --all ./schemas/

# Preview changes without writing (dry run)
flowmcp migrate --dry-run ./schemas/coingecko/Ping.mjs
```

:::tip
Use `--dry-run` first to preview what changes will be made without modifying any files.
:::

### Manual Migration Steps

1. **Rename routes to tools** — The primary change: rename the `routes` key to `tools` and update `version: '3.0.0'`.

   ```javascript
   // Before (v2)
   export const main = {
       namespace: 'coingecko',
       version: '2.0.0',
       routes: { ping: { method: 'GET', path: '/ping', description: 'Check API status', parameters: [] } }
   }

   // After (v3)
   export const main = {
       namespace: 'coingecko',
       version: '3.0.0',
       tools: { ping: { method: 'GET', path: '/ping', description: 'Check API status', parameters: [] } }
   }
   ```

2. **Update version field** — Change `version: '2.0.0'` to `version: '3.0.0'`.

3. **Update group references** — If your project uses groups in `.flowmcp/groups.json`, add type discriminators:

   ```json
   // Before
   "tools": [ "etherscan/contracts.mjs::getContractAbi" ]

   // After
   "tools": [ "etherscan/contracts.mjs::tool::getContractAbi" ]
   ```

4. **Add resources (optional)** — If your schema benefits from local data lookups, see [Resources](/docs/specification/resources/).

5. **Add skills (optional)** — If your schema benefits from AI agent workflows, see [Skills](/docs/specification/skills/).

6. **Run validation** — `flowmcp validate <schema-path>`

### Deprecation Timeline

| Version | `routes` Behavior |
|---------|-------------------|
| **v4.0.0** | `routes` accepted as silent alias for `tools` |
| **v3.1.0** | `routes` accepted with loud deprecation warning |
| **v3.2.0** | `routes` rejected with error |

---

## v1 to v2 Migration

### Schema Categories

| Category | % of Schemas | Migration Effort | Description |
|----------|-------------|-----------------|-------------|
| **Pure declarative** | ~60% | Automatic | No handlers, no imports. |
| **With handlers** | ~30% | Semi-automatic | Has handlers but no imports. |
| **With imports** | ~10% | Manual review | Imports shared data that must become shared list references. |

### Migration Steps

1. **Wrap existing fields in main block** — The biggest structural change:

   ```javascript
   // Before (v1.2.0)
   export const schema = {
       namespace: 'etherscan',
       flowMCP: '1.2.0',
       root: 'https://api.etherscan.io/v2/api',
       routes: { /* ... */ },
       handlers: { /* ... */ }
   }

   // After (v2.0.0)
   export const main = {
       namespace: 'etherscan',
       version: '2.0.0',
       root: 'https://api.etherscan.io/v2/api',
       requiredLibraries: [],
       routes: { /* ... */ }
   }

   export const handlers = ( { sharedLists, libraries } ) => ({
       /* ... */
   })
   ```

2. **Update version field** — `flowMCP: '1.2.0'` becomes `version: '2.0.0'` inside `main`.

3. **Convert imports to shared list references**:

   ```javascript
   // Before (v1.2.0) — has import
   import { evmChains } from '../_shared/evm-chains.mjs'
   // ...handlers use evmChains directly

   // After (v2.0.0) — no import, uses injection
   export const main = {
       sharedLists: [ { ref: 'evmChains', version: '1.0.0' } ],
       // ...
   }
   export const handlers = ( { sharedLists } ) => ({
       toolName: {
           preRequest: async ( { struct, payload } ) => {
               const chain = sharedLists.evmChains.find( c => c.alias === payload.chainName )
               return { struct, payload }
           }
       }
   })
   ```

4. **Add output schemas (optional)** — New in v2.0.0. See [Output Schema](/docs/specification/output-schema/).

5. **Run validation** — `flowmcp validate <schema-path>`

### Common Migration Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `SEC001: Forbidden pattern "import"` | Import statement still present | Convert to `sharedLists` reference |
| `VAL003: "flowMCP" is not a valid field` | Old version field | Change to `version` inside `main` |
| `DEP001: main.routes is deprecated` | v2 schema on v3 runtime | Rename `routes` to `tools` |

### Migration Checklist

**v1 to v2:**
- [ ] Fields wrapped in `main` block
- [ ] `flowMCP: '1.2.0'` changed to `version: '2.0.0'` inside `main`
- [ ] `handlers` at top level (sibling of `main`)
- [ ] All `import` statements removed
- [ ] Imported data converted to `sharedLists` references
- [ ] `requiredLibraries` declared (can be empty `[]`)
- [ ] Full validation passes (`flowmcp validate`)

**v2 to v3:**
- [ ] `routes` renamed to `tools`
- [ ] `version` changed from `2.x.x` to `3.0.0`
- [ ] Group references updated with type discriminators (optional in v4.0.0)
- [ ] Full validation passes (`flowmcp validate`)
