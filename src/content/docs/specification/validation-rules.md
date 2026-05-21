---
title: "Validation Rules"
description: "FlowMCP v4.0.0 validation rules — rules across categories with severity levels and error codes"
---
<!-- PAGEFIND-META-START -->
<span style="display:none" data-pagefind-meta="section">Specification</span>
<!-- PAGEFIND-META-END -->

FlowMCP enforces validation rules when loading schemas, shared lists, groups, resources, and skills. Each rule has a code, severity level, and description. Run validation with `flowmcp validate <schema-path>`.

:::note
This page covers all validation rules from the [formal specification](https://github.com/FlowMCP/flowmcp-spec). Rules are enforced at load-time and during CLI validation.
:::

## Severity Levels

| Severity | Description | Effect |
|----------|-------------|--------|
| `error` | Must fix before use | Schema cannot be loaded |
| `warning` | Should fix | Schema loads with warnings |
| `info` | Nice to have | Informational only |

## Validation Output

```bash
flowmcp validate etherscan/contracts.mjs
```

```bash
# Errors Found
  VAL014 error   main.version: Must match ^3\.\d+\.\d+$ (found "2.0.0")
  VAL031 error   tools: Maximum 8 tools exceeded (found 10)
  VAL036 warning getContractAbi: output schema is recommended
  TST001 warning getContractAbi: No tests found

  2 errors, 2 warnings
  Schema cannot be loaded (has errors)

# All Valid
  0 errors, 0 warnings
  Schema is valid
```

## Rules by Category

### Schema Structure Rules (VAL001-VAL005)

| Code | Severity | Rule |
|------|----------|------|
| VAL001 | error | Schema must export `main` as named export |
| VAL002 | error | `main` must be an object |
| VAL003 | error | `main` must not contain unknown fields |
| VAL004 | error | `handlers` (if exported) must be a function |
| VAL005 | warning | `handlers` function must return an object with keys matching tool names |

### Main Block — Required Fields (VAL010-VAL016)

| Code | Severity | Rule |
|------|----------|------|
| VAL010 | error | `main.namespace` is required and must be a string |
| VAL011 | error | `main.namespace` must match `^[a-z]+$` |
| VAL012 | error | `main.name` is required and must be a string |
| VAL013 | error | `main.description` is required and must be a string |
| VAL014 | error | `main.version` is required and must match `^3\.\d+\.\d+$` |
| VAL015 | error | `main.root` is required and must be a valid URL |
| VAL016 | error | `main.tools` is required and must be a non-empty object |

### Main Block — Optional Fields (VAL020-VAL026)

| Code | Severity | Rule |
|------|----------|------|
| VAL020 | error | `main.docs` (if present) must be an array of strings |
| VAL021 | error | `main.tags` (if present) must be an array of strings |
| VAL022 | error | `main.requiredServerParams` (if present) must be an array of strings |
| VAL023 | error | `main.headers` (if present) must be a plain object |
| VAL024 | error | `main.sharedLists` (if present) must be an array of objects |
| VAL025 | error | `main.requiredLibraries` (if present) must be an array of strings |
| VAL026 | error | Each entry in `requiredLibraries` must be on the runtime allowlist |

### Tool Rules (VAL030-VAL037)

| Code | Severity | Rule |
|------|----------|------|
| VAL030 | error | Tool name must match `^[a-z][a-zA-Z0-9]*$` |
| VAL031 | error | Maximum 8 tools per schema |
| VAL032 | error | `tool.method` is required and must be `GET`, `POST`, `PUT`, or `DELETE` |
| VAL033 | error | `tool.path` is required and must be a string starting with `/` |
| VAL034 | error | `tool.description` is required and must be a string |
| VAL035 | error | `tool.parameters` is required and must be an array |
| VAL036 | warning | `tool.output` is recommended for new schemas |
| VAL037 | info | `tool.async` is a reserved field (not executed in v4.0.0) |

### Parameter Rules (VAL040-VAL050)

| Code | Severity | Rule |
|------|----------|------|
| VAL040 | error | Each parameter must have `position` and `z` objects |
| VAL041 | error | `position.key` is required and must be a string |
| VAL042 | error | `position.value` is required and must be a string |
| VAL043 | error | `position.location` must be `insert`, `query`, or `body` |
| VAL044 | error | `z.primitive` is required and must be a valid primitive type |
| VAL045 | error | `z.options` must be an array of strings |
| VAL046 | error | `enum()` values must not be empty |
| VAL047 | error | Shared list interpolation `{{listName:fieldName}}` is only allowed in `enum()` |
| VAL048 | error | Referenced shared list must be declared in `main.sharedLists` |
| VAL049 | error | Referenced field must exist in the shared list's `meta.fields` |
| VAL050 | error | `insert` parameters must have a corresponding `{{key}}` in `tool.path` |

### Output Schema Rules (VAL060-VAL065)

| Code | Severity | Rule |
|------|----------|------|
| VAL060 | error | `output.mimeType` must be a supported MIME type |
| VAL061 | error | `output.schema` must be a valid schema definition |
| VAL062 | error | `output.schema.type` must match MIME type expectations |
| VAL063 | warning | Nested depth should not exceed 4 levels |
| VAL064 | error | `properties` is only valid when `type` is `object` |
| VAL065 | error | `items` is only valid when `type` is `array` |

### Shared List Reference Rules (VAL070-VAL075)

| Code | Severity | Rule |
|------|----------|------|
| VAL070 | error | `sharedLists[].ref` is required and must be a string |
| VAL071 | error | `sharedLists[].version` is required and must be semver |
| VAL072 | error | Referenced list must exist in the list registry |
| VAL073 | error | Referenced list version must match or be compatible |
| VAL074 | error | `filter` (if present) must have valid `key` field |
| VAL075 | warning | Unused shared list reference (not used by any parameter or handler) |

### Security Rules (SEC001-SEC005)

| Code | Severity | Rule |
|------|----------|------|
| SEC001 | error | Forbidden pattern found in schema file — no `import` statements allowed |
| SEC002 | error | `main` block contains non-serializable value (function, symbol, etc.) |
| SEC003 | error | Shared list file contains forbidden pattern |
| SEC004 | error | Shared list file contains executable code |
| SEC005 | error | `requiredLibraries` contains unapproved package |

See [Security Model](/specification/security/) for the complete list of forbidden patterns and error codes.

### Shared List Validation Rules (LST001-LST011)

| Code | Severity | Rule |
|------|----------|------|
| LST001 | error | List must export `list` as named export |
| LST002 | error | `list.meta.name` is required and must be unique |
| LST003 | error | `list.meta.version` is required and must be semver |
| LST004 | error | `list.meta.fields` is required and must be a non-empty array |
| LST005 | error | Each field must have `key`, `type`, and `description` |
| LST006 | error | `list.entries` is required and must be a non-empty array |
| LST007 | error | Each entry must have all required fields |
| LST008 | error | Entry field types must match `meta.fields` type declarations |
| LST009 | error | `dependsOn` references must resolve to existing lists |
| LST010 | error | Circular dependencies are forbidden |
| LST011 | error | Maximum dependency depth: 3 levels |

### Group Validation Rules (GRP001-GRP006)

| Code | Severity | Rule |
|------|----------|------|
| GRP001 | error | Group name must match `^[a-z][a-z0-9-]*$` |
| GRP002 | error | Maximum 50 tools per group |
| GRP003 | error | Tool reference must follow `namespace/file::type::name` format |
| GRP004 | error | All referenced tools must be resolvable |
| GRP005 | error | Duplicate tool references are forbidden |
| GRP006 | error | Group hash must match calculated hash |

### Test Requirements (TST001-TST008)

| Code | Severity | Rule |
|------|----------|------|
| TST001 | error | Each tool must have at least 1 test |
| TST002 | error | Each test must have a `_description` field of type string |
| TST003 | error | Each test must provide values for all required `{{USER_PARAM}}` parameters |
| TST004 | error | Test parameter values must pass the corresponding `z` validation |
| TST005 | error | Test objects must be JSON-serializable |
| TST006 | error | Test objects must only contain keys matching `{{USER_PARAM}}` parameter keys or `_description` |
| TST007 | warning | Tools with enum or chain parameters should test multiple enum values |
| TST008 | info | Consider adding tests that demonstrate optional parameter usage |

See [Tests](/specification/route-tests/) for the complete test specification.

### Skill Validation Rules (PRM001-PRM008)

| Code | Severity | Rule |
|------|----------|------|
| PRM001 | error | Skill name must match `^[a-z][a-z0-9-]*$` |
| PRM002 | error | File must exist at declared path |
| PRM003 | error | File must have `# Title` (first line) |
| PRM004 | error | File must have `## Workflow` section |
| PRM005 | warning | Tool references must resolve in group |
| PRM006 | error | Group must have at least one tool |
| PRM007 | error | No duplicate skill names within a group |
| PRM008 | error | Filename must match skill name |

See [Groups & Skills](/specification/groups-prompts/) for skill format details.

### Resource Validation Rules (RES001-RES023)

| Code | Severity | Rule |
|------|----------|------|
| RES001 | error | `resources` (if present) must be an object |
| RES002 | error | Resource name must match `^[a-z][a-zA-Z0-9]*$` |
| RES003 | error | Maximum 2 resources per schema |
| RES004 | error | `resource.description` is required and must be a string |
| RES005 | error | `resource.source` must be `'sqlite'` |
| RES006 | error | `resource.database` is required and must be a string ending in `.db` |
| RES007 | error | `resource.queries` is required and must be a non-empty object |
| RES008 | error | Maximum 4 queries per resource |
| RES009 | error | Query name must match `^[a-z][a-zA-Z0-9]*$` |
| RES010 | error | `query.description` is required and must be a string |
| RES011 | error | `query.sql` is required and must be a string |
| RES012 | error | SQL must start with `SELECT` (read-only enforcement) |
| RES013 | error | SQL must not contain blocked patterns |
| RES014 | error | SQL must use `?` placeholders (no string interpolation) |
| RES015 | error | Number of `?` placeholders must match number of parameters |
| RES016 | error | `query.parameters` (if present) must be an array |
| RES017 | error | Each query parameter must have `key`, `type`, and `description` |
| RES018 | error | Query parameter `type` must be `string`, `number`, or `boolean` |
| RES019 | error | Query parameter `key` must match `^[a-z][a-zA-Z0-9]*$` |
| RES020 | error | No duplicate parameter keys within a query |
| RES021 | error | Database file must exist at schema-relative path (runtime check) |
| RES022 | warning | Consider adding tests to resource queries |
| RES023 | error | SQL must not contain subqueries with write operations |

### Schema-Level Skill Validation Rules (SKL001-SKL025)

| Code | Severity | Rule |
|------|----------|------|
| SKL001 | error | `skills` (if present) must be an array |
| SKL002 | error | Maximum 4 skills per schema |
| SKL003 | error | Each skill entry must have `name`, `file`, and `description` |
| SKL004 | error | Skill `name` must match `^[a-z][a-z0-9-]*$` |
| SKL005 | error | Skill `file` must end in `.mjs` |
| SKL006 | error | Skill file must exist at schema-relative path |
| SKL007 | error | Skill file must export `skill` as named export |
| SKL008 | error | `skill.name` must match the `name` in main.skills entry |
| SKL009 | error | `skill.version` must be `'flowmcp-skill/1.0.0'` |
| SKL010 | error | `skill.description` is required and must be a string |
| SKL011 | error | `skill.content` is required and must be a non-empty string |
| SKL012 | error | `skill.requires` must be an object with `tools`, `resources`, and `external` arrays |
| SKL013 | error | Each `requires.tools` entry must match a tool name in the schema |
| SKL014 | error | Each `requires.resources` entry must match a resource name in the schema |
| SKL015 | error | `skill.input` (if present) must be an array |
| SKL016 | error | Each input must have `key`, `type`, `description`, and `required` fields |
| SKL017 | error | Input `key` must match `^[a-z][a-zA-Z0-9]*$` |
| SKL018 | error | Input `type` must be `string`, `number`, or `boolean` |
| SKL019 | error | No duplicate input keys within a skill |
| SKL020 | error | `skill.output` (if present) must be a string |
| SKL021 | warning | `{{tool:x}}` placeholders should reference tools in `requires.tools` |
| SKL022 | warning | `{{resource:x}}` placeholders should reference resources in `requires.resources` |
| SKL023 | warning | `{{input:x}}` placeholders should reference input keys |
| SKL024 | error | `{{skill:x}}` placeholders must reference other skills in the schema |
| SKL025 | error | No circular skill references via `{{skill:x}}` placeholders |

### Deprecation Rules (DEP001-DEP004)

| Code | Severity | Rule |
|------|----------|------|
| DEP001 | warning | `main.routes` is deprecated — use `main.tools` instead |
| DEP002 | info | Legacy `::routeName` format in groups — use `::tool::routeName` discriminator |
| DEP003 | warning | `prompts` key in groups.json — renamed to `skills` |
| DEP004 | info | `version: '2.x.x'` detected — run `flowmcp migrate` to upgrade |
