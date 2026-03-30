---
title: Schema erstellen
description: Eigene FlowMCP-Schemas von Grund auf schreiben
---

Diese Anleitung fuehrt dich durch die Erstellung von FlowMCP v3.0.0 Schemas. Ein Schema ist eine `.mjs`-Datei, die beschreibt, wie man mit einer REST-API interagiert -- welche Endpunkte existieren, welche Parameter sie akzeptieren und wie Antworten transformiert werden sollen.

## Voraussetzungen

Bevor du ein Schema erstellst, brauchst du:
- Die API-Dokumentation des Services, den du wrappen moechtest
- Einen API-Schluessel, falls der Service Authentifizierung erfordert
- Node.js 18+ installiert
- FlowMCP CLI installiert (`npm install -g flowmcp-cli`)

## Erstellungsprozess

1. **Namespace waehlen und Endpunkte identifizieren**

   Waehle einen eindeutigen Namespace fuer dein Schema und liste die API-Endpunkte auf, die du bereitstellen moechtest.

   Der Namespace wird Teil des Tool-Namens: `namespace_toolName`. Halte ihn kurz und wiedererkennbar (z.B. `coingecko`, `etherscan`, `defillama`).

   ```javascript
   // Namespace: "myapi"
   // Zu wrappende Endpunkte:
   //   GET /api/v1/status    -> ping
   //   GET /api/v1/data/:id  -> getData
   ```

2. **Den main-Export erstellen**

   Jedes Schema exportiert ein `main`-Objekt mit der API-Definition:

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

3. **Output-Schemas hinzufuegen**

   Jedes Tool kann seine Antwortstruktur im `output`-Feld deklarieren. Das teilt KI-Clients mit, was sie erwarten koennen:

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
   Output-Schemas sind optional, aber dringend empfohlen. Sie helfen KI-Clients zu verstehen, welche Daten das Tool zurueckgibt, was zu besserer Tool-Auswahl und Antwortverarbeitung fuehrt.
   :::

4. **Handler hinzufuegen (optional)**

   Wenn die rohe API-Antwort transformiert werden muss, fuege einen `handlers`-Export hinzu. Dies ist eine Factory-Funktion, die Shared Lists und Libraries erhaelt:

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

   Handler unterstuetzen zwei Hooks pro Tool:
   - `preRequest` -- Request vor dem Senden modifizieren
   - `postRequest` -- Antwort transformieren, bevor sie den KI-Client erreicht

5. **Mit CLI validieren**

   Das Schema durch die Validierungs-Pipeline laufen lassen:

   ```bash
   flowmcp validate ./my-schema.mjs
   ```

   Der Validator prueft Regeln zu Struktur, Sicherheit und Korrektheit.

6. **Mit CLI testen**

   Live-API-Aufrufe ausfuehren, um zu pruefen, ob das Schema funktioniert:

   ```bash
   flowmcp test single ./my-schema.mjs
   flowmcp test single ./my-schema.mjs --route getData
   ```

## Parameter-Muster

Parameter definieren, wie Benutzereingaben und Server-Credentials auf API-Requests abgebildet werden. Jeder Parameter hat eine `position`, die steuert, wohin er geht:

### Query-Parameter

An die URL als `?key=value` angehaengt:

```javascript
{
    position: { key: 'symbol', value: '{{USER_PARAM}}', location: 'query' },
    z: { primitive: 'string()', options: [ 'min(1)' ] }
}
// GET /api/data?symbol=BTC
```

### Pfad-Parameter (insert)

In den URL-Pfad eingesetzt:

```javascript
{
    position: { key: 'userId', value: '{{USER_PARAM}}', location: 'insert' },
    z: { primitive: 'string()', options: [ 'min(1)' ] }
}
// path: '/users/{{userId}}' -> /users/abc123
```

### Body-Parameter

Im Request-Body fuer POST/PUT-Requests gesendet:

```javascript
{
    position: { key: 'query', value: '{{USER_PARAM}}', location: 'body' },
    z: { primitive: 'string()', options: [] }
}
```

### Server-Parameter

Aus Umgebungsvariablen injiziert. Niemals dem KI-Client zugaenglich:

```javascript
{
    position: { key: 'apikey', value: '{{SERVER_PARAM:ETHERSCAN_API_KEY}}', location: 'query' },
    z: { primitive: 'string()', options: [] }
}
```

:::note
Die `{{SERVER_PARAM:KEY_NAME}}`-Syntax referenziert einen Schluessel, der in `requiredServerParams` deklariert ist. Die Runtime injiziert den Wert aus der Umgebung zur Ausfuehrungszeit.
:::

## Zod-Validierung

Jeder Parameter enthaelt ein `z`-Feld, das Validierungsregeln definiert:

```javascript
// String mit Mindestlaenge
z: { primitive: 'string()', options: [ 'min(1)' ] }

// Zahl mit Mindestwert
z: { primitive: 'number()', options: [ 'min(1)' ] }

// Enum aus fester Liste
z: { primitive: 'enum(["bitcoin","ethereum","solana"])', options: [] }

// Enum aus Shared-List-Feld
z: { primitive: 'enum({{evmChains:etherscanAlias}})', options: [] }

// Optionaler String
z: { primitive: 'string()', options: [ 'optional()' ] }
```

## Shared-List-Referenzen

Schemas koennen Shared Lists fuer wiederverwendbare Wert-Aufzaehlungen wie Chain-IDs oder Token-Symbole referenzieren:

```javascript
// In main:
sharedLists: [
    {
        ref: 'evmChains',
        version: '1.0.0',
        filter: { key: 'etherscanAlias', exists: true }
    }
],

// In einem Parameter:
z: { primitive: 'enum({{evmChains:etherscanAlias}})', options: [] }
```

Die `{{evmChains:etherscanAlias}}`-Syntax interpoliert das `etherscanAlias`-Feld aus allen Eintraegen der `evmChains` Shared List, die den Filter bestehen. Dies generiert ein Enum wie `enum(["ETH","POLYGON","ARBITRUM","OPTIMISM","BASE","BSC"])`.

## Handler-Muster

### Antwort-Filterung

Grosse API-Antworten auf die Felder reduzieren, die der KI-Client braucht:

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

### Pre-Request-Modifikation

Request-Parameter vor dem API-Aufruf modifizieren:

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
Handler einfach halten. Ihr Zweck ist Datentransformation, nicht Geschaeftslogik. Wenn dein Handler komplex wird, erwaege das Schema in mehrere Tools aufzuteilen.
:::

## Best Practices

:::note[Ein Anliegen pro Schema]
Verwandte Endpunkte in ein einzelnes Schema gruppieren. Ein Schema fuer "Etherscan Gas Tracker" sollte gas-bezogene Tools enthalten, nicht alle Etherscan-Endpunkte.
:::

:::note[Beschreibende Tool-Namen]
Verb-Nomen-Format verwenden: `getBalance`, `listProtocols`, `executeQuery`. Der Tool-Name wird Teil des MCP-Tool-Namens.
:::

:::note[Output-Schemas einbeziehen]
Immer `output.schema` fuer jedes Tool definieren. Das hilft KI-Clients zu verstehen, welche Daten sie erhalten, und das richtige Tool auszuwaehlen.
:::

:::note[Mit echten Daten testen]
`flowmcp test single` verwenden, um gegen die echte API zu verifizieren. Schema-Validierung allein kann API-seitige Probleme nicht erkennen.
:::

:::caution[Haeufige Fehler]
- `requiredServerParams` vergessen, wenn `{{SERVER_PARAM:...}}` in Parametern verwendet wird
- `location: 'insert'` ohne passenden `{{key}}`-Platzhalter im Pfad verwenden
- `requiredLibraries` deklarieren ohne einen entsprechenden `handlers`-Export, der sie nutzt
- Das `version: '3.0.0'`-Feld weglassen (erforderlich fuer v3-Schemas)
:::
