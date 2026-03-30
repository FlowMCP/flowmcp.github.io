---
title: Kern-Methoden
description: Vollstaendige FlowMCP Core Methoden-Referenz
---

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

:::tip
`validateMain()` waehrend der Entwicklung verwenden, um Schema-Fehler frueh zu erkennen. In Produktion `loadSchema()` verwenden, das Validierung als Teil der vollstaendigen Pipeline einschliesst.
:::

### .scanSecurity()

Fuehrt einen statischen Sicherheitsscan auf einer Schema-Datei aus. Prueft auf verbotene Muster wie `import`-Statements, `require()`-Aufrufe, Dateisystemzugriff, `eval()` und andere unerlaubte Konstrukte.

**Methode**
```javascript
const { status, messages } = await FlowMCP.scanSecurity( { filePath } )
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

### .interpolateEnum()

Interpoliert Shared-List-Werte in einen Enum-Template-String. Ersetzt `$listName`-Referenzen durch tatsaechliche Werte aus aufgeloesten Shared Lists.

**Methode**
```javascript
const { result } = FlowMCP.interpolateEnum( { template, sharedLists } )
```

### .loadLibraries()

Laedt npm-Pakete, die in `requiredLibraries` eines Schemas deklariert sind. Nur Pakete auf der Allowlist koennen geladen werden. Dies erzwingt das Zero-Import-Sicherheitsmodell.

**Methode**
```javascript
const { libraries } = await FlowMCP.loadLibraries( { requiredLibraries, allowlist } )
```

### .getDefaultAllowlist()

Gibt die Standard-Library-Allowlist zurueck. Das sind die npm-Pakete, die Handler ueber Dependency Injection verwenden duerfen.

**Methode**
```javascript
const { allowlist } = FlowMCP.getDefaultAllowlist()
```

---

## Handler-Verwaltung

### .createHandlers()

Erstellt eine Handler-Map durch Aufruf der `handlers`-Factory-Funktion mit injizierten Abhaengigkeiten. Die resultierende Map ist nach Tool-Name geschluesselt und enthaelt `preProcess`- und `postProcess`-Funktionen.

**Methode**
```javascript
const { handlerMap } = FlowMCP.createHandlers( { handlersFn, sharedLists, libraries, routeNames } )
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

### .adaptLegacy()

Konvertiert ein v1-Schema-Objekt in das v2-Zwei-Export-Format. Gibt den adaptierten `main`-Export, optionale Handler-Factory-Funktion und Konvertierungswarnungen zurueck.

**Methode**
```javascript
const { main, handlersFn, hasHandlers, warnings } = FlowMCP.adaptLegacy( { legacySchema } )
```

---

## Output-Schema-Generierung

### .generateOutputSchema()

Generiert ein Output-Schema aus einer erfassten API-Antwort. Das Output-Schema deklariert die erwartete Antwortstruktur fuer nachgelagerte Konsumenten und Dokumentation.

**Methode**
```javascript
const { output } = FlowMCP.generateOutputSchema( { response, mimeType } )
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

:::caution
Die v1-API wird fuer Rueckwaertskompatibilitaet gepflegt, erhaelt aber keine neuen Features. Alle neuen Schemas sollten das v3-Format verwenden.
:::

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

Fuer MCP-Server-Integration siehe den [Server-Integration-Guide](/de/docs/guides/server-integration).
