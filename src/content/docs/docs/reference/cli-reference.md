---
title: CLI Reference
description: Complete FlowMCP CLI command reference
---

The FlowMCP CLI is a command-line tool for developing, validating, and managing FlowMCP schemas. It handles schema imports, group management, live API testing, migration, and can run as an MCP server for AI agent integration.

## Installation

```bash
npm install -g flowmcp-cli
```

Or clone and link locally:

```bash
git clone https://github.com/FlowMCP/flowmcp-cli.git
cd flowmcp-cli
npm install
npm link
```

## Architecture

The CLI operates on two configuration levels:

| Level | Path | Content |
|-------|------|---------|
| **Global** | `~/.flowmcp/` | Config, `.env` with API keys, all imported schemas |
| **Local** | `{project}/.flowmcp/` | Project config, groups with selected tools |

```
~/.flowmcp/
├── config.json          # Global configuration
├── .env                 # API keys for schema testing
└── schemas/             # All imported schema files
    └── flowmcp-schemas/ # Imported from GitHub

{project}/.flowmcp/
├── config.json          # Project-level configuration
└── groups/              # Tool groups for this project
```

## Two Modes

The CLI has two operating modes that control which commands are available:

| Mode | Default | Description |
|------|---------|-------------|
| **Agent** | Yes | Subset of commands for AI agent use (search, add, remove, list, call, run) |
| **Dev** | No | All commands including validation, testing, schema browsing, migration, and imports |

Switch modes with `flowmcp mode agent` or `flowmcp mode dev`.

:::note
Agent mode is the default. It exposes only the commands an AI agent needs to discover, activate, and call tools. Switch to Dev mode for schema development and validation workflows.
:::

## Commands

### Setup

#### `flowmcp init`

Interactive setup that creates global and local configuration. Run this once in each project.

```bash
flowmcp init
```

This will:
- Create `~/.flowmcp/` if it does not exist
- Optionally import the default schema repository
- Create `.flowmcp/` in the current project
- Set up a default group

#### `flowmcp status`

Show config, sources, groups, and health info.

```bash
flowmcp status
```

#### `flowmcp mode [agent|dev]`

Show or switch the current mode.

```bash
flowmcp mode        # Show current mode
flowmcp mode dev    # Switch to dev mode
flowmcp mode agent  # Switch to agent mode
```

### Discovery

#### `flowmcp search <query>`

Find available tools by keyword. Returns matching tool names with descriptions.

```bash
flowmcp search etherscan
flowmcp search "gas price"
flowmcp search defi
```

#### `flowmcp schemas`

List all available schemas and their tools. **Dev mode only.**

```bash
flowmcp schemas
```

:::caution
The `schemas` command can produce long output with large schema collections. Use `search` first to narrow down results.
:::

### Schema Management

#### `flowmcp add <tool-name>`

Activate a tool for this project. Adds it to the default group.

```bash
flowmcp add coingecko_simplePrice
```

#### `flowmcp remove <tool-name>`

Deactivate a tool from the project.

```bash
flowmcp remove coingecko_simplePrice
```

#### `flowmcp list`

Show all active tools in the current project.

```bash
flowmcp list
```

#### `flowmcp import <url> [--branch name]`

Import schemas from a GitHub repository. **Dev mode only.**

```bash
flowmcp import https://github.com/FlowMCP/flowmcp-schemas
flowmcp import https://github.com/FlowMCP/flowmcp-schemas --branch develop
```

#### `flowmcp import-registry <url>`

Import schemas from a registry URL. **Dev mode only.**

```bash
flowmcp import-registry https://registry.example.com/schemas
```

#### `flowmcp update [source-name]`

Update schemas from remote registries using hash-based delta sync.

```bash
flowmcp update                    # Update all sources
flowmcp update flowmcp-schemas    # Update specific source
```

### Migration

#### `flowmcp migrate <path> [flags]`

Migrate schemas from v2 to v3 format. Renames `routes` to `tools` and updates the version field. **Dev mode only.**

```bash
# Migrate a single schema file
flowmcp migrate ./schemas/coingecko/Ping.mjs

# Migrate all schemas in a directory
flowmcp migrate --all ./schemas/

# Preview changes without writing files
flowmcp migrate --dry-run ./schemas/coingecko/Ping.mjs
```

**Flags:**

| Flag | Description |
|------|-------------|
| `--all` | Migrate all `.mjs` schema files in the directory recursively |
| `--dry-run` | Preview changes without modifying any files |

**What it does:**
1. Reads the schema file
2. Renames `routes` key to `tools`
3. Updates `version` from `2.x.x` to `3.0.0`
4. Writes the updated file in-place
5. Runs validation on the result

:::tip
Always use `--dry-run` first to preview changes before modifying files. The migrate command modifies files in-place.
:::

### Group Management

Groups organize tools into named collections. Each project can have multiple groups with one set as default.

#### `flowmcp group list`

List all groups and their tool counts.

```bash
flowmcp group list
```

#### `flowmcp group append <name> --tools "refs"`

Add tools to a group. Creates the group if it does not exist.

```bash
flowmcp group append crypto --tools "flowmcp-schemas/coingecko/simplePrice.mjs,flowmcp-schemas/etherscan/getBalance.mjs"
```

#### `flowmcp group remove <name> --tools "refs"`

Remove tools from a group.

```bash
flowmcp group remove crypto --tools "flowmcp-schemas/coingecko/simplePrice.mjs"
```

#### `flowmcp group set-default <name>`

Set the default group used by `call`, `test`, and `run` commands.

```bash
flowmcp group set-default crypto
```

### Validation & Testing (Dev Mode)

#### `flowmcp validate [path] [--group name]`

Validate schema structure against the FlowMCP specification.

```bash
flowmcp validate                          # Validate default group
flowmcp validate ./my-schema.mjs          # Validate single file
flowmcp validate --group crypto           # Validate specific group
```

#### `flowmcp test project [--route name] [--group name]`

Test default group schemas with live API calls.

```bash
flowmcp test project                          # Test all tools
flowmcp test project --route getBalance       # Test specific tool
flowmcp test project --group crypto           # Test specific group
```

#### `flowmcp test user [--route name]`

Test all user-created schemas with live API calls.

```bash
flowmcp test user
```

#### `flowmcp test single <path> [--route name]`

Test a single schema file.

```bash
flowmcp test single ./my-schema.mjs
flowmcp test single ./my-schema.mjs --route getBalance
```

### Execution

#### `flowmcp call list-tools [--group name]`

List available tools in the default or specified group.

```bash
flowmcp call list-tools
flowmcp call list-tools --group crypto
```

#### `flowmcp call <tool-name> [json] [--group name]`

Call a tool with optional JSON input.

```bash
flowmcp call coingecko_simplePrice '{"ids":"bitcoin","vs_currencies":"usd"}'
flowmcp call etherscan_getBalance '{"address":"0x..."}'  --group crypto
```

#### `flowmcp run [--group name]`

Start as an MCP server using stdio transport. This is used for integration with AI agent frameworks like Claude Code.

```bash
flowmcp run
flowmcp run --group crypto
```

:::tip
Use `flowmcp run` to connect the CLI directly to Claude Desktop or other MCP-compatible AI clients via stdio transport.
:::

## Tool Reference Format

Tools are referenced using the `source/file.mjs` format with optional type discriminators:

```
source/file.mjs                        # All tools from a schema
source/file.mjs::tool::toolName        # Single tool (v3 format)
source/file.mjs::resource::resName     # Single resource (v3 format)
source/file.mjs::skill::skillName      # Single skill (v3 format)
source/file.mjs::toolName              # Single tool (v2 compat format)
```

For example:
```
flowmcp-schemas/coingecko/simplePrice.mjs                    # All tools
flowmcp-schemas/coingecko/simplePrice.mjs::tool::getPrice    # Single tool
```

## Workflow Example

1. **Initialize**

   Run the interactive setup. This imports schemas and creates a default group.

   ```bash
   flowmcp init
   ```

2. **Import schemas (optional)**

   If you skipped the import during init, add schemas manually:

   ```bash
   flowmcp import https://github.com/FlowMCP/flowmcp-schemas
   ```

3. **Create a group**

   Organize tools into a named group:

   ```bash
   flowmcp group append crypto --tools "flowmcp-schemas/coingecko/simplePrice.mjs,flowmcp-schemas/etherscan/getBalance.mjs"
   flowmcp group set-default crypto
   ```

4. **Validate and test**

   Ensure schemas are correct and APIs respond:

   ```bash
   flowmcp validate
   flowmcp test project
   ```

5. **Use tools**

   Call tools directly or start the MCP server:

   ```bash
   flowmcp call list-tools
   flowmcp call coingecko_simplePrice '{"ids":"bitcoin","vs_currencies":"usd"}'

   # Or start as MCP server
   flowmcp run
   ```

## Environment Variables

API keys for schema testing go in `~/.flowmcp/.env`:

```bash
ETHERSCAN_API_KEY=your_key_here
COINGECKO_API_KEY=your_key_here
DUNE_API_KEY=your_key_here
```

:::caution
Never commit API keys to version control. The `.env` file in `~/.flowmcp/` is your global key store and should stay on your machine only.
:::
