---
title: Troubleshooting
description: Common issues and solutions for FlowMCP
---

Solutions to common issues when working with FlowMCP schemas, servers, and integrations.

## Schema Validation Errors

<details>
<summary>Namespace format errors</summary>

**Error:** `namespace must contain only lowercase letters`

The `namespace` field accepts only lowercase `a-z` characters. No numbers, hyphens, underscores, or uppercase.

```javascript
// Wrong
namespace: 'github-api'   // no hyphens
namespace: 'api2'         // no numbers
namespace: 'CoinGecko'    // no uppercase

// Correct
namespace: 'github'
namespace: 'coingecko'
```
</details>

<details>
<summary>Version field errors</summary>

**Error:** `version must be a valid semver string`

The `version` field must be a full semver string without prefix.

```javascript
// Wrong
version: '2.0'        // missing patch
version: 'v2.0.0'     // no 'v' prefix
version: '2'           // not semver

// Correct
version: '2.0.0'
```
</details>

<details>
<summary>Parameter structure errors</summary>

**Error:** `parameter must have position and z fields`

Every parameter in v2.0.0 requires a `position` block and a `z` block.

```javascript
// Wrong - missing z block
parameters: [
    { position: { key: 'id', value: '{{ID}}', location: 'insert' } }
]

// Correct
parameters: [
    {
        position: { key: 'id', value: '{{ID}}', location: 'insert' },
        z: { primitive: 'string()', options: [] }
    }
]
```
</details>

<details>
<summary>Route limit exceeded</summary>

**Error:** `schema exceeds maximum of 8 routes`

v2.0.0 limits schemas to a maximum of 8 routes. Split large schemas into multiple files grouped by endpoint type.

```javascript
// Wrong - too many routes in one schema
routes: {
    route1: { ... }, route2: { ... }, route3: { ... },
    route4: { ... }, route5: { ... }, route6: { ... },
    route7: { ... }, route8: { ... }, route9: { ... }  // 9th route fails
}

// Correct - split into separate schema files
// coingecko-price.mjs  (3 routes)
// coingecko-market.mjs (4 routes)
// coingecko-info.mjs   (2 routes)
```
</details>

<details>
<summary>Missing required fields</summary>

**Error:** `main.root is required` or `main.requiredServerParams is required`

v2.0.0 requires several fields that were optional in v1. Check the full list:

```javascript
export const main = {
    namespace: 'provider',           // Required
    name: 'Display Name',            // Required
    description: 'What it does',     // Required
    version: '2.0.0',               // Required
    root: 'https://api.example.com', // Required
    requiredServerParams: [],        // Required (empty array if none)
    requiredLibraries: [],           // Required (empty array if none)
    headers: {},                     // Required (empty object if none)
    routes: { ... }                  // Required (at least one route)
}
```
</details>

## Server Startup Issues

<details>
<summary>Port already in use</summary>

**Error:** `EADDRINUSE: address already in use :::3000`

Another process is using the port. Find and stop it:

```bash
# Find what is using port 3000
lsof -i :3000

# Kill the process by PID
kill <PID>

# Or use a different port
PORT=3001 node server.mjs
```
</details>

<details>
<summary>Missing environment variables</summary>

**Error:** `Required server parameter API_KEY is not set`

The schema declares `requiredServerParams` that must be present in the environment.

```bash
# Check if variable is set
echo $API_KEY

# Set the variable
export API_KEY=your_key_here

# Or pass inline
API_KEY=your_key_here node server.mjs
```

:::tip
Never commit API keys to git. Use `.env` files (with `.gitignore`) or environment variables set in your shell profile.
:::
</details>

<details>
<summary>MCP SDK version mismatch</summary>

**Error:** `Cannot find module '@modelcontextprotocol/sdk'` or unexpected API errors

Ensure you are using a compatible MCP SDK version:

```bash
# Check installed version
npm ls @modelcontextprotocol/sdk

# Install latest
npm install @modelcontextprotocol/sdk@latest
```
</details>

<details>
<summary>Schema file not found</summary>

**Error:** `ENOENT: no such file or directory`

Verify the schema path is correct and the file exists:

```bash
# Check if file exists
ls -la ./schemas/my-schema.mjs

# Use absolute path if relative fails
node -e "console.log(require('path').resolve('./schemas/my-schema.mjs'))"
```
</details>

## API Request Failures

<details>
<summary>401 Unauthorized</summary>

The API rejected your authentication credentials.

**Common causes:**
- API key expired or revoked
- Wrong header format (Bearer vs. token vs. API key)
- Key set in wrong `serverParams` field

```javascript
// Check your header template matches the API docs
headers: {
    'Authorization': 'Bearer {{API_KEY}}'     // Bearer token
    'X-API-Key': '{{API_KEY}}'                 // API key header
    'Authorization': 'token {{GITHUB_TOKEN}}'  // GitHub format
}

// Ensure serverParams match requiredServerParams
requiredServerParams: [ 'API_KEY' ],
// When running: API_KEY=xxx node server.mjs
```
</details>

<details>
<summary>429 Rate Limited</summary>

The API is throttling your requests.

**Solutions:**
- Check the API documentation for rate limit quotas
- Add delays between requests in batch operations
- Use a paid API tier for higher limits
- Cache responses when possible
</details>

<details>
<summary>Request timeout</summary>

The API did not respond within the timeout window.

**Solutions:**
- Verify the API endpoint is accessible: `curl -I https://api.example.com`
- Check network connectivity
- Some APIs have slow endpoints for large data sets -- consider pagination parameters
</details>

<details>
<summary>Invalid JSON response</summary>

**Error:** `Unexpected token < in JSON at position 0`

The API returned HTML or XML instead of JSON. Common causes:
- Wrong base URL (hitting a web page instead of API)
- API requires authentication and returns an HTML login page
- API endpoint has changed

```javascript
// Verify root URL points to the API, not the website
root: 'https://api.example.com'     // Correct
root: 'https://www.example.com'     // Wrong - website, not API
```
</details>

## Claude Desktop Integration

<details>
<summary>MCP server not showing in Claude</summary>

1. Verify your config file location:
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

2. Check config format:
```json
{
  "mcpServers": {
    "flowmcp": {
      "command": "node",
      "args": ["/absolute/path/to/server.mjs"],
      "env": {
        "API_KEY": "your_key_here"
      }
    }
  }
}
```

3. Use **absolute paths** in `args` -- relative paths may not resolve correctly
4. Restart Claude Desktop completely (quit and reopen, not just close the window)
</details>

<details>
<summary>Tools not appearing after server starts</summary>

- Verify schemas load without errors by running the server manually in a terminal
- Check that `loadSchema()` returns `status: true` for all schemas
- Confirm tools are registered using the MCP SDK's tool listing
- Check Claude Desktop logs for MCP-related errors
</details>

<details>
<summary>Tool calls returning errors</summary>

- Test the same route with `FlowMCP.fetch()` outside Claude to isolate the issue
- Check that all `requiredServerParams` are set in the Claude Desktop config `env` block
- Verify the API endpoint is reachable from your machine
</details>

## Handler Issues (v2.0.0)

<details>
<summary>Handler factory function errors</summary>

**Error:** `handlers export must be a function`

The `handlers` export must be a factory function, not a plain object.

```javascript
// Wrong - plain object
export const handlers = {
    routeName: { postProcess: ( { data } ) => data }
}

// Correct - factory function
export const handlers = ( { sharedLists, libraries } ) => ({
    routeName: {
        postProcess: ( { data } ) => {
            return data
        }
    }
})
```
</details>

<details>
<summary>Dependency injection errors</summary>

**Error:** `Library 'ethers' is not on the allowlist`

Libraries must be declared in `requiredLibraries` in the `main` export. Only allowlisted libraries can be injected.

```javascript
export const main = {
    // ...
    requiredLibraries: [ 'ethers' ],  // Declare here
    // ...
}

export const handlers = ( { libraries } ) => ({
    routeName: {
        postProcess: ( { data } ) => {
            const ethers = libraries.ethers  // Available via injection
            return ethers.formatUnits( data.value, 18 )
        }
    }
})
```
</details>

<details>
<summary>Shared list not found</summary>

**Error:** `Shared list 'evmChains' not found in lists directory`

The schema references a shared list that does not exist.

- Verify the list file exists in the lists directory (e.g. `lists/evmChains.mjs`)
- Check the list name matches exactly (case-sensitive)
- Ensure `listsDir` is passed to `loadSchema()` if using shared lists
</details>

<details>
<summary>Handler not matching route name</summary>

**Error:** `Handler key 'getprice' does not match any route name`

Handler keys must exactly match route names from `main.routes`.

```javascript
// main.routes has:
routes: { getPrice: { ... } }

// Wrong handler key
export const handlers = ( deps ) => ({
    getprice: { ... }    // lowercase 'p' does not match
})

// Correct handler key
export const handlers = ( deps ) => ({
    getPrice: { ... }    // matches routes.getPrice
})
```
</details>

## Error Messages Reference

### Schema Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `namespace invalid` | Contains non-lowercase-letter characters | Use only `a-z` |
| `route missing method` | Route has no `method` field | Add `method: 'GET'` (or POST, etc.) |
| `parameter missing z` | Parameter lacks Zod validation | Add `z` block to parameter |
| `serverParams not declared` | Header uses `{{KEY}}` but `KEY` not in `requiredServerParams` | Add to `requiredServerParams` array |
| `routes exceed max count` | More than 8 routes in one schema | Split into multiple schema files |
| `handlers is not a function` | `handlers` exported as object | Convert to factory function |

### Runtime Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | Target server not running | Verify API endpoint is accessible |
| `ETIMEDOUT` | Request timeout | Check network, increase timeout |
| `ENOTFOUND` | Invalid hostname in URL | Verify `root` URL in schema |
| `Invalid JSON` | Response is not valid JSON | Check API endpoint returns JSON |
| `Required server parameter missing` | `serverParams` value not set | Set the environment variable |

## Debug Checklist

Before reporting an issue, verify the following:

1. **Schema validates** -- Run `FlowMCP.validateMain( { main } )` and check for errors
2. **Security scan passes** -- Run `FlowMCP.scanSecurity( { filePath } )` on the schema file
3. **Schema loads** -- Run `FlowMCP.loadSchema()` and verify `status: true`
4. **Environment variables set** -- All `requiredServerParams` values are available
5. **API reachable** -- Test the API endpoint directly with `curl`
6. **Node.js version** -- Verify Node.js 22+ is installed (`node --version`)
7. **Dependencies installed** -- Run `npm ci` to ensure clean install
8. **Test with simple schema** -- Try a minimal schema with one route and no handlers

## Getting Help

:::note[GitHub Issues]
Bug reports and feature requests: [github.com/FlowMCP/flowmcp-core/issues](https://github.com/FlowMCP/flowmcp-core/issues)
:::

:::note[GitHub Discussions]
Questions, ideas, and community help: [github.com/FlowMCP/flowmcp-core/discussions](https://github.com/FlowMCP/flowmcp-core/discussions)
:::

### Issue Report Template

When reporting issues, include:

```markdown
**Environment:**
- FlowMCP Core version: x.x.x
- Node.js version: xx.x.x
- OS: macOS / Windows / Linux

**Schema (minimal reproduction):**
export const main = {
    // Minimal schema that reproduces the issue
}

**Error:**
// Full error message and stack trace

**Expected behavior:**
What should happen

**Actual behavior:**
What actually happens
```
