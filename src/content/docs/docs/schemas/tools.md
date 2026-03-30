---
title: Tools
description: "Define REST API endpoints as declarative MCP tools with parameters, validation, and handlers"
---

Tools wrap REST API endpoints. Each tool maps to one HTTP request. Schemas are `.mjs` files with two named exports: a static `main` block and an optional `handlers` factory function.

:::note
This page focuses on practical tool creation. See [Schema Format](/docs/specification/schema-format/) for the full specification and [Parameters](/docs/specification/parameters/) for parameter details.
:::

## Schema Structure

A schema file has two parts: the declarative `main` export that describes what tools do, and the optional `handlers` export that transforms requests and responses.

## The `main` Export

The `main` export is a static, JSON-serializable object. No functions, no dynamic values, no imports.

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `namespace` | `string` | Provider identifier, lowercase letters only (`/^[a-z]+$/`). |
| `name` | `string` | Schema name in PascalCase (e.g. `SmartContractExplorer`). |
| `description` | `string` | What this schema does, 1-2 sentences. |
| `version` | `string` | Must match `3.\d+.\d+` (semver, major must be `3`). |
| `root` | `string` | Base URL for all tools. Must start with `https://` (no trailing slash). |
| `tools` | `object` | Tool definitions. Keys are camelCase tool names. Maximum 8 tools. |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `docs` | `string[]` | Documentation URLs for the API provider. |
| `tags` | `string[]` | Categorization tags for tool discovery. |
| `requiredServerParams` | `string[]` | Environment variable names needed at runtime (e.g. API keys). |
| `requiredLibraries` | `string[]` | npm packages needed by handlers. |
| `headers` | `object` | Default HTTP headers applied to all tools. |
| `sharedLists` | `object[]` | Shared list references for dynamic enum values. See [Shared Lists](/docs/specification/shared-lists/). |

```javascript
export const main = {
    namespace: 'etherscan',
    name: 'SmartContractExplorer',
    description: 'Explore verified smart contracts on EVM chains via Etherscan APIs',
    version: '3.0.0',
    root: 'https://api.etherscan.io',
    docs: [ 'https://docs.etherscan.io/' ],
    tags: [ 'ethereum', 'blockchain' ],
    requiredServerParams: [ 'ETHERSCAN_API_KEY' ],
    tools: {
        // tool definitions here
    }
}
```

## Tool Definition

Each key in `tools` is the tool name in camelCase. The tool name becomes part of the fully qualified MCP tool name.

### Tool Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `method` | `string` | Yes | HTTP method: `GET`, `POST`, `PUT`, `DELETE`. |
| `path` | `string` | Yes | URL path appended to `root`. May contain `{{key}}` placeholders. |
| `description` | `string` | Yes | What this tool does. Appears in the MCP tool description. |
| `parameters` | `array` | Yes | Input parameter definitions. Can be empty `[]`. |

### Path Templates

The path supports `{{key}}` placeholders that are replaced by `insert` parameters at call-time:

```javascript
// Static path
path: '/api'

// Single placeholder
path: '/api/v1/{{address}}/transactions'

// Multiple placeholders
path: '/api/v1/{{chainId}}/address/{{address}}/balances'
```

Every `{{key}}` placeholder must have a corresponding parameter with `location: 'insert'`.

## Parameters

Each parameter has two blocks: `position` (where the value goes) and `z` (how it is validated).

### Parameter Types

| Type | Description | Example |
|------|-------------|---------|
| `string()` | Any string value | `'string()'` |
| `number()` | Numeric value | `'number()'` |
| `boolean()` | True or false | `'boolean()'` |
| `enum(A,B,C)` | One of the listed values | `'enum(mainnet,testnet)'` |
| `array()` | Array of values | `'array()'` |

### Value Sources

| Pattern | Description | Visible to User |
|---------|-------------|-----------------|
| `{{USER_PARAM}}` | User provides the value at call-time | Yes |
| `{{SERVER_PARAM:KEY}}` | Injected from environment variable | No |
| Fixed string | Sent automatically with every request | No |

### Validation Options

| Option | Description | Example |
|--------|-------------|---------|
| `min(n)` | Minimum value or length | `'min(1)'` |
| `max(n)` | Maximum value or length | `'max(100)'` |
| `optional()` | Parameter is not required | `'optional()'` |
| `default(value)` | Default when omitted | `'default(100)'` |

```javascript
// User-provided address with length validation
{
    position: { key: 'address', value: '{{USER_PARAM}}', location: 'query' },
    z: { primitive: 'string()', options: [ 'min(42)', 'max(42)' ] }
}

// Fixed parameter (invisible to user)
{
    position: { key: 'module', value: 'contract', location: 'query' },
    z: { primitive: 'string()', options: [] }
}

// API key injected from environment
{
    position: { key: 'apikey', value: '{{SERVER_PARAM:ETHERSCAN_API_KEY}}', location: 'query' },
    z: { primitive: 'string()', options: [] }
}
```

:::tip
Fixed parameters are common for APIs like Etherscan that use query parameters for routing (`module=contract`, `action=getabi`). They let multiple tools share the same `root` + `path`.
:::

## Handlers

The optional `handlers` export is a factory function that receives injected dependencies and returns handler objects per tool.

```javascript
export const handlers = ( { sharedLists, libraries } ) => ({
    toolName: {
        preRequest: async ( { struct, payload } ) => {
            // modify the request before it is sent
            return { struct, payload }
        },
        postRequest: async ( { response, struct, payload } ) => {
            // transform the response after receiving it
            return { response }
        }
    }
})
```

### Injected Dependencies

| Parameter | Type | Description |
|-----------|------|-------------|
| `sharedLists` | `object` | Resolved shared list data, keyed by list name. Read-only (deep-frozen). |
| `libraries` | `object` | Loaded npm packages from `requiredLibraries`, keyed by package name. |

### Handler Types

| Handler | When | Input | Must Return |
|---------|------|-------|-------------|
| `preRequest` | Before the API call | `{ struct, payload }` | `{ struct, payload }` |
| `postRequest` | After the API call | `{ response, struct, payload }` | `{ response }` |

### Handler Rules

1. **Handlers are optional.** Tools without handlers make direct API calls.
2. **Zero import statements.** All dependencies come through the factory function.
3. **No restricted globals.** `fetch`, `fs`, `process`, `eval` are forbidden.
4. **Return shape must match.** `preRequest` returns `{ struct, payload }`. `postRequest` returns `{ response }`.

:::caution
Schema files must have zero `import` statements. All external dependencies are declared in `requiredLibraries` and injected at runtime.
:::

## Complete Example

A full Etherscan schema with two tools, API key injection, and a `postRequest` handler:

```javascript
export const main = {
    namespace: 'etherscan',
    name: 'SmartContractExplorer',
    description: 'Ethereum blockchain explorer API',
    version: '3.0.0',
    docs: [ 'https://docs.etherscan.io/' ],
    tags: [ 'ethereum', 'blockchain' ],
    root: 'https://api.etherscan.io',
    requiredServerParams: [ 'ETHERSCAN_API_KEY' ],
    headers: { 'Accept': 'application/json' },
    tools: {
        getContractAbi: {
            method: 'GET',
            path: '/api',
            description: 'Get the ABI of a verified smart contract',
            parameters: [
                {
                    position: { key: 'module', value: 'contract', location: 'query' },
                    z: { primitive: 'string()', options: [] }
                },
                {
                    position: { key: 'action', value: 'getabi', location: 'query' },
                    z: { primitive: 'string()', options: [] }
                },
                {
                    position: { key: 'address', value: '{{USER_PARAM}}', location: 'query' },
                    z: { primitive: 'string()', options: [ 'min(42)', 'max(42)' ] }
                },
                {
                    position: { key: 'apikey', value: '{{SERVER_PARAM:ETHERSCAN_API_KEY}}', location: 'query' },
                    z: { primitive: 'string()', options: [] }
                }
            ]
        },
        getSourceCode: {
            method: 'GET',
            path: '/api',
            description: 'Get the Solidity source code of a verified smart contract',
            parameters: [
                {
                    position: { key: 'module', value: 'contract', location: 'query' },
                    z: { primitive: 'string()', options: [] }
                },
                {
                    position: { key: 'action', value: 'getsourcecode', location: 'query' },
                    z: { primitive: 'string()', options: [] }
                },
                {
                    position: { key: 'address', value: '{{USER_PARAM}}', location: 'query' },
                    z: { primitive: 'string()', options: [ 'min(42)', 'max(42)' ] }
                },
                {
                    position: { key: 'apikey', value: '{{SERVER_PARAM:ETHERSCAN_API_KEY}}', location: 'query' },
                    z: { primitive: 'string()', options: [] }
                }
            ]
        }
    }
}

export const handlers = ( { sharedLists } ) => ({
    getContractAbi: {
        postRequest: async ( { response } ) => {
            return { response: JSON.parse( response['result'] ) }
        }
    },
    getSourceCode: {
        postRequest: async ( { response } ) => {
            const { result } = response
            const [ first ] = result
            const { SourceCode, ABI, ContractName, CompilerVersion, OptimizationUsed } = first

            return {
                response: {
                    contractName: ContractName,
                    compilerVersion: CompilerVersion,
                    optimizationUsed: OptimizationUsed === '1',
                    sourceCode: SourceCode,
                    abi: ABI
                }
            }
        }
    }
})
```

:::tip
This example demonstrates: fixed parameters (`module`, `action`), user parameters (`address`), server parameter injection (`apikey`), and `postRequest` handlers that flatten nested API responses into clean output.
:::

## Constraints

| Constraint | Value | Rationale |
|------------|-------|-----------|
| Max tools per schema | 8 | Keeps schemas focused. Split large APIs into multiple schema files. |
| Version major | `3` | Must match `3.\d+.\d+`. |
| Namespace pattern | `^[a-z]+$` | Letters only. No numbers, hyphens, or underscores. |
| Root URL protocol | `https://` | HTTP is not allowed. |
| Root URL trailing slash | Forbidden | `root` must not end with `/`. |
| Schema file imports | Zero | All dependencies are injected via the `handlers` factory. |
