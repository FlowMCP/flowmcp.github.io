---
title: Programmatic API
description: Vollstaendige FlowMCP Core Methoden-Referenz
---
<!-- PAGEFIND-META-START -->
<span style="display:none" data-pagefind-meta="section">Reference</span>
<!-- PAGEFIND-META-END -->

Vollstaendige Referenz aller oeffentlichen Methoden in `flowmcp-core`. Methoden sind nach Verwendungskategorie organisiert. Alle Methoden sind statisch.

```javascript
import { FlowMCP } from 'flowmcp-core'
```

:::note
FlowMCP Core exportiert sowohl v3 (Standard) als auch Legacy-APIs. Diese Referenz behandelt die aktuelle v3-API. Fuer v1-Methoden importiere aus `flowmcp-core/v1`.
:::

## Methodenuebersicht

| Methode | Zweck | Rueckgabe |
|---------|-------|-----------|
| `.loadSchema()` | Schema-Datei laden und validieren | `{ status, main, handlerMap }` |
| `.validateMain()` | main-Export gegen Validierungsregeln pruefen | `{ status, messages }` |
| `.scanSecurity()` | Sicherheitsscan auf Schema-Datei ausfuehren | `{ status, messages }` |
| `.fetch()` | API-Request fuer ein Tool ausfuehren | `{ status, dataAsString, messages }` |
| `.resolveSharedLists()` | Shared-List-Referenzen aufloesen | `{ sharedLists }` |
| `.interpolateEnum()` | Shared-List-Werte in Enum-Templates interpolieren | `{ result }` |
| `.loadLibraries()` | Deklarierte Libraries aus Allowlist laden | `{ libraries }` |
| `.createHandlers()` | Handler-Map aus Factory-Funktion erstellen | `{ handlerMap }` |
| `.detectLegacy()` | Erkennen, ob ein Modul v1-Format verwendet | `{ isLegacy, format }` |
| `.adaptLegacy()` | v1-Schema in v2-Format konvertieren | `{ main, handlersFn, hasHandlers, warnings }` |
| `.getDefaultAllowlist()` | Standard-Library-Allowlist abrufen | `{ allowlist }` |
| `.generateOutputSchema()` | Output-Schema aus API-Antwort generieren | `{ output }` |

---

## Schema laden und validieren

### .loadSchema()

Laedt eine `.mjs`-Schema-Datei, fuehrt Security-Scanning durch, validiert den `main`-Export, loest Shared Lists auf, laedt deklarierte Libraries, erstellt die Handler-Map und verarbeitet Resources und Skills. Dies ist der primaere Einstiegspunkt fuer die Arbeit mit Schemas.

**Methode**
```javascript
const result = await FlowMCP.loadSchema( { filePath, listsDir, allowlist } )
```

**Parameter**

| Key | Typ | Beschreibung | Erforderlich |
|-----|-----|-------------|-------------|
| `filePath` | string | Absoluter oder relativer Pfad zur `.mjs`-Schema-Datei | Ja |
| `listsDir` | string | Verzeichnis mit Shared-List-Dateien | Nein |
| `allowlist` | array | Erlaubte Library-Namen fuer Handler. Standard wenn ausgelassen | Nein |

**Beispiel**
```javascript
import { FlowMCP } from 'flowmcp-core'

const { status, main, handlerMap } = await FlowMCP.loadSchema( {
    filePath: './schemas/coingecko-price.mjs'
} )

if( !status ) {
    console.error( 'Schema loading failed' )
}

// Das geladene Schema nutzen
const result = await FlowMCP.fetch( {
    main,
    handlerMap,
    userParams: { id: 'bitcoin' },
    serverParams: {},
    routeName: 'getPrice'
} )
```

**Rueckgabe**
```javascript
{
    status: true,          // false wenn Laden, Validierung oder Security-Scan fehlschlagen
    main: { ... },         // Das validierte main-Export-Objekt (mit tools, resources, skills)
    handlerMap: { ... }    // Tool-basierte Handler-Funktionen (leeres Objekt ohne Handler)
}
```

### .validateMain()

Validiert ein `main`-Export-Objekt gegen die FlowMCP-Spezifikation. Fuehrt Validierungsregeln in Kategorien wie Struktur, Benennung, Parameter, Sicherheit, Output-Deklarationen, Resources und Skills aus.

**Methode**
```javascript
const { status, messages } = FlowMCP.validateMain( { main } )
```

**Parameter**

| Key | Typ | Beschreibung | Erforderlich |
|-----|-----|-------------|-------------|
| `main` | object | Der `main`-Export aus einer Schema-Datei. Akzeptiert sowohl `tools` als auch `routes` (veralteter Alias) | Ja |

**Beispiel**
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

**Rueckgabe**
```javascript
{
    status: true,      // true wenn alle Regeln bestehen
    messages: []       // Array mit Fehlermeldungen, wenn status false ist
}
```

:::tip
`validateMain()` waehrend der Entwicklung verwenden, um Schema-Fehler frueh zu erkennen. In Produktion `loadSchema()` verwenden, das Validierung als Teil der vollstaendigen Pipeline einschliesst.
:::

### .scanSecurity()

Fuehrt einen statischen Sicherheitsscan auf einer Schema-Datei aus. Prueft auf verbotene Muster wie `import`-Statements, `require()`-Aufrufe, Dateisystemzugriff, `eval()` und andere unerlaubte Konstrukte.

**Methode**
```javascript
const { status, messages } = await FlowMCP.scanSecurity( { filePath } )
```

**Parameter**

| Key | Typ | Beschreibung | Erforderlich |
|-----|-----|-------------|-------------|
| `filePath` | string | Pfad zur zu scannenden `.mjs`-Schema-Datei | Ja |

**Beispiel**
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

**Rueckgabe**
```javascript
{
    status: true,      // false wenn verbotene Muster erkannt werden
    messages: []       // Beschreibungen der Sicherheitsverletzungen
}
```

---

## Ausfuehrung

### .fetch()

Fuehrt einen HTTP-Request fuer ein bestimmtes Tool mit dem geladenen Schema aus. Behandelt Parameter-Substitution, URL-Konstruktion, Header-Injection und optionale Pre/Post-Verarbeitung ueber Handler.

**Methode**
```javascript
const result = await FlowMCP.fetch( { main, handlerMap, userParams, serverParams, routeName } )
```

**Parameter**

| Key | Typ | Beschreibung | Erforderlich |
|-----|-----|-------------|-------------|
| `main` | object | Der validierte `main`-Export aus einem Schema | Ja |
| `handlerMap` | object | Handler-Map aus `loadSchema()` oder `createHandlers()` | Ja |
| `userParams` | object | Vom Benutzer bereitgestellte Parameter (KI-Client-Eingabe) | Ja |
| `serverParams` | object | Serverseitige Parameter (API-Schluessel, Tokens) | Ja |
| `routeName` | string | Name des auszufuehrenden Tools | Ja |

**Beispiel**
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

**Rueckgabe**
```javascript
{
    status: true,                              // false wenn der Request fehlschlaegt
    dataAsString: '{"bitcoin":{"usd":45000}}', // Response-Body als String
    messages: []                               // Fehlermeldungen, wenn status false ist
}
```

:::caution
Das `serverParams`-Objekt sollte API-Schluessel und Secrets enthalten. Diese Werte werden zur Laufzeit in Header und Parameter injiziert, aber niemals KI-Clients offengelegt.
:::

---

## Shared Lists und Abhaengigkeiten

### .resolveSharedLists()

Loest Shared-List-Referenzen aus einem Verzeichnis mit List-Dateien auf. Shared Lists sind wiederverwendbare Wertsammlungen (Chain-IDs, Token-Symbole, Protokoll-Namen), die Schemas ueber `$listName`-Syntax in Enum-Parametern referenzieren.

**Methode**
```javascript
const { sharedLists } = await FlowMCP.resolveSharedLists( { sharedListRefs, listsDir } )
```

**Parameter**

| Key | Typ | Beschreibung | Erforderlich |
|-----|-----|-------------|-------------|
| `sharedListRefs` | array | Array von Shared-List-Referenzen aus dem Schema | Ja |
| `listsDir` | string | Verzeichnispfad mit Shared-List `.mjs`-Dateien | Ja |

**Beispiel**
```javascript
import { FlowMCP } from 'flowmcp-core'

const { sharedLists } = await FlowMCP.resolveSharedLists( {
    sharedListRefs: [ 'evmChains', 'stablecoins' ],
    listsDir: './lists/'
} )

console.log( 'Resolved lists:', Object.keys( sharedLists ) )
// Output: ['evmChains', 'stablecoins']
```

**Rueckgabe**
```javascript
{
    sharedLists: {
        evmChains: [ 'ethereum', 'polygon', 'arbitrum', ... ],
        stablecoins: [ 'USDT', 'USDC', 'DAI', ... ]
    }
}
```

### .interpolateEnum()

Interpoliert Shared-List-Werte in einen Enum-Template-String. Ersetzt `$listName`-Referenzen durch tatsaechliche Werte aus aufgeloesten Shared Lists.

**Methode**
```javascript
const { result } = FlowMCP.interpolateEnum( { template, sharedLists } )
```

**Parameter**

| Key | Typ | Beschreibung | Erforderlich |
|-----|-----|-------------|-------------|
| `template` | string | Enum-Template mit `$listName`-Referenzen | Ja |
| `sharedLists` | object | Aufgeloeste Shared Lists aus `resolveSharedLists()` | Ja |

**Beispiel**
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

**Rueckgabe**
```javascript
{
    result: [ 'ethereum', 'polygon', 'arbitrum' ]  // Aufgeloeste Enum-Werte
}
```

### .loadLibraries()

Laedt npm-Pakete, die in `requiredLibraries` eines Schemas deklariert sind. Nur Pakete auf der Allowlist koennen geladen werden. Dies erzwingt das Zero-Import-Sicherheitsmodell.

**Methode**
```javascript
const { libraries } = await FlowMCP.loadLibraries( { requiredLibraries, allowlist } )
```

**Parameter**

| Key | Typ | Beschreibung | Erforderlich |
|-----|-----|-------------|-------------|
| `requiredLibraries` | array | Im Schema deklarierte Library-Namen | Ja |
| `allowlist` | array | Erlaubte Library-Namen. `getDefaultAllowlist()` fuer Standardwerte verwenden | Ja |

**Beispiel**
```javascript
import { FlowMCP } from 'flowmcp-core'

const { allowlist } = FlowMCP.getDefaultAllowlist()

const { libraries } = await FlowMCP.loadLibraries( {
    requiredLibraries: [ 'ethers' ],
    allowlist
} )

// libraries.ethers ist nun fuer Handler-Injection verfuegbar
```

**Rueckgabe**
```javascript
{
    libraries: {
        ethers: { ... }  // Das geladene Library-Modul
    }
}
```

### .getDefaultAllowlist()

Gibt die Standard-Library-Allowlist zurueck. Das sind die npm-Pakete, die Handler ueber Dependency Injection verwenden duerfen.

**Methode**
```javascript
const { allowlist } = FlowMCP.getDefaultAllowlist()
```

**Parameter**

Keine.

**Beispiel**
```javascript
import { FlowMCP } from 'flowmcp-core'

const { allowlist } = FlowMCP.getDefaultAllowlist()
console.log( 'Allowed libraries:', allowlist )
```

**Rueckgabe**
```javascript
{
    allowlist: [ 'ethers', 'viem', ... ]  // Array erlaubter Library-Namen
}
```

---

## Handler-Verwaltung

### .createHandlers()

Erstellt eine Handler-Map durch Aufruf der `handlers`-Factory-Funktion mit injizierten Abhaengigkeiten. Die resultierende Map ist nach Tool-Name geschluesselt und enthaelt `preProcess`- und `postProcess`-Funktionen.

**Methode**
```javascript
const { handlerMap } = FlowMCP.createHandlers( { handlersFn, sharedLists, libraries, routeNames } )
```

**Parameter**

| Key | Typ | Beschreibung | Erforderlich |
|-----|-----|-------------|-------------|
| `handlersFn` | function | Die `handlers`-Factory-Funktion aus einem Schema | Ja |
| `sharedLists` | object | Aufgeloeste Shared Lists fuer die Injection | Ja |
| `libraries` | object | Geladene Libraries fuer die Injection | Ja |
| `routeNames` | array | Erwartete Tool-Namen zur Validierung | Ja |

**Beispiel**
```javascript
import { FlowMCP } from 'flowmcp-core'
import { handlers } from './schemas/my-schema.mjs'

const { handlerMap } = FlowMCP.createHandlers( {
    handlersFn: handlers,
    sharedLists: { evmChains: [ 'ethereum', 'polygon' ] },
    libraries: {},
    routeNames: [ 'getPrice', 'getHistory' ]
} )

// handlerMap.getPrice.postProcess ist nun verfuegbar
```

**Rueckgabe**
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
`createHandlers()` muss selten direkt aufgerufen werden. Die `loadSchema()`-Pipeline behandelt die Handler-Erstellung automatisch. Verwende diese Methode, wenn du manuelle Kontrolle ueber den Dependency-Injection-Prozess benoetigst.
:::

---

## Legacy-Kompatibilitaet

### .detectLegacy()

Erkennt, ob ein geladenes Modul das v1-Schema-Format verwendet. Gibt die erkannte Format-Version zurueck.

**Methode**
```javascript
const { isLegacy, format } = FlowMCP.detectLegacy( { module } )
```

**Parameter**

| Key | Typ | Beschreibung | Erforderlich |
|-----|-----|-------------|-------------|
| `module` | object | Das importierte Modul aus einer `.mjs`-Schema-Datei | Ja |

**Beispiel**
```javascript
import { FlowMCP } from 'flowmcp-core'

const schemaModule = await import( './schemas/old-schema.mjs' )
const { isLegacy, format } = FlowMCP.detectLegacy( { module: schemaModule } )

if( isLegacy ) {
    console.log( `Legacy format detected: ${format}` )
    // Mit adaptLegacy() konvertieren
}
```

**Rueckgabe**
```javascript
{
    isLegacy: true,    // true wenn das Modul v1-Format verwendet
    format: 'v1'       // Erkannte Format-Version als String
}
```

### .adaptLegacy()

Konvertiert ein v1-Schema-Objekt in das v2-Zwei-Export-Format. Gibt den adaptierten `main`-Export, optionale Handler-Factory-Funktion und Konvertierungswarnungen zurueck.

**Methode**
```javascript
const { main, handlersFn, hasHandlers, warnings } = FlowMCP.adaptLegacy( { legacySchema } )
```

**Parameter**

| Key | Typ | Beschreibung | Erforderlich |
|-----|-----|-------------|-------------|
| `legacySchema` | object | Ein Schema-Objekt im v1-Format | Ja |

**Beispiel**
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

// Das adaptierte Schema mit aktuellen Methoden verwenden
const result = await FlowMCP.fetch( {
    main,
    handlerMap: {},
    userParams: { ... },
    serverParams: {},
    routeName: 'myRoute'
} )
```

**Rueckgabe**
```javascript
{
    main: { ... },             // Konvertierter main-Export
    handlersFn: Function|null, // Handler-Factory (null wenn keine Handler)
    hasHandlers: false,        // Ob das Schema Handler hatte
    warnings: []               // Konvertierungswarnungen (veraltete Features etc.)
}
```

---

## Output-Schema-Generierung

### .generateOutputSchema()

Generiert ein Output-Schema aus einer erfassten API-Antwort. Das Output-Schema deklariert die erwartete Antwortstruktur fuer nachgelagerte Konsumenten und Dokumentation.

**Methode**
```javascript
const { output } = FlowMCP.generateOutputSchema( { response, mimeType } )
```

**Parameter**

| Key | Typ | Beschreibung | Erforderlich |
|-----|-----|-------------|-------------|
| `response` | string | Roher API-Response-Body | Ja |
| `mimeType` | string | Response-MIME-Typ (z. B. `application/json`) | Ja |

**Beispiel**
```javascript
import { FlowMCP } from 'flowmcp-core'

const { output } = FlowMCP.generateOutputSchema( {
    response: '{"bitcoin":{"usd":45000,"eur":38000}}',
    mimeType: 'application/json'
} )

console.log( output )
// { type: 'object', fields: { bitcoin: { type: 'object', fields: { ... } } } }
```

**Rueckgabe**
```javascript
{
    output: {
        type: 'object',
        fields: { ... }    // Abgeleitete Feldstruktur aus der Antwort
    }
}
```

:::tip
Diese Methode waehrend der Schema-Entwicklung verwenden, um den `output`-Block fuer deine Tools automatisch zu generieren. Eine echte API-Antwort mit `fetch()` erfassen, dann an `generateOutputSchema()` uebergeben.
:::

---

## v1 API (Legacy)

Die v1-API ist weiterhin fuer Rueckwaertskompatibilitaet verfuegbar. Separat importieren:

```javascript
import { v1 } from 'flowmcp-core'
const { FlowMCP } = v1
```

<details>
<summary>v1-Methodenuebersicht</summary>

Die v1-API verwendet ein flaches Schema-Format (Einzelexport) mit anderen Methoden-Signaturen.

| Methode | v1-Signatur | Aktuelles Aequivalent |
|--------|-------------|---------------|
| `.validateSchema()` | `FlowMCP.validateSchema( { schema } )` | `.validateMain( { main } )` |
| `.fetch()` | `FlowMCP.fetch( { schema, userParams, serverParams, routeName } )` | `.fetch( { main, handlerMap, ... } )` |
| `.activateServerTools()` | `FlowMCP.activateServerTools( { server, schema, serverParams } )` | MCP-SDK direkt mit `.loadSchema()` verwenden |
| `.activateServerTool()` | `FlowMCP.activateServerTool( { server, schema, routeName, serverParams } )` | MCP-SDK direkt verwenden |
| `.prepareServerTool()` | `FlowMCP.prepareServerTool( { schema, serverParams, routeName } )` | `.loadSchema()` + `.fetch()` verwenden |
| `.filterArrayOfSchemas()` | `FlowMCP.filterArrayOfSchemas( { arrayOfSchemas, ... } )` | Gleich (nur v1) |
| `.getArgvParameters()` | `FlowMCP.getArgvParameters( { argv } )` | Gleich (nur v1) |
| `.getZodInterfaces()` | `FlowMCP.getZodInterfaces( { schema } )` | Zod-Schemas werden waehrend `.loadSchema()` generiert |
| `.getAllTests()` | `FlowMCP.getAllTests( { schema } )` | Testwerte stehen in den `test`-Feldern der Parameter |

:::caution
Die v1-API wird fuer Rueckwaertskompatibilitaet gepflegt, erhaelt aber keine neuen Features. Alle neuen Schemas sollten das v3-Format verwenden.
:::

</details>

---

## Typischer Workflow

Der Standard-Workflow fuer die Nutzung von FlowMCP Core kombiniert diese Methoden:

```javascript
import { FlowMCP } from 'flowmcp-core'

// 1. Schema laden (validiert, scannt Sicherheit, loest Listen auf, erstellt Handler)
const { status, main, handlerMap } = await FlowMCP.loadSchema( {
    filePath: './schemas/coingecko-price.mjs'
} )

if( !status ) {
    throw new Error( 'Schema loading failed' )
}

// 2. Tool ausfuehren
const result = await FlowMCP.fetch( {
    main,
    handlerMap,
    userParams: { id: 'bitcoin' },
    serverParams: { API_KEY: process.env.COINGECKO_KEY },
    routeName: 'getPrice'
} )

// 3. Ergebnis verwenden
if( result.status ) {
    console.log( 'Price data:', result.dataAsString )
} else {
    console.error( 'Errors:', result.messages )
}
```

Fuer MCP-Server-Integration siehe den [Server-Integration-Guide](/de/guides/server-integration).
