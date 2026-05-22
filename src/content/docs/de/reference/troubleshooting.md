---
title: Fehlerbehebung
description: Haeufige Probleme und Loesungen fuer FlowMCP
---
<!-- PAGEFIND-META-START -->
<span style="display:none" data-pagefind-meta="section">Docs > Reference</span>
<!-- PAGEFIND-META-END -->

Loesungen fuer haeufige Probleme bei der Arbeit mit FlowMCP-Schemas, Servern und Integrationen.

## Schema-Validierungsfehler

<details>
<summary>Namespace-Formatfehler</summary>

**Fehler:** `namespace must contain only lowercase letters`

Das `namespace`-Feld akzeptiert nur Kleinbuchstaben `a-z`. Keine Zahlen, Bindestriche, Unterstriche oder Grossbuchstaben.

```javascript
// Falsch
namespace: 'github-api'   // keine Bindestriche
namespace: 'api2'         // keine Zahlen
namespace: 'CoinGecko'    // keine Grossbuchstaben

// Richtig
namespace: 'github'
namespace: 'coingecko'
```
</details>

<details>
<summary>Versions-Feldfehler</summary>

**Fehler:** `version must be a valid semver string`

Das `version`-Feld muss ein vollstaendiger Semver-String ohne Praefix sein.

```javascript
// Falsch
version: '2.0'        // Patch fehlt
version: 'v2.0.0'     // kein 'v'-Praefix
version: '2'           // kein Semver

// Richtig
version: '2.0.0'
```
</details>

<details>
<summary>Parameter-Strukturfehler</summary>

**Fehler:** `parameter must have position and z fields`

Jeder Parameter in v2.0.0 braucht einen `position`-Block und einen `z`-Block.

```javascript
// Falsch - z-Block fehlt
parameters: [
    { position: { key: 'id', value: '{{ID}}', location: 'insert' } }
]

// Richtig
parameters: [
    {
        position: { key: 'id', value: '{{ID}}', location: 'insert' },
        z: { primitive: 'string()', options: [] }
    }
]
```
</details>

<details>
<summary>Route-Limit ueberschritten</summary>

**Fehler:** `schema exceeds maximum of 8 routes`

v2.0.0 begrenzt Schemas auf maximal 8 Routes. Grosse Schemas in mehrere Dateien aufteilen, gruppiert nach Endpunkt-Typ.

```javascript
// Falsch - zu viele Routes in einem Schema
tools: {
    route1: { ... }, route2: { ... }, route3: { ... },
    route4: { ... }, route5: { ... }, route6: { ... },
    route7: { ... }, route8: { ... }, route9: { ... }  // 9. Route schlaegt fehl
}

// Richtig - in separate Schema-Dateien aufteilen
// coingecko-price.mjs  (3 Routes)
// coingecko-market.mjs (4 Routes)
// coingecko-info.mjs   (2 Routes)
```
</details>

<details>
<summary>Fehlende Pflichtfelder</summary>

**Fehler:** `main.root is required` oder `main.requiredServerParams is required`

v2.0.0 erfordert mehrere Felder, die in v1 optional waren. Vollstaendige Liste pruefen:

```javascript
export const main = {
    namespace: 'provider',           // Erforderlich
    name: 'Display Name',            // Erforderlich
    description: 'What it does',     // Erforderlich
    version: '2.0.0',               // Erforderlich
    root: 'https://api.example.com', // Erforderlich
    requiredServerParams: [],        // Erforderlich (leeres Array wenn keine)
    requiredLibraries: [],           // Erforderlich (leeres Array wenn keine)
    headers: {},                     // Erforderlich (leeres Objekt wenn keine)
    tools: { ... }                  // Erforderlich (mindestens eine Route)
}
```
</details>

## Server-Startprobleme

<details>
<summary>Port bereits belegt</summary>

**Fehler:** `EADDRINUSE: address already in use :::3000`

Ein anderer Prozess belegt den Port. Finden und stoppen:

```bash
# Pruefen, was Port 3000 belegt
lsof -i :3000

# Prozess per PID beenden
kill <PID>

# Oder anderen Port verwenden
PORT=3001 node server.mjs
```
</details>

<details>
<summary>Fehlende Umgebungsvariablen</summary>

**Fehler:** `Required server parameter API_KEY is not set`

Das Schema deklariert `requiredServerParams`, die in der Umgebung vorhanden sein muessen.

```bash
# Pruefen, ob Variable gesetzt ist
echo $API_KEY

# Variable setzen
export API_KEY=your_key_here

# Oder inline uebergeben
API_KEY=your_key_here node server.mjs
```

:::tip
API-Schluessel niemals in Git committen. `.env`-Dateien (mit `.gitignore`) oder Umgebungsvariablen im Shell-Profil verwenden.
:::
</details>

<details>
<summary>MCP SDK Versionskonflikt</summary>

**Fehler:** `Cannot find module '@modelcontextprotocol/sdk'` oder unerwartete API-Fehler

Kompatible MCP-SDK-Version sicherstellen:

```bash
# Installierte Version pruefen
npm ls @modelcontextprotocol/sdk

# Aktuelle Version installieren
npm install @modelcontextprotocol/sdk@latest
```
</details>

<details>
<summary>Schema-Datei nicht gefunden</summary>

**Fehler:** `ENOENT: no such file or directory`

Schema-Pfad pruefen und sicherstellen, dass die Datei existiert:

```bash
# Pruefen, ob Datei existiert
ls -la ./schemas/my-schema.mjs

# Absoluten Pfad verwenden, wenn relativer fehlschlaegt
node -e "console.log(require('path').resolve('./schemas/my-schema.mjs'))"
```
</details>

## API-Request-Fehler

<details>
<summary>401 Unauthorized</summary>

Die API hat die Authentifizierungs-Credentials abgelehnt.

**Haeufige Ursachen:**
- API-Schluessel abgelaufen oder widerrufen
- Falsches Header-Format (Bearer vs. token vs. API key)
- Schluessel im falschen `serverParams`-Feld gesetzt

```javascript
// Header-Template gegen API-Doku abgleichen
headers: {
    'Authorization': 'Bearer {{API_KEY}}'     // Bearer-Token
    'X-API-Key': '{{API_KEY}}'                 // API-Key-Header
    'Authorization': 'token {{GITHUB_TOKEN}}'  // GitHub-Format
}

// Sicherstellen, dass serverParams zu requiredServerParams passen
requiredServerParams: [ 'API_KEY' ],
// Beim Start: API_KEY=xxx node server.mjs
```
</details>

<details>
<summary>429 Rate Limited</summary>

Die API drosselt deine Requests.

**Loesungen:**
- API-Dokumentation fuer Rate-Limit-Kontingente pruefen
- Verzoegerungen zwischen Requests bei Batch-Operationen hinzufuegen
- Bezahlten API-Tier fuer hoehere Limits verwenden
- Antworten wenn moeglich cachen
</details>

<details>
<summary>Request-Timeout</summary>

Die API hat nicht innerhalb des Timeout-Fensters geantwortet.

**Loesungen:**
- Pruefen, ob der API-Endpunkt erreichbar ist: `curl -I https://api.example.com`
- Netzwerkverbindung pruefen
- Manche APIs haben langsame Endpunkte fuer grosse Datenmengen -- Pagination-Parameter erwaegen
</details>

<details>
<summary>Ungueltige JSON-Antwort</summary>

**Fehler:** `Unexpected token < in JSON at position 0`

Die API hat HTML oder XML statt JSON zurueckgegeben. Haeufige Ursachen:
- Falsche Basis-URL (trifft auf Webseite statt API)
- API erfordert Authentifizierung und gibt eine HTML-Login-Seite zurueck
- API-Endpunkt hat sich geaendert

```javascript
// Root-URL zeigt auf die API, nicht die Website
root: 'https://api.example.com'     // Richtig
root: 'https://www.example.com'     // Falsch - Website, nicht API
```
</details>

## Claude Desktop Integration

<details>
<summary>MCP-Server erscheint nicht in Claude</summary>

1. Konfigurationsdatei-Speicherort pruefen:
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

2. Config-Format pruefen:
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

3. **Absolute Pfade** in `args` verwenden -- relative Pfade loesen sich moeglicherweise nicht korrekt auf
4. Claude Desktop komplett neu starten (beenden und neu oeffnen, nicht nur das Fenster schliessen)
</details>

<details>
<summary>Tools erscheinen nicht nach Server-Start</summary>

- Pruefen, dass Schemas ohne Fehler laden, indem der Server manuell im Terminal gestartet wird
- Pruefen, dass `loadSchema()` fuer alle Schemas `status: true` zurueckgibt
- Sicherstellen, dass Tools ueber das MCP-SDK Tool-Listing registriert werden
- Claude Desktop Logs auf MCP-bezogene Fehler pruefen
</details>

<details>
<summary>Tool-Aufrufe geben Fehler zurueck</summary>

- Dieselbe Route mit `FlowMCP.fetch()` ausserhalb von Claude testen, um das Problem zu isolieren
- Pruefen, dass alle `requiredServerParams` im Claude Desktop Config `env`-Block gesetzt sind
- Sicherstellen, dass der API-Endpunkt von deinem Rechner aus erreichbar ist
</details>

## Handler-Probleme (v2.0.0)

<details>
<summary>Handler-Factory-Funktionsfehler</summary>

**Fehler:** `handlers export must be a function`

Der `handlers`-Export muss eine Factory-Funktion sein, kein einfaches Objekt.

```javascript
// Falsch - einfaches Objekt
export const handlers = {
    routeName: { postProcess: ( { data } ) => data }
}

// Richtig - Factory-Funktion
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
<summary>Dependency-Injection-Fehler</summary>

**Fehler:** `Library 'ethers' is not on the allowlist`

Libraries muessen in `requiredLibraries` im `main`-Export deklariert werden. Nur Allowlist-Libraries koennen injiziert werden.

```javascript
export const main = {
    // ...
    requiredLibraries: [ 'ethers' ],  // Hier deklarieren
    // ...
}

export const handlers = ( { libraries } ) => ({
    routeName: {
        postProcess: ( { data } ) => {
            const ethers = libraries.ethers  // Per Injection verfuegbar
            return ethers.formatUnits( data.value, 18 )
        }
    }
})
```
</details>

<details>
<summary>Shared List nicht gefunden</summary>

**Fehler:** `Shared list 'evmChains' not found in lists directory`

Das Schema referenziert eine Shared List, die nicht existiert.

- Pruefen, ob die List-Datei im Lists-Verzeichnis existiert (z. B. `lists/evmChains.mjs`)
- Pruefen, ob der List-Name exakt uebereinstimmt (Gross-/Kleinschreibung beachten)
- Sicherstellen, dass `listsDir` an `loadSchema()` uebergeben wird, wenn Shared Lists verwendet werden
</details>

<details>
<summary>Handler stimmt nicht mit Route-Namen ueberein</summary>

**Fehler:** `Handler key 'getprice' does not match any route name`

Handler-Keys muessen exakt mit Route-Namen aus `main.routes` uebereinstimmen.

```javascript
// main.routes enthaelt:
tools: { getPrice: { ... } }

// Falscher Handler-Key
export const handlers = ( deps ) => ({
    getprice: { ... }    // kleines 'p' passt nicht
})

// Richtiger Handler-Key
export const handlers = ( deps ) => ({
    getPrice: { ... }    // passt zu routes.getPrice
})
```
</details>

## Fehlermeldungs-Referenz

### Schema-Fehler

| Fehler | Ursache | Loesung |
|--------|---------|---------|
| `namespace invalid` | Enthaelt nicht-Kleinbuchstaben | Nur `a-z` verwenden |
| `route missing method` | Route hat kein `method`-Feld | `method: 'GET'` (oder POST etc.) hinzufuegen |
| `parameter missing z` | Parameter ohne Zod-Validierung | `z`-Block zum Parameter hinzufuegen |
| `serverParams not declared` | Header nutzt `{{KEY}}` aber `KEY` nicht in `requiredServerParams` | Zu `requiredServerParams`-Array hinzufuegen |
| `routes exceed max count` | Mehr als 8 Routes in einem Schema | In mehrere Schema-Dateien aufteilen |
| `handlers is not a function` | `handlers` als Objekt exportiert | In Factory-Funktion konvertieren |

### Laufzeitfehler

| Fehler | Ursache | Loesung |
|--------|---------|---------|
| `ECONNREFUSED` | Zielserver nicht erreichbar | API-Endpunkt-Erreichbarkeit pruefen |
| `ETIMEDOUT` | Request-Timeout | Netzwerk pruefen, Timeout erhoehen |
| `ENOTFOUND` | Ungueltiger Hostname in URL | `root`-URL im Schema pruefen |
| `Invalid JSON` | Antwort ist kein gueltiges JSON | Pruefen, dass der API-Endpunkt JSON zurueckgibt |
| `Required server parameter missing` | `serverParams`-Wert nicht gesetzt | Umgebungsvariable setzen |

## Debug-Checkliste

Vor dem Melden eines Problems folgendes pruefen:

1. **Schema validiert** -- `FlowMCP.validateMain( { main } )` ausfuehren und auf Fehler pruefen
2. **Security-Scan besteht** -- `FlowMCP.scanSecurity( { filePath } )` auf der Schema-Datei ausfuehren
3. **Schema laedt** -- `FlowMCP.loadSchema()` ausfuehren und `status: true` pruefen
4. **Umgebungsvariablen gesetzt** -- Alle `requiredServerParams`-Werte verfuegbar
5. **API erreichbar** -- API-Endpunkt direkt mit `curl` testen
6. **Node.js-Version** -- Node.js 22+ installiert (`node --version`)
7. **Abhaengigkeiten installiert** -- `npm ci` fuer saubere Installation ausfuehren
8. **Mit einfachem Schema testen** -- Minimal-Schema mit einer Route und ohne Handler probieren

## Hilfe erhalten

:::note[GitHub Issues]
Bug-Reports und Feature-Requests: [github.com/FlowMCP/flowmcp-core/issues](https://github.com/FlowMCP/flowmcp-core/issues)
:::

:::note[GitHub Discussions]
Fragen, Ideen und Community-Hilfe: [github.com/FlowMCP/flowmcp-core/discussions](https://github.com/FlowMCP/flowmcp-core/discussions)
:::

### Issue-Report-Vorlage

Beim Melden von Issues angeben:

```markdown
**Umgebung:**
- FlowMCP Core Version: x.x.x
- Node.js Version: xx.x.x
- OS: macOS / Windows / Linux

**Schema (minimale Reproduktion):**
export const main = {
    // Minimal-Schema, das das Problem reproduziert
}

**Fehler:**
// Vollstaendige Fehlermeldung und Stacktrace

**Erwartetes Verhalten:**
Was passieren sollte

**Tatsaechliches Verhalten:**
Was tatsaechlich passiert
```
