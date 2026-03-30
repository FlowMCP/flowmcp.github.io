---
title: Wie es funktioniert
description: "FlowMCP-Architektur und Datenfluss vom Schema zum KI-Tool"
---

## Architektur-Ueberblick

FlowMCP transformiert deklarative Schema-Dateien in MCP Tools, die KI-Clients aufrufen koennen. Daten fliessen durch vier Schichten:

```
Web-Datenquellen → Schemas → Core Runtime → MCP Server → KI-Client
    (APIs)          (.mjs)    (FlowMCP)      (stdio/HTTP)   (Claude, etc.)
```

Die Schema-Schicht ist dein Arbeitsbereich. Alles andere wird von der Runtime uebernommen.

## Die vier Schritte

1. **Definieren**

   Schreibe ein Schema als `.mjs`-Datei. Jedes Schema deklariert ein oder mehrere API-Tools mit ihren Endpoints, Parametern, Authentifizierung und erwarteten Antworten.

   ```javascript
   // coingecko-ping.mjs
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
               parameters: []
           }
       }
   }
   ```

2. **Validieren**

   FlowMCP Core validiert dein Schema gegen Validierungsregeln, die Struktur, Namenskonventionen, Parameterformate, Sicherheitsbeschraenkungen und Output-Deklarationen abdecken.

   ```javascript
   import { FlowMCP } from 'flowmcp-core'
   import { main } from './coingecko-ping.mjs'

   const { status, messages } = FlowMCP.validateSchema( { schema: main } )
   // status: true — Schema ist gueltig
   // messages: [] — keine Validierungsfehler
   ```

   Validierung erkennt Probleme zur Entwicklungszeit — bevor dein Schema die Produktion erreicht.

3. **Aktivieren**

   FlowMCP Core transformiert dein Schema in MCP Tools mit automatisch generierter Zod-Validierung fuer jeden Parameter. Ein Schema mit 5 Tools wird zu 5 MCP Tools.

   ```javascript
   import { Server } from '@modelcontextprotocol/sdk/server/index.js'

   const server = new Server(
       { name: 'my-server', version: '1.0.0' },
       { capabilities: { tools: {} } }
   )

   FlowMCP.activateServerTools( { server, schemas: [main] } )
   // Registriert: coingecko__ping als MCP Tool
   ```

4. **Nutzen**

   KI-Clients entdecken und rufen deine Tools ueber das MCP-Protokoll auf. Der Client sieht Tool-Namen, Beschreibungen und Input-Schemas — alles, was fuer fundierte Tool-Aufrufe noetig ist.

   ```
   KI-Client: "Welche Tools sind verfuegbar?"
   MCP Server: [coingecko__ping] — Check if CoinGecko API is online

   KI-Client: ruft coingecko__ping({}) auf
   MCP Server: { "gecko_says": "(V3) To the Moon!" }
   ```

## Schema-Anatomie

Jedes FlowMCP v3.0.0 Schema nutzt das **Two-Export-Pattern**:

### main (erforderlich)

Der `main` Export ist ein einfaches JavaScript-Objekt, das alles ueber deine API-Endpoints deklariert. Es ist JSON-serialisierbar und kann fuer Integritaetspruefungen gehasht werden.

```javascript
export const main = {
    // Identitaet
    namespace: 'provider',       // Provider-Name (Kleinbuchstaben)
    name: 'ToolName',            // Lesbarer Name
    description: 'What it does', // Wird von KI-Clients genutzt
    version: '3.0.0',            // Schema-Format-Version

    // Verbindung
    root: 'https://api.example.com', // Basis-URL
    requiredServerParams: ['API_KEY'], // Serverseitige Secrets
    requiredLibraries: [],        // Erlaubte npm-Pakete
    headers: {                    // Request-Header
        'Authorization': 'Bearer {{API_KEY}}'
    },

    // Tools (API Endpoints)
    tools: {
        toolName: {
            method: 'GET',
            path: '/endpoint/{{PARAM}}',
            description: 'What this tool does',
            parameters: [/* ... */],
            output: {/* ... */}
        }
    },

    // Resources (optional, SQLite schreibgeschuetzte Daten)
    resources: {
        resourceName: {
            description: 'Read-only data lookup',
            source: 'sqlite',
            database: 'data.db',
            queries: { /* ... */ }
        }
    },

    // Skills (optional, KI-Agent-Anweisungen)
    skills: [
        { name: 'skill-name', file: 'skill-name.mjs', description: 'What this skill does' }
    ]
}
```

### handlers (optional)

Der `handlers` Export ist eine **Factory-Funktion**, die injizierte Abhaengigkeiten empfaengt und Handler-Funktionen nach Tool-Name zurueckgibt. Verwende ihn, wenn API-Antworten transformiert werden muessen.

```javascript
export const handlers = ( { sharedLists, libraries } ) => ({
    toolName: {
        postProcess: ( { data } ) => {
            // Die rohe API-Antwort transformieren
            const parsed = JSON.parse( data )
            const summary = parsed.results
                .map( ( item ) => `${item.name}: ${item.value}` )
                .join( '\n' )

            return summary
        }
    }
})
```

Das Factory-Pattern stellt sicher:
- Keine freien Imports — Abhaengigkeiten werden injiziert
- Shared Lists sind ohne Dateizugriff verfuegbar
- Libraries sind via `requiredLibraries` vorab genehmigt

## Parameter-Fluss

Wenn ein KI-Client ein FlowMCP Tool aufruft, durchlaeuft der Request mehrere Stufen:

```
User Input          →  Zod-Validierung    →  URL-Konstruktion     →  API-Aufruf
{ "id": "bitcoin" }    Validiert Typen,       Ersetzt {{ID}} in      GET https://api.
                       Laengen, Formate       Pfad und Query         coingecko.com/...

                                                                         ↓

MCP-Antwort         ←  Handler (optional)  ←  Rohe Antwort
{ content: [...] }     postProcess()          { "bitcoin": { ... } }
                       transformiert Daten
```

Jede Stufe ist deterministisch: gleiche Eingabe erzeugt immer den gleichen API-Aufruf. Parameter-Validierung nutzt Zod-Schemas, die automatisch aus dem `parameters` Array im Schema generiert werden.

## Shared Lists

Manche Parameterwerte sind schema-uebergreifend wiederverwendbar — Chain IDs, Token-Symbole, Protokollnamen. Statt dass jedes Schema diese unabhaengig definiert, injiziert FlowMCP **Shared Lists** zur Ladezeit.

```javascript
// Im Schema — eine Shared List referenzieren
parameters: [
    {
        position: { key: 'chain', value: '{{CHAIN}}', location: 'insert' },
        z: { primitive: 'enum()', options: ['$chainIds'] }
        //                                  ^ wird zur Laufzeit injiziert
    }
]

// In Handlern — auf Shared Lists zugreifen
export const handlers = ( { sharedLists } ) => ({
    toolName: {
        postProcess: ( { data } ) => {
            const chainName = sharedLists.chainIds[data.chainId]
            return `Chain: ${chainName}`
        }
    }
})
```

Das haelt Schemas DRY und stellt Konsistenz ueber Provider hinweg sicher.

## Sicherheitsmodell

FlowMCP erzwingt Sicherheit auf Schema-Ebene:

| Beschraenkung | Zweck |
|---------------|-------|
| **Null Imports** | Schemas koennen weder `import` noch `require` verwenden — alle Abhaengigkeiten werden injiziert |
| **Library-Allowlist** | Nur in `requiredLibraries` deklarierte Pakete sind in Handlern verfuegbar |
| **Statischer Scan** | Schemas werden zur Ladezeit auf verbotene Muster analysiert |
| **Server Params** | API-Keys bleiben serverseitig — niemals fuer KI-Clients sichtbar |
| **Integritaets-Hash** | Der `main` Export kann gehasht werden, um Schema-Manipulation zu erkennen |

:::caution
Schemas, die versuchen Module zu importieren, auf das Dateisystem zuzugreifen oder nicht deklarierte Libraries zu nutzen, werden zur Ladezeit abgelehnt. Das ist beabsichtigt — es schuetzt sowohl den Server-Betreiber als auch den KI-Client.
:::

:::note
Fuer die vollstaendige Spezifikation einschliesslich aller Validierungsregeln, Parameterformate und Sicherheitsdetails, siehe die [Spezifikation v3.0.0](/de/docs/specification/overview/).
:::
