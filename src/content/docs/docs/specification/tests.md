---
title: "Tests"
description: "Tool tests, resource tests, agent tests, and response capture"
---

FlowMCP v4.0.0 requires a minimum of 3 tests per tool, resource query, and agent. Tests serve as both validation and documentation of expected behavior.

:::note
For the full specification, see [10-tests.md](https://github.com/FlowMCP/flowmcp-spec/blob/main/spec/v4.0.0/10-tests.md).
:::

## Tool Tests

Each tool in `main.tools` must have at least 3 test entries:

```javascript
tools: {
    getPrice: {
        method: 'GET',
        path: '/simple/price',
        description: 'Get token price',
        parameters: [...],
        tests: [
            { _description: 'Basic price lookup', vs_currencies: 'usd', ids: 'bitcoin' },
            { _description: 'Multi-token query', vs_currencies: 'usd', ids: 'bitcoin,ethereum' },
            { _description: 'Alternative currency', vs_currencies: 'eur', ids: 'bitcoin' }
        ]
    }
}
```

## Agent Tests

Agent tests validate tool selection (deterministic) and content assertions (partial):

```json
{
    "_description": "Cross-provider analysis",
    "input": "Compare TVL of Aave on Ethereum vs Arbitrum",
    "expectedTools": ["defillama/tool/getProtocolTvl"],
    "expectedContent": ["TVL", "Ethereum", "Arbitrum"]
}
```

### Three-Level Test Model

| Level | Field | Deterministic? | Description |
|-------|-------|---------------|-------------|
| Tool Usage | `expectedTools` | Yes | Which tools the agent must call |
| Content | `expectedContent` | Partial | Strings the response should contain |
| Quality | Manual review | No | Subjective assessment |

## Test Minimum (TST001)

| Primitive | v2 Minimum | v3 Minimum |
|-----------|-----------|-----------|
| Tool | 1 test | 3 tests |
| Resource query | 1 test | 3 tests |
| Agent | N/A | 3 tests |

## CLI Commands

```bash
# Test a single schema
flowmcp test single path/to/schema.mjs

# Test all project schemas
flowmcp test project
```
