---
title: "Resources"
description: "FlowMCP v4.0.0 resources — SQLite-based read-only data access with prepared statements and SQL security enforcement"
---
<!-- PAGEFIND-META-START -->
<span style="display:none" data-pagefind-meta="section">Specification</span>
<!-- PAGEFIND-META-END -->

Resources provide fast, local read-only data access through SQLite databases. Unlike tools that make HTTP requests to external APIs, resources query local `.db` files using `sql.js` (a pure JavaScript/WASM SQLite implementation). Resources are the second MCP primitive supported by FlowMCP v4.0.0.

:::note
Resources are optional. Most schemas only need tools. Add resources when your schema benefits from fast local data lookups that do not require network calls.
:::

## When to Use Resources

| Use Case | Tool or Resource? |
|----------|-------------------|
| Fetch live data from an API | Tool |
| Look up static reference data (chain IDs, token lists) | Resource |
| Query historical data that changes infrequently | Resource |
| Perform calculations on cached data | Resource |
| Call external services | Tool |

Resources are ideal for data that is bundled with the schema and updated only when the schema version changes.

## Schema Format

Resources are declared in the `resources` key of the `main` export:

```javascript
export const main = {
    namespace: 'etherscan',
    name: 'ContractExplorer',
    version: '4.0.0',
    root: 'https://api.etherscan.io',
    tools: { /* ... */ },
    resources: {
        verifiedContracts: {
            description: 'Lookup verified contracts by address or name',
            source: 'sqlite',
            database: 'contracts.db',
            queries: {
                byAddress: {
                    description: 'Find a verified contract by its address',
                    sql: 'SELECT name, compiler, optimization, source_code FROM contracts WHERE address = ?',
                    parameters: [
                        { key: 'address', type: 'string', description: 'Contract address (0x...)', required: true }
                    ]
                },
                byName: {
                    description: 'Search contracts by name pattern',
                    sql: 'SELECT address, name, compiler FROM contracts WHERE name LIKE ? LIMIT 20',
                    parameters: [
                        { key: 'pattern', type: 'string', description: 'Name search pattern (use % as wildcard)', required: true }
                    ]
                }
            }
        }
    }
}
```

## Resource Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | `string` | Yes | What data this resource provides. Visible to AI clients. |
| `source` | `string` | Yes | Must be `'sqlite'`. Only SQLite is supported in v4.0.0. |
| `database` | `string` | Yes | Path to the `.db` file, relative to the schema file. Must end in `.db`. |
| `queries` | `object` | Yes | Named queries with SQL and parameters. Max 4 queries per resource. |

## Query Fields

Each query is a named entry in the `queries` object:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | `string` | Yes | What this query returns. Used by AI clients for query selection. |
| `sql` | `string` | Yes | SQL query string with `?` placeholders. Must start with `SELECT`. |
| `parameters` | `array` | No | Query parameters corresponding to `?` placeholders. Can be empty `[]`. |
| `tests` | `array` | No | Test cases with example parameter values. |

## Query Parameters

Resource query parameters use a simplified flat format (no `position`/`z` blocks):

```javascript
parameters: [
    { key: 'address', type: 'string', description: 'Contract address', required: true },
    { key: 'limit', type: 'number', description: 'Max results', required: false }
]
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | `string` | Yes | Parameter name (camelCase). Maps to a `?` placeholder in order. |
| `type` | `string` | Yes | Must be `string`, `number`, or `boolean`. |
| `description` | `string` | Yes | What this parameter controls. |
| `required` | `boolean` | Yes | Whether the parameter must be provided. |

The number of parameters must match the number of `?` placeholders in the SQL query.

## SQL Security Enforcement

Resources enforce strict read-only access. The following patterns are **blocked** at validation time:

| Blocked Pattern | Reason |
|-----------------|--------|
| `INSERT`, `UPDATE`, `DELETE`, `DROP` | Write operations not allowed |
| `CREATE TABLE`, `ALTER TABLE` | Schema modifications not allowed |
| `ATTACH DATABASE` | Cross-database access not allowed |
| `LOAD_EXTENSION` | Extension loading not allowed |
| `PRAGMA` (most) | Configuration changes not allowed |
| String interpolation | All values must use `?` placeholders |
| Subqueries with writes | Nested write operations not allowed |

```javascript
// Valid — SELECT with prepared statement
sql: 'SELECT * FROM contracts WHERE address = ?'

// Valid — JOIN query
sql: 'SELECT c.name, t.symbol FROM contracts c JOIN tokens t ON c.token_id = t.id WHERE c.chain_id = ?'

// Invalid — not a SELECT statement
sql: 'INSERT INTO contracts VALUES (?)'

// Invalid — uses string interpolation instead of ?
sql: `SELECT * FROM contracts WHERE address = '${address}'`

// Invalid — blocked pattern
sql: 'ATTACH DATABASE "other.db" AS other'
```

:::caution
All SQL queries must start with `SELECT` and use `?` placeholders for all dynamic values. String interpolation, template literals, and concatenation in SQL strings are forbidden.
:::

## Runtime

Resources use `sql.js`, a pure JavaScript/WASM implementation of SQLite. This means:

- **No native dependencies** — works on any platform that supports WASM
- **No SQLite installation required** — everything is bundled
- **Read-only mode** — databases are opened in read-only mode by default
- **Memory-safe** — each query runs in an isolated context

## Constraints

| Constraint | Value | Rationale |
|------------|-------|-----------|
| Max resources per schema | 2 | Resources are supplementary, not primary output |
| Max queries per resource | 4 | Keeps resource scope focused |
| Source type | `sqlite` only | Future versions may add other sources |
| Database file extension | `.db` | Standard SQLite extension |
| SQL must start with | `SELECT` | Read-only enforcement |
| Parameter placeholders | `?` only | Prevents SQL injection |
| Parameter types | `string`, `number`, `boolean` | Simple types only |

## Validation Rules

Resources are validated by rules RES001-RES023. Key rules include:

| Code | Rule |
|------|------|
| RES003 | Maximum 2 resources per schema |
| RES005 | Source must be `'sqlite'` |
| RES006 | Database path must end in `.db` |
| RES008 | Maximum 4 queries per resource |
| RES012 | SQL must start with `SELECT` |
| RES013 | SQL must not contain blocked patterns |
| RES014 | SQL must use `?` placeholders |
| RES015 | Placeholder count must match parameter count |

See [Validation Rules](/specification/validation-rules/) for the complete list.
