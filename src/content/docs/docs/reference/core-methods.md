---
title: Core API Methods
description: Complete FlowMCP Core method reference
---

Complete reference for all public methods in `flowmcp-core`. Methods are organized by usage category. All methods are static.

```javascript
import { FlowMCP } from 'flowmcp-core'
```

:::note
FlowMCP Core exports both v3 (default) and legacy APIs. This reference covers the current v3 API. For v1 methods, import from `flowmcp-core/v1`.
:::

## Method Overview

| Method | Purpose | Returns |
|--------|---------|---------|
| `.loadSchema()` | Load and validate a schema file | `{ status, main, handlerMap }` |
| `.validateMain()` | Validate a main export against validation rules | `{ status, messages }` |
| `.scanSecurity()` | Run security scan on a schema file | `{ status, messages }` |
| `.fetch()` | Execute an API request for a tool | `{ status, dataAsString, messages }` |
| `.resolveSharedLists()` | Resolve shared list references | `{ sharedLists }` |
| `.interpolateEnum()` | Interpolate shared list values into enum templates | `{ result }` |
| `.loadLibraries()` | Load declared libraries from allowlist | `{ libraries }` |
| `.createHandlers()` | Create handler map from factory function | `{ handlerMap }` |
| `.detectLegacy()` | Detect if a module uses v1 format | `{ isLegacy, format }` |
| `.adaptLegacy()` | Convert a v1 schema to v2 format | `{ main, handlersFn, hasHandlers, warnings }` |
| `.getDefaultAllowlist()` | Get the default library allowlist | `{ allowlist }` |
| `.generateOutputSchema()` | Generate output schema from API response | `{ output }` |

---

## Schema Loading & Validation

### .loadSchema()

Loads a `.mjs` schema file, runs security scanning, validates the `main` export, resolves shared lists, loads declared libraries, creates the handler map, and processes any resources and skills. This is the primary entry point for working with schemas.

**Method**
```javascript
const result = await FlowMCP.loadSchema( { filePath, listsDir, allowlist } )
```

**Parameters**

| Key | Type | Description | Required |
|-----|------|-------------|----------|
| `filePath` | string | Absolute or relative path to the `.mjs` schema file | Yes |
| `listsDir` | string | Directory containing shared list files | No |
| `allowlist` | array | Allowed library names for handlers. Uses default if omitted | No |

**Example**
```javascript
import { FlowMCP } from 'flowmcp-core'

const { status, main, handlerMap } = await FlowMCP.loadSchema( {
    filePath: './schemas/coingecko-price.mjs'
} )

if( !status ) {
    console.error( 'Schema loading failed' )
}

// Use the loaded schema
const result = await FlowMCP.fetch( {
    main,
    handlerMap,
    userParams: { id: 'bitcoin' },
    serverParams: {},
    routeName: 'getPrice'
} )
```

**Returns**
```javascript
{
    status: true,          // false if loading, validation, or security scan failed
    main: { ... },         // The validated main export object (with tools, resources, skills)
    handlerMap: { ... }    // Tool-keyed handler functions (empty object if no handlers)
}
```

### .validateMain()

Validates a `main` export object against the FlowMCP specification. Runs validation rules across categories including structure, naming, parameters, security, output declarations, resources, and skills.

**Method**
```javascript
const { status, messages } = FlowMCP.validateMain( { main } )
```

**Parameters**

| Key | Type | Description | Required |
|-----|------|-------------|----------|
| `main` | object | The `main` export from a schema file. Accepts both `tools` and `routes` (deprecated alias) | Yes |

**Example**
```javascript
import { FlowMCP } from 'flowmcp-core'
import { main } from './schemas/coingecko-price.mjs'

const { status, messages } = FlowMCP.validateMain( { main } )

if( status ) {
    console.log( 'Schema is valid' )
} else {
    console.error( 'Validation failed:' )
    messages.forEach( ( msg ) => console.error( `  - ${msg}` ) )
}
```

**Returns**
```javascript
{
    status: true,      // true if all rules pass
    messages: []       // Array of error messages when status is false
}
```

:::tip
Use `validateMain()` during development to catch schema errors early. In production, use `loadSchema()` which includes validation as part of the full pipeline.
:::

### .scanSecurity()

Runs a static security scan on a schema file. Checks for forbidden patterns like `import` statements, `require()` calls, filesystem access, `eval()`, and other disallowed constructs.

**Method**
```javascript
const { status, messages } = await FlowMCP.scanSecurity( { filePath } )
```

**Parameters**

| Key | Type | Description | Required |
|-----|------|-------------|----------|
| `filePath` | string | Path to the `.mjs` schema file to scan | Yes |

**Example**
```javascript
import { FlowMCP } from 'flowmcp-core'

const { status, messages } = await FlowMCP.scanSecurity( {
    filePath: './schemas/my-schema.mjs'
} )

if( !status ) {
    console.error( 'Security violations found:' )
    messages.forEach( ( msg ) => console.error( `  - ${msg}` ) )
}
```

**Returns**
```javascript
{
    status: true,      // false if forbidden patterns are detected
    messages: []       // Descriptions of security violations
}
```

---

## Execution

### .fetch()

Executes an HTTP request for a specific tool using the loaded schema. Handles parameter substitution, URL construction, header injection, and optional pre/post-processing via handlers.

**Method**
```javascript
const result = await FlowMCP.fetch( { main, handlerMap, userParams, serverParams, routeName } )
```

**Parameters**

| Key | Type | Description | Required |
|-----|------|-------------|----------|
| `main` | object | The validated `main` export from a schema | Yes |
| `handlerMap` | object | Handler map from `loadSchema()` or `createHandlers()` | Yes |
| `userParams` | object | User-provided parameters (from AI client input) | Yes |
| `serverParams` | object | Server-side parameters (API keys, tokens) | Yes |
| `routeName` | string | Name of the tool to execute | Yes |

**Example**
```javascript
import { FlowMCP } from 'flowmcp-core'

const { status, main, handlerMap } = await FlowMCP.loadSchema( {
    filePath: './schemas/coingecko-price.mjs'
} )

const result = await FlowMCP.fetch( {
    main,
    handlerMap,
    userParams: { id: 'bitcoin', vs_currency: 'usd' },
    serverParams: {},
    routeName: 'getPrice'
} )

if( result.status ) {
    console.log( 'Response:', result.dataAsString )
} else {
    console.error( 'Request failed:', result.messages )
}
```

**Returns**
```javascript
{
    status: true,                              // false if request failed
    dataAsString: '{"bitcoin":{"usd":45000}}', // Response body as string
    messages: []                               // Error messages when status is false
}
```

:::caution
The `serverParams` object should contain API keys and secrets. These values are injected into headers and parameters at runtime but are never exposed to AI clients.
:::

---

## Shared Lists & Dependencies

### .resolveSharedLists()

Resolves shared list references from a directory of list files. Shared lists are reusable value collections (chain IDs, token symbols, protocol names) that schemas reference via `$listName` syntax in enum parameters.

**Method**
```javascript
const { sharedLists } = await FlowMCP.resolveSharedLists( { sharedListRefs, listsDir } )
```

**Parameters**

| Key | Type | Description | Required |
|-----|------|-------------|----------|
| `sharedListRefs` | array | Array of shared list reference strings from the schema | Yes |
| `listsDir` | string | Directory path containing shared list `.mjs` files | Yes |

**Example**
```javascript
import { FlowMCP } from 'flowmcp-core'

const { sharedLists } = await FlowMCP.resolveSharedLists( {
    sharedListRefs: [ 'evmChains', 'stablecoins' ],
    listsDir: './lists/'
} )

console.log( 'Resolved lists:', Object.keys( sharedLists ) )
// Output: ['evmChains', 'stablecoins']
```

**Returns**
```javascript
{
    sharedLists: {
        evmChains: [ 'ethereum', 'polygon', 'arbitrum', ... ],
        stablecoins: [ 'USDT', 'USDC', 'DAI', ... ]
    }
}
```

### .interpolateEnum()

Interpolates shared list values into an enum template string. Replaces `$listName` references with actual values from resolved shared lists.

**Method**
```javascript
const { result } = FlowMCP.interpolateEnum( { template, sharedLists } )
```

**Parameters**

| Key | Type | Description | Required |
|-----|------|-------------|----------|
| `template` | string | Enum template containing `$listName` references | Yes |
| `sharedLists` | object | Resolved shared lists from `resolveSharedLists()` | Yes |

**Example**
```javascript
import { FlowMCP } from 'flowmcp-core'

const sharedLists = {
    evmChains: [ 'ethereum', 'polygon', 'arbitrum' ]
}

const { result } = FlowMCP.interpolateEnum( {
    template: '$evmChains',
    sharedLists
} )

console.log( result )
// Output: ['ethereum', 'polygon', 'arbitrum']
```

**Returns**
```javascript
{
    result: [ 'ethereum', 'polygon', 'arbitrum' ]  // Resolved enum values
}
```

### .loadLibraries()

Loads npm packages declared in a schema's `requiredLibraries` field. Only packages on the allowlist can be loaded. This enforces the zero-import security model.

**Method**
```javascript
const { libraries } = await FlowMCP.loadLibraries( { requiredLibraries, allowlist } )
```

**Parameters**

| Key | Type | Description | Required |
|-----|------|-------------|----------|
| `requiredLibraries` | array | Library names declared in the schema | Yes |
| `allowlist` | array | Permitted library names. Use `getDefaultAllowlist()` for defaults | Yes |

**Example**
```javascript
import { FlowMCP } from 'flowmcp-core'

const { allowlist } = FlowMCP.getDefaultAllowlist()

const { libraries } = await FlowMCP.loadLibraries( {
    requiredLibraries: [ 'ethers' ],
    allowlist
} )

// libraries.ethers is now available for handler injection
```

**Returns**
```javascript
{
    libraries: {
        ethers: { ... }  // The loaded library module
    }
}
```

### .getDefaultAllowlist()

Returns the default library allowlist. These are the npm packages that handlers are permitted to use via dependency injection.

**Method**
```javascript
const { allowlist } = FlowMCP.getDefaultAllowlist()
```

**Parameters**

None.

**Example**
```javascript
import { FlowMCP } from 'flowmcp-core'

const { allowlist } = FlowMCP.getDefaultAllowlist()
console.log( 'Allowed libraries:', allowlist )
```

**Returns**
```javascript
{
    allowlist: [ 'ethers', 'viem', ... ]  // Array of permitted library names
}
```

---

## Handler Management

### .createHandlers()

Creates a handler map by invoking the `handlers` factory function with injected dependencies. The resulting map is keyed by tool name and contains `preProcess` and `postProcess` functions.

**Method**
```javascript
const { handlerMap } = FlowMCP.createHandlers( { handlersFn, sharedLists, libraries, routeNames } )
```

**Parameters**

| Key | Type | Description | Required |
|-----|------|-------------|----------|
| `handlersFn` | function | The `handlers` factory function from a schema | Yes |
| `sharedLists` | object | Resolved shared lists to inject | Yes |
| `libraries` | object | Loaded libraries to inject | Yes |
| `routeNames` | array | Expected tool names for validation | Yes |

**Example**
```javascript
import { FlowMCP } from 'flowmcp-core'
import { handlers } from './schemas/my-schema.mjs'

const { handlerMap } = FlowMCP.createHandlers( {
    handlersFn: handlers,
    sharedLists: { evmChains: [ 'ethereum', 'polygon' ] },
    libraries: {},
    routeNames: [ 'getPrice', 'getHistory' ]
} )

// handlerMap.getPrice.postProcess is now available
```

**Returns**
```javascript
{
    handlerMap: {
        getPrice: {
            postProcess: async ( { data } ) => { ... }
        },
        getHistory: {
            preProcess: async ( { params } ) => { ... },
            postProcess: async ( { data } ) => { ... }
        }
    }
}
```

:::tip
You rarely need to call `createHandlers()` directly. The `loadSchema()` pipeline handles handler creation automatically. Use this method when you need manual control over the dependency injection process.
:::

---

## Legacy Compatibility

### .detectLegacy()

Detects whether a loaded module uses the v1 schema format. Returns the detected format version.

**Method**
```javascript
const { isLegacy, format } = FlowMCP.detectLegacy( { module } )
```

**Parameters**

| Key | Type | Description | Required |
|-----|------|-------------|----------|
| `module` | object | The imported module from a `.mjs` schema file | Yes |

**Example**
```javascript
import { FlowMCP } from 'flowmcp-core'

const schemaModule = await import( './schemas/old-schema.mjs' )
const { isLegacy, format } = FlowMCP.detectLegacy( { module: schemaModule } )

if( isLegacy ) {
    console.log( `Legacy format detected: ${format}` )
    // Use adaptLegacy() to convert
}
```

**Returns**
```javascript
{
    isLegacy: true,    // true if the module uses v1 format
    format: 'v1'       // Detected format version string
}
```

### .adaptLegacy()

Converts a v1 schema object to the v2 two-export format. Returns the adapted `main` export, optional handlers factory function, and any conversion warnings.

**Method**
```javascript
const { main, handlersFn, hasHandlers, warnings } = FlowMCP.adaptLegacy( { legacySchema } )
```

**Parameters**

| Key | Type | Description | Required |
|-----|------|-------------|----------|
| `legacySchema` | object | A v1 format schema object | Yes |

**Example**
```javascript
import { FlowMCP } from 'flowmcp-core'

const oldSchema = { namespace: 'myapi', root: '...', routes: { ... } }
const { main, handlersFn, hasHandlers, warnings } = FlowMCP.adaptLegacy( {
    legacySchema: oldSchema
} )

if( warnings.length > 0 ) {
    console.log( 'Migration warnings:' )
    warnings.forEach( ( w ) => console.log( `  - ${w}` ) )
}

// Use the adapted schema with current methods
const result = await FlowMCP.fetch( {
    main,
    handlerMap: {},
    userParams: { ... },
    serverParams: {},
    routeName: 'myRoute'
} )
```

**Returns**
```javascript
{
    main: { ... },             // Converted main export
    handlersFn: Function|null, // Handlers factory (null if no handlers)
    hasHandlers: false,        // Whether the schema had handlers
    warnings: []               // Conversion warnings (deprecated features, etc.)
}
```

---

## Output Schema Generation

### .generateOutputSchema()

Generates an output schema from a captured API response. The output schema declares the expected response shape for downstream consumers and documentation.

**Method**
```javascript
const { output } = FlowMCP.generateOutputSchema( { response, mimeType } )
```

**Parameters**

| Key | Type | Description | Required |
|-----|------|-------------|----------|
| `response` | string | Raw API response body | Yes |
| `mimeType` | string | Response MIME type (e.g. `application/json`) | Yes |

**Example**
```javascript
import { FlowMCP } from 'flowmcp-core'

const { output } = FlowMCP.generateOutputSchema( {
    response: '{"bitcoin":{"usd":45000,"eur":38000}}',
    mimeType: 'application/json'
} )

console.log( output )
// { type: 'object', fields: { bitcoin: { type: 'object', fields: { ... } } } }
```

**Returns**
```javascript
{
    output: {
        type: 'object',
        fields: { ... }    // Inferred field structure from the response
    }
}
```

:::tip
Use this method during schema development to auto-generate the `output` block for your tools. Capture a real API response with `fetch()`, then pass it to `generateOutputSchema()`.
:::

---

## v1 API (Legacy)

The v1 API is still available for backward compatibility. Import it separately:

```javascript
import { v1 } from 'flowmcp-core'
const { FlowMCP } = v1
```

<details>
<summary>v1 Method Overview</summary>

The v1 API uses a flat schema format (single export) with different method signatures.

| Method | v1 Signature | Current Equivalent |
|--------|-------------|---------------|
| `.validateSchema()` | `FlowMCP.validateSchema( { schema } )` | `.validateMain( { main } )` |
| `.fetch()` | `FlowMCP.fetch( { schema, userParams, serverParams, routeName } )` | `.fetch( { main, handlerMap, ... } )` |
| `.activateServerTools()` | `FlowMCP.activateServerTools( { server, schema, serverParams } )` | Use MCP SDK directly with `.loadSchema()` |
| `.activateServerTool()` | `FlowMCP.activateServerTool( { server, schema, routeName, serverParams } )` | Use MCP SDK directly |
| `.prepareServerTool()` | `FlowMCP.prepareServerTool( { schema, serverParams, routeName } )` | Use `.loadSchema()` + `.fetch()` |
| `.filterArrayOfSchemas()` | `FlowMCP.filterArrayOfSchemas( { arrayOfSchemas, ... } )` | Same (v1 only) |
| `.getArgvParameters()` | `FlowMCP.getArgvParameters( { argv } )` | Same (v1 only) |
| `.getZodInterfaces()` | `FlowMCP.getZodInterfaces( { schema } )` | Zod schemas are generated during `.loadSchema()` |
| `.getAllTests()` | `FlowMCP.getAllTests( { schema } )` | Test values are in parameter `test` fields |

:::caution
The v1 API will be maintained for backward compatibility but will not receive new features. All new schemas should use the v3 format.
:::

</details>

---

## Typical Workflow

The standard workflow for using FlowMCP Core combines these methods:

```javascript
import { FlowMCP } from 'flowmcp-core'

// 1. Load schema (validates, scans security, resolves lists, creates handlers)
const { status, main, handlerMap } = await FlowMCP.loadSchema( {
    filePath: './schemas/coingecko-price.mjs'
} )

if( !status ) {
    throw new Error( 'Schema loading failed' )
}

// 2. Execute a tool
const result = await FlowMCP.fetch( {
    main,
    handlerMap,
    userParams: { id: 'bitcoin' },
    serverParams: { API_KEY: process.env.COINGECKO_KEY },
    routeName: 'getPrice'
} )

// 3. Use the result
if( result.status ) {
    console.log( 'Price data:', result.dataAsString )
} else {
    console.error( 'Errors:', result.messages )
}
```

For MCP server integration, see the [Server Integration Guide](/docs/guides/server-integration).
