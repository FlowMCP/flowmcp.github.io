---
title: Skills
description: "Wiederverwendbare mehrstufige Workflow-Anweisungen mit typisierten Eingaben, Tool-Abhaengigkeiten und modellspezifischem Testing definieren"
---

Skills sind instruktive mehrstufige Workflows, die in ein Schema eingebettet sind. Im Gegensatz zu Prompts (die Kontext erklaeren) **instruieren** Skills -- sie sagen einem LLM genau, was zu tun ist, Schritt fuer Schritt. Jeder Skill deklariert seine Tool-Abhaengigkeiten, definiert typisierte Eingabeparameter und erfasst das Modell, mit dem er getestet wurde.

:::tip
**Skills vs Prompts:** Verwende einen Prompt, wenn du Kontext bereitstellen oder eine Domaene erklaeren willst. Verwende einen Skill, wenn du einen wiederholbaren mehrstufigen Workflow orchestrieren willst, der bestimmte Tools in Reihenfolge aufruft.
:::

## Skill-Ausfuehrungsfluss

Wie ein Skill zur Laufzeit aufgeloest und ausgefuehrt wird:

Der `content` des Skills ist ein Template. Platzhalter wie `{{input:tokenSymbol}}` werden durch User-bereitgestellte Werte ersetzt, und `{{tool:computeRSI}}`-Referenzen sagen dem LLM, welches Tool bei jedem Schritt aufzurufen ist.

## Skills definieren

Skills werden im `skills`-Key des `main` Exports deklariert. Jeder Eintrag zeigt auf eine separate `.mjs`-Datei:

```javascript
export const main = {
    namespace: 'tradingsignals',
    name: 'TradingSignals',
    version: '3.0.0',
    root: 'https://api.example.com',
    tools: {
        computeRSI: { /* ... */ },
        computeMACD: { /* ... */ }
    },
    skills: {
        'token-technical-analysis': { file: './skills/token-technical-analysis.mjs' }
    }
}
```

### Skill-Referenzfelder

Jeder Key in `main.skills` ist der Skill-Name (muss `^[a-z][a-z0-9-]*$` entsprechen). Der Wert ist ein Objekt:

| Feld | Typ | Erforderlich | Beschreibung |
|------|-----|-------------|--------------|
| `file` | `string` | Ja | Pfad zur `.mjs`-Skill-Datei, relativ zum Schema. Muss auf `.mjs` enden. |

## Skill-Dateiformat

Jede Skill-Datei exportiert ein `skill`-Objekt mit der vollstaendigen Workflow-Definition:

```javascript
const content = `Perform technical analysis of {{input:tokenSymbol}} on {{input:chain}}.

## Step 1: Token Discovery
Use {{tool:searchBySymbol}} to find {{input:tokenSymbol}} on {{input:chain}}.

## Step 2: OHLCV Data
Use {{tool:getRecursiveOhlcvEVM}} for {{input:timeframeDays}}-day candles.

## Step 3: Indicators
Use {{tool:computeRSI}} with period 14.
Use {{tool:computeMACD}} with fast 12, slow 26, signal 9.

## Step 4: Synthesis
Compile findings into BULLISH / BEARISH / NEUTRAL signal.`

export const skill = {
    name: 'token-technical-analysis',
    version: 'flowmcp-skill/1.0.0',
    description: 'Full technical analysis: discovery, OHLCV, indicators, chart, signal summary',
    testedWith: 'anthropic/claude-sonnet-4-5-20250929',
    requires: {
        tools: [
            'indicators/tool/searchBySymbol',
            'ohlcv/tool/getRecursiveOhlcvEVM',
            'tradingsignals/tool/computeRSI',
            'tradingsignals/tool/computeMACD'
        ],
        resources: [],
        external: [ 'playwright' ]
    },
    input: [
        { key: 'tokenSymbol', type: 'string', description: 'Token symbol (e.g. WETH)', required: true },
        { key: 'chain', type: 'string', description: 'Blockchain (e.g. ethereum)', required: true },
        { key: 'timeframeDays', type: 'number', description: 'Days of history', required: false }
    ],
    output: 'Structured report with trend, momentum, volatility, chart, and signal summary',
    content
}
```

## Skill-Objekt-Felder

| Feld | Typ | Erforderlich | Beschreibung |
|------|-----|-------------|--------------|
| `name` | `string` | Ja | Muss mit dem `name` im `skills`-Array-Eintrag des Schemas uebereinstimmen. |
| `version` | `string` | Ja | Muss `'flowmcp-skill/1.0.0'` sein. |
| `description` | `string` | Ja | Was dieser Skill tut. |
| `testedWith` | `string` | Ja | Modell-ID, mit der der Skill getestet wurde (z.B. `anthropic/claude-sonnet-4-5-20250929`). |
| `requires` | `object` | Ja | Abhaengigkeiten: `tools`, `resources` und `external` Arrays. |
| `input` | `array` | Nein | User-bereitgestellte Eingabeparameter. |
| `output` | `string` | Nein | Beschreibung dessen, was der Skill produziert. |
| `content` | `string` | Ja | Der Anweisungstext mit Platzhaltern. |

:::note
**`testedWith` ist fuer Skills erforderlich.** Jeder Skill muss deklarieren, mit welchem Modell er getestet wurde. Dies ist ein wesentlicher Unterschied zu Prompts, die `testedWith` nicht erfordern. Das Feld dokumentiert Verantwortlichkeit -- wenn ein Skill unzuverlaessige Ergebnisse liefert, ist das getestete Modell die erste Variable zur Pruefung.
:::

### `requires`-Objekt

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `tools` | `string[]` | Tool-Referenzen, die dieser Skill nutzt. Verwendet das vollstaendige ID-Format (`namespace/tool/name`) fuer schema-uebergreifende Referenzen, oder einfache Namen fuer Tools im selben Schema. |
| `resources` | `string[]` | Resource-Namen, die dieser Skill liest. Muessen mit Namen in `main.resources` uebereinstimmen. |
| `external` | `string[]` | Externe Faehigkeiten, die nicht vom Schema bereitgestellt werden (z.B. `playwright`, `puppeteer`). Zu Dokumentationszwecken. |

:::note
**`requires.external` ist nur fuer Skills.** Prompts haben kein `external`-Feld. Verwende es, um Abhaengigkeiten zu dokumentieren, die ausserhalb des FlowMCP-Oekosystems existieren, damit Nutzer wissen, welches zusaetzliche Setup benoetigt wird.
:::

### `input`-Array

Jeder Eingabeparameter:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `key` | `string` | Parametername (camelCase). Im Content als `{{input:key}}` referenziert. |
| `type` | `string` | Einer von `string`, `number`, `boolean` oder `enum`. |
| `description` | `string` | Wofuer dieser Eingabeparameter ist. |
| `required` | `boolean` | Ob der User diesen Wert bereitstellen muss. |

## Platzhalter-Syntax

Das `content`-Feld unterstuetzt vier Platzhaltertypen, identisch zum Prompts-Platzhaltersystem:

| Platzhalter | Syntax | Loest auf zu | Beispiel |
|-------------|--------|-------------|---------|
| Tool-Referenz | `{{tool:name}}` | Tool-Name aus `requires.tools` | `{{tool:computeRSI}}` |
| Resource-Referenz | `{{resource:name}}` | Resource-Name aus `requires.resources` | `{{resource:verifiedContracts}}` |
| Skill-Referenz | `{{skill:name}}` | Anderer Skill im selben Schema | `{{skill:quick-check}}` |
| Input-Referenz | `{{input:key}}` | User-bereitgestellter Eingabewert | `{{input:tokenSymbol}}` |

### Platzhalter-Regeln

1. `{{tool:x}}` -- `x` sollte in `requires.tools` aufgefuehrt sein
2. `{{resource:x}}` -- `x` sollte in `requires.resources` aufgefuehrt sein
3. `{{skill:x}}` -- muss einen anderen Skill im selben Schema referenzieren (keine Zirkelbezuege)
4. `{{input:x}}` -- sollte mit einem `input[].key` uebereinstimmen

Nicht aufgeloeste Platzhalter erzeugen Validierungswarnungen (keine Fehler), ausser `{{skill:x}}`, das aufgeloest werden muss.

## Einschraenkungen

| Einschraenkung | Wert | Begruendung |
|----------------|------|-------------|
| Max Skills pro Schema | 4 | Schemas fokussiert halten |
| `testedWith` | Erforderlich | Verantwortlichkeit fuer nicht-deterministische Workflows |
| `requires.external` | Nur fuer Skills | Prompts unterstuetzen dieses Feld nicht |
| Skill-Namensmuster | `^[a-z][a-z0-9-]*$` | Kleinbuchstaben mit Bindestrichen |
| Skill-Dateiendung | `.mjs` | ES-Module-Format |
| Version | `flowmcp-skill/1.0.0` | Fest fuer v3.0.0 |
| Content | Nicht-leerer String | Muss Anweisungen enthalten |
| Keine Zirkelbezuege | Via `{{skill:x}}` | Verhindert Endlosschleifen |

## Skills vs Prompts Zusammenfassung

| Aspekt | Prompt | Skill |
|--------|--------|-------|
| Zweck | Kontext erklaeren | Schritt-fuer-Schritt instruieren |
| `testedWith` | Optional | **Erforderlich** |
| `requires.external` | Nicht verfuegbar | Verfuegbar |
| Platzhaltersystem | Gleich | Gleich |
| Max pro Schema | 4 | 4 |
| Dateiformat | `.mjs` | `.mjs` |
| MCP-Primitiv | Prompts | Prompts |
