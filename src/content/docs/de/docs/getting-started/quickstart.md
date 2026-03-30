---
title: Quickstart
description: "Erstelle dein erstes FlowMCP-Schema und rufe eine API in 5 Minuten auf"
---

## Voraussetzungen

- **Node.js 22+** — pruefen mit `node --version`
- **npm** — wird mit Node.js ausgeliefert

## Dein erstes Schema erstellen

1. **FlowMCP Core installieren**

   Erstelle ein neues Projekt und installiere die Core Library:

   ```bash
   mkdir my-flowmcp-project
   cd my-flowmcp-project
   npm init -y
   npm install flowmcp-core
   ```

   Fuege `"type": "module"` zu deiner `package.json` fuer ES-Module-Unterstuetzung hinzu.

2. **Ein Schema schreiben**

   Erstelle eine Datei namens `coingecko-ping.mjs`:

   ```javascript
   export const main = {
       namespace: 'coingecko',
       name: 'Ping',
       description: 'Check CoinGecko API server status',
       version: '3.0.0',
       root: 'https://api.coingecko.com/api/v3',
       requiredServerParams: [],
       requiredLibraries: [],
       headers: {},
       tools: {
           ping: {
               method: 'GET',
               path: '/ping',
               description: 'Check if CoinGecko API is online',
               parameters: [],
               output: {
                   mimeType: 'application/json',
                   schema: {
                       type: 'object',
                       properties: {
                           gecko_says: { type: 'string', description: 'Response message' }
                       }
                   }
               }
           }
       }
   }
   ```

   Dieses Schema deklariert ein einzelnes Tool, das den CoinGecko-Ping-Endpoint aufruft. Kein API-Key erforderlich.

3. **Validieren und Aufrufen**

   Erstelle eine Datei namens `test.mjs`:

   ```javascript
   import { FlowMCP } from 'flowmcp-core'
   import { main } from './coingecko-ping.mjs'

   // Schema validieren
   const { status, messages } = FlowMCP.validateSchema( { schema: main } )
   console.log( status ? 'Schema valid!' : messages )

   // API aufrufen
   const result = await FlowMCP.fetch( {
       schema: main,
       routeName: 'ping',
       userParams: {},
       serverParams: {}
   } )

   console.log( result.dataAsString )
   // → {"gecko_says":"(V3) To the Moon!"}
   ```

   Ausfuehren:

   ```bash
   node test.mjs
   ```

   Du solltest `Schema valid!` gefolgt von der CoinGecko-Ping-Antwort sehen.

4. **Als MCP Server starten**

   Erstelle eine Datei namens `server.mjs`, um dein Schema als MCP Tool bereitzustellen:

   ```javascript
   import { FlowMCP } from 'flowmcp-core'
   import { Server } from '@modelcontextprotocol/sdk/server/index.js'
   import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
   import { main } from './coingecko-ping.mjs'

   const server = new Server(
       { name: 'my-first-server', version: '1.0.0' },
       { capabilities: { tools: {} } }
   )

   FlowMCP.activateServerTools( { server, schemas: [main] } )

   const transport = new StdioServerTransport()
   await server.connect( transport )
   ```

   Installiere das MCP SDK:

   ```bash
   npm install @modelcontextprotocol/sdk
   ```

   Starte den Server:

   ```bash
   node server.mjs
   ```

   Dein MCP Server laeuft jetzt ueber stdio. KI-Clients wie Claude Desktop koennen sich verbinden und das `coingecko__ping` Tool aufrufen.

:::tip
Der Tool-Name wird automatisch aus `namespace` + Tool-Name generiert: **coingecko__ping**. KI-Clients sehen diesen Namen zusammen mit der Tool-Beschreibung, um zu entscheiden, wann sie es aufrufen.
:::

## Was ist gerade passiert?

1. Du hast einen API-Endpoint als Schema deklariert (kein Servercode noetig)
2. FlowMCP hat die Schema-Struktur validiert
3. FlowMCP hat die API mit korrekter URL-Konstruktion und Headern aufgerufen
4. FlowMCP hat das Schema als MCP Tool mit automatisch generierter Zod-Validierung bereitgestellt

Das gleiche Muster funktioniert fuer jede REST API — fuege Authentifizierung via `requiredServerParams` und `headers` hinzu, Parameter via das `parameters` Array, Antwort-Transformation via den `handlers` Export.

## Naechste Schritte

:::note[Schema-Erstellung]
Lerne das vollstaendige Schema-Format mit Authentifizierung, Parametern und Handlern. Siehe [Schema-Erstellung](/de/docs/guides/schema-creation/).
:::

:::note[CLI-Referenz]
Suche, aktiviere und rufe 187+ vorgefertigte Schemas von der Kommandozeile auf. Siehe [CLI-Referenz](/de/docs/guides/cli-reference/).
:::

:::note[Beispiele]
Praxisnahe Schema-Beispiele fuer gaengige APIs. Siehe [Beispiele](/de/docs/guides/examples/).
:::
