---
title: "Parameters"
description: "FlowMCP v4.0.0 parameter format — position block, Z block validation, shared list interpolation, and API key injection"
---

Each parameter in a FlowMCP tool describes **where** a value is placed in the API request (`position`) and **how** it is validated (`z`). Both blocks are required.

:::note
This page covers parameters from the [formal specification](https://github.com/FlowMCP/flowmcp-spec). See [Shared Lists](/docs/specification/shared-lists/) for list interpolation details.
:::

## Parameter Structure

```javascript
{
    position: {
        key: 'address',
        value: '{{USER_PARAM}}',
        location: 'query'
    },
    z: {
        primitive: 'string()',
        options: [ 'min(42)', 'max(42)' ]
    }
}
```

## Position Block

The `position` block controls where the parameter's value is placed in the HTTP request.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | `string` | Yes | Parameter name. For user-facing parameters, this is the input field name exposed to the AI client. |
| `value` | `string` | Yes | `{{USER_PARAM}}` for user input, `{{SERVER_PARAM:KEY_NAME}}` for server params, or a fixed string. |
| `location` | `string` | Yes | Where the value is placed: `insert`, `query`, or `body`. |

### Location Types

| Location | Description | Example |
|----------|-------------|---------|
| `insert` | Inserted into the URL path at the `{{key}}` placeholder | `/api/v1/{{address}}/txs` becomes `/api/v1/0xABC.../txs` |
| `query` | Added as a URL query parameter | `?address=0xABC...&module=contract` |
| `body` | Added to the JSON request body | `{ "address": "0xABC..." }` |

### Location Rules

1. **`insert` parameters** require a matching `{{key}}` placeholder in the tool's `path`.
2. **`query` parameters** are appended to the URL in array order.
3. **`body` parameters** are only valid for `POST` and `PUT` tools. A `body` parameter on a `GET` or `DELETE` tool causes a load-time error.
4. **Multiple locations** in the same tool are valid.

### Value Types

| Value Pattern | Description | Visible to User |
|---------------|-------------|-----------------|
| `{{USER_PARAM}}` | Value provided by the user at call-time | Yes |
| `{{SERVER_PARAM:KEY_NAME}}` | Value injected from server environment | No |
| Any other string | Fixed value, sent automatically | No |

## Z Block (Validation)

The `z` block defines validation constraints enforced before the API request is made. The name references Zod, the validation library used by the runtime.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `primitive` | `string` | Yes | Base type declaration with optional inline values. |
| `options` | `string[]` | Yes | Array of validation constraints. Can be empty `[]`. |

### Primitive Types

| Primitive | Description | Zod Equivalent | Example |
|-----------|-------------|----------------|---------|
| `string()` | Any string value | `z.string()` | `'string()'` |
| `number()` | Numeric value | `z.number()` | `'number()'` |
| `boolean()` | True or false | `z.boolean()` | `'boolean()'` |
| `enum(A,B,C)` | One of the listed values | `z.enum(['A','B','C'])` | `'enum(mainnet,testnet)'` |
| `array()` | Array of values | `z.array()` | `'array()'` |
| `object()` | Nested object | `z.object()` | `'object()'` |

:::caution
Enum values are comma-separated with **no spaces** around commas. `enum(GET,POST)` is valid; `enum(GET, POST)` is not. At least one value is required.
:::

### Validation Options

Options are applied in array order after the primitive type check:

| Option | Description | Applies To | Example |
|--------|-------------|------------|---------|
| `min(n)` | Minimum value or minimum length | `number`, `string` | `'min(1)'` |
| `max(n)` | Maximum value or maximum length | `number`, `string` | `'max(100)'` |
| `length(n)` | Exact length or exact item count | `string`, `array` | `'length(42)'` |
| `optional()` | Parameter is not required | all | `'optional()'` |
| `default(value)` | Default value when omitted (implies `optional()`) | all | `'default(100)'` |

**Option rules:**
- `min()` and `max()` constrain the numeric value for `number()`, or string length for `string()`.
- Multiple options combine with AND logic: `[ 'min(1)', 'max(100)' ]` means value must be >= 1 AND <= 100.
- Regular expressions are intentionally excluded — type-level validation with `min()`/`max()`/`length()` covers most use cases.

## Resource Parameters

Resource query parameters use a simplified format compared to tool parameters. Since resources are local SQLite queries (not HTTP requests), there is no `location` field in the `position` block:

```javascript
resources: {
    verifiedContracts: {
        source: 'sqlite',
        database: 'contracts.db',
        queries: {
            byAddress: {
                description: 'Find contract by address',
                sql: 'SELECT * FROM contracts WHERE address = ?',
                parameters: [
                    { key: 'address', type: 'string', description: 'Contract address', required: true }
                ]
            }
        }
    }
}
```

Resource parameters have a flat structure with `key`, `type`, `description`, and `required` fields. They do not use the `position`/`z` blocks because there is no HTTP request to construct.

## Skill Input Format

Skills define their input parameters with a similar flat format:

```javascript
input: [
    { key: 'address', type: 'string', description: 'Ethereum contract address', required: true },
    { key: 'chain', type: 'string', description: 'Chain name', required: false }
]
```

Skill inputs are used as template variables in the skill content via `{{input:key}}` placeholders.

## Shared List Interpolation

When a parameter's enum values come from a shared list, use the `{{listName:fieldName}}` syntax inside `enum()`:

```javascript
{
    position: {
        key: 'chainName',
        value: '{{USER_PARAM}}',
        location: 'query'
    },
    z: {
        primitive: 'enum({{evmChains:etherscanAlias}})',
        options: []
    }
}
```

At load-time, the runtime resolves `{{evmChains:etherscanAlias}}` by:

1. Finding the shared list named `evmChains` (declared in `main.sharedLists`)
2. Applying any filter defined in the shared list reference
3. Extracting the `etherscanAlias` field from each entry
4. Replacing the placeholder with comma-separated values

The result at runtime is equivalent to:

```javascript
primitive: 'enum(ETHEREUM_MAINNET,POLYGON_MAINNET,ARBITRUM_MAINNET,OPTIMISM_MAINNET)'
```

### Interpolation Rules

1. `{{listName:fieldName}}` is **only allowed inside `enum()`**. Using it in other primitives is an error.
2. The referenced list must be declared in `main.sharedLists`.
3. If the shared list reference has a `filter`, only matching entries are used.
4. The `fieldName` must exist in the list's `meta.fields`.
5. Interpolation happens at **load-time**, not call-time. Shared list updates require a schema reload.
6. **Mixed static and interpolated values** are allowed: `enum(custom,{{evmChains:etherscanAlias}})`.

## Fixed Parameters

Parameters with a fixed `value` (not `{{USER_PARAM}}` and not `{{SERVER_PARAM:...}}`) are invisible to the user and sent automatically:

```javascript
{
    position: {
        key: 'module',
        value: 'contract',
        location: 'query'
    },
    z: {
        primitive: 'string()',
        options: []
    }
}
```

Fixed parameters are common for APIs that use query parameters for routing (like Etherscan's `module` and `action` parameters).

:::tip
Fixed parameters let a single `root` + `path` combination serve multiple tools differentiated by fixed query values.
:::

## API Key Injection

API keys are injected via the `{{SERVER_PARAM:KEY_NAME}}` syntax:

```javascript
{
    position: {
        key: 'apikey',
        value: '{{SERVER_PARAM:ETHERSCAN_API_KEY}}',
        location: 'query'
    },
    z: {
        primitive: 'string()',
        options: []
    }
}
```

### Injection Rules

1. The `KEY_NAME` must be declared in `main.requiredServerParams`.
2. Server parameters are **invisible to the AI client**.
3. The runtime resolves the value from the environment variable. If unset, the tool is hidden.
4. Server parameter values are **never logged**.

## Parameter Visibility Summary

| Value Pattern | Visible to AI Client | Appears in Input Schema | Source |
|---------------|---------------------|------------------------|--------|
| `{{USER_PARAM}}` | Yes | Yes | User provides at call-time |
| `{{SERVER_PARAM:KEY}}` | No | No | Environment variable |
| Fixed string | No | No | Hardcoded in schema |

## Complete Examples

### Query Parameter with Length Validation

```javascript
{
    position: { key: 'contractAddress', value: '{{USER_PARAM}}', location: 'query' },
    z: { primitive: 'string()', options: [ 'min(42)', 'max(42)' ] }
}
```

### Enum with Shared List and Default

```javascript
{
    position: { key: 'chain', value: '{{USER_PARAM}}', location: 'query' },
    z: { primitive: 'enum({{evmChains:slug}})', options: [ 'default(ethereum)' ] }
}
```

### Body Parameter with Optional Limit

```javascript
[
    {
        position: { key: 'version', value: '2', location: 'body' },
        z: { primitive: 'string()', options: [] }
    },
    {
        position: { key: 'query', value: '{{USER_PARAM}}', location: 'body' },
        z: { primitive: 'object()', options: [] }
    },
    {
        position: { key: 'limit', value: '{{USER_PARAM}}', location: 'body' },
        z: { primitive: 'number()', options: [ 'optional()', 'default(100)', 'min(1)', 'max(1000)' ] }
    }
]
```
