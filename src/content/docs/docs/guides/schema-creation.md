---
title: Schema Creation
description: Write your own FlowMCP schemas from scratch
---

This guide walks you through creating FlowMCP v3.0.0 schemas. A schema is a `.mjs` file that describes how to interact with a REST API -- what endpoints exist, what parameters they accept, and how responses should be transformed.

## Prerequisites

Before creating a schema, you need:
- The API documentation for the service you want to wrap
- An API key if the service requires authentication
- Node.js 18+ installed
- FlowMCP CLI installed (`npm install -g github:FlowMCP/flowmcp-cli`)

## Creation Process

1. **Choose namespace and identify endpoints**

   Pick a unique namespace for your schema and list the API endpoints you want to expose.

   The namespace becomes part of the tool name: `namespace_toolName`. Keep it short and recognizable (e.g., `coingecko`, `etherscan`, `defillama`).

   ```javascript
   // Namespace: "myapi"
   // Endpoints to wrap:
   //   GET /api/v1/status    -> ping
   //   GET /api/v1/data/:id  -> getData
   ```

2. **Create the main export**

   Every schema exports a `main` object with the API definition:

   ```javascript
   export const main = {
       namespace: 'myapi',
       name: 'MyAPI',
       description: 'Access data from MyAPI service',
       version: '3.0.0',
       docs: [ 'https://docs.myapi.com' ],
       tags: [ 'data', 'utility' ],
       root: 'https://api.myapi.com/v1',
       requiredServerParams: [ 'MYAPI_KEY' ],
       requiredLibraries: [],
       headers: {},
       tools: {
           ping: {
               method: 'GET',
               path: '/status',
               description: 'Check if MyAPI is online',
               parameters: [],
               output: {
                   mimeType: 'application/json',
                   schema: {
                       type: 'object',
                       properties: {
                           status: { type: 'string', description: 'Server status' }
                       }
                   }
               }
           },
           getData: {
               method: 'GET',
               path: '/data/{{id}}',
               description: 'Get data record by ID',
               parameters: [
                   {
                       position: { key: 'id', value: '{{USER_PARAM}}', location: 'insert' },
                       z: { primitive: 'string()', options: [ 'min(1)' ] }
                   },
                   {
                       position: { key: 'apikey', value: '{{SERVER_PARAM:MYAPI_KEY}}', location: 'query' },
                       z: { primitive: 'string()', options: [] }
                   }
               ],
               output: {
                   mimeType: 'application/json',
                   schema: {
                       type: 'object',
                       properties: {
                           id: { type: 'string' },
                           value: { type: 'number' }
                       }
                   }
               }
           }
       }
   }
   ```

3. **Add output schemas**

   Each tool can declare its response structure in the `output` field. This tells AI clients what to expect:

   ```javascript
   output: {
       mimeType: 'application/json',
       schema: {
           type: 'object',
           properties: {
               name: { type: 'string', description: 'Protocol name' },
               tvl: { type: 'number', description: 'Total value locked in USD' }
           }
       }
   }
   ```

   :::tip
   Output schemas are optional but strongly recommended. They help AI clients understand what data the tool returns, leading to better tool selection and response handling.
   :::

4. **Add handlers (optional)**

   If the raw API response needs transformation, add a `handlers` export. This is a factory function that receives shared lists and libraries:

   ```javascript
   export const handlers = ( { sharedLists, libraries } ) => ( {
       getData: {
           postRequest: async ( { response } ) => {
               const { id, rawValue, metadata } = response
               const simplified = {
                   id,
                   value: rawValue / 100,
                   source: metadata.provider
               }

               return { response: simplified }
           }
       }
   } )
   ```

   Handlers support two hooks per tool:
   - `preRequest` -- modify the request before it is sent
   - `postRequest` -- transform the response before it reaches the AI client

5. **Validate with CLI**

   Run the schema through the validation pipeline:

   ```bash
   flowmcp validate ./my-schema.mjs
   ```

   The validator checks rules covering structure, security, and correctness.

6. **Test with CLI**

   Execute live API calls to verify the schema works:

   ```bash
   flowmcp test single ./my-schema.mjs
   flowmcp test single ./my-schema.mjs --route getData
   ```

## Parameter Patterns

Parameters define how user input and server credentials map to API requests. Each parameter has a `position` that controls where it goes:

### Query Parameters

Appended to the URL as `?key=value`:

```javascript
{
    position: { key: 'symbol', value: '{{USER_PARAM}}', location: 'query' },
    z: { primitive: 'string()', options: [ 'min(1)' ] }
}
// GET /api/data?symbol=BTC
```

### Path Parameters (insert)

Substituted into the URL path:

```javascript
{
    position: { key: 'userId', value: '{{USER_PARAM}}', location: 'insert' },
    z: { primitive: 'string()', options: [ 'min(1)' ] }
}
// path: '/users/{{userId}}' -> /users/abc123
```

### Body Parameters

Sent in the request body for POST/PUT requests:

```javascript
{
    position: { key: 'query', value: '{{USER_PARAM}}', location: 'body' },
    z: { primitive: 'string()', options: [] }
}
```

### Server Parameters

Injected from environment variables. Never exposed to the AI client:

```javascript
{
    position: { key: 'apikey', value: '{{SERVER_PARAM:ETHERSCAN_API_KEY}}', location: 'query' },
    z: { primitive: 'string()', options: [] }
}
```

:::note
The `{{SERVER_PARAM:KEY_NAME}}` syntax references a key declared in `requiredServerParams`. The runtime injects the value from the environment at execution time.
:::

## Zod Validation

Each parameter includes a `z` field that defines validation rules:

```javascript
// String with minimum length
z: { primitive: 'string()', options: [ 'min(1)' ] }

// Number with minimum value
z: { primitive: 'number()', options: [ 'min(1)' ] }

// Enum from a fixed list
z: { primitive: 'enum(["bitcoin","ethereum","solana"])', options: [] }

// Enum from a shared list field
z: { primitive: 'enum({{evmChains:etherscanAlias}})', options: [] }

// Optional string
z: { primitive: 'string()', options: [ 'optional()' ] }
```

## Shared List References

Schemas can reference shared lists for reusable value enumerations like chain IDs or token symbols:

```javascript
// In main:
sharedLists: [
    {
        ref: 'evmChains',
        version: '1.0.0',
        filter: { key: 'etherscanAlias', exists: true }
    }
],

// In a parameter:
z: { primitive: 'enum({{evmChains:etherscanAlias}})', options: [] }
```

The `{{evmChains:etherscanAlias}}` syntax interpolates the `etherscanAlias` field from all entries in the `evmChains` shared list that pass the filter. This generates an enum like `enum(["ETH","POLYGON","ARBITRUM","OPTIMISM","BASE","BSC"])`.

## Handler Patterns

### Response Filtering

Reduce large API responses to the fields the AI client needs:

```javascript
export const handlers = ( { sharedLists, libraries } ) => ( {
    getProtocols: {
        postRequest: async ( { response } ) => {
            const items = response
                .filter( ( item ) => item.tvl > 0 )
                .map( ( item ) => {
                    const { name, slug, tvl, chain, category } = item

                    return { name, slug, tvl, chain, category }
                } )

            return { response: items }
        }
    }
} )
```

### Pre-Request Modification

Modify request parameters before the API call:

```javascript
export const handlers = ( { sharedLists, libraries } ) => ( {
    getData: {
        preRequest: async ( { params } ) => {
            const { symbol } = params
            const normalized = symbol.toUpperCase()

            return { params: { ...params, symbol: normalized } }
        }
    }
} )
```

:::tip
Keep handlers simple. Their purpose is data transformation, not business logic. If your handler is growing complex, consider splitting the schema into multiple tools.
:::

## Best Practices

:::note[One concern per schema]
Group related endpoints into a single schema. A schema for "Etherscan Gas Tracker" should contain gas-related tools, not all Etherscan endpoints.
:::

:::note[Descriptive tool names]
Use verb-noun format: `getBalance`, `listProtocols`, `executeQuery`. The tool name becomes part of the MCP tool name.
:::

:::note[Include output schemas]
Always define `output.schema` for each tool. This helps AI clients understand what data they will receive and select the right tool.
:::

:::note[Test with real data]
Use `flowmcp test single` to verify against the real API. Schema validation alone cannot catch API-side issues.
:::

:::caution[Common Mistakes]
- Forgetting `requiredServerParams` when using `{{SERVER_PARAM:...}}` in parameters
- Using `location: 'insert'` without a matching `{{key}}` placeholder in the path
- Declaring `requiredLibraries` without a corresponding `handlers` export that uses them
- Omitting the `version: '3.0.0'` field (required for v3 schemas)
:::
