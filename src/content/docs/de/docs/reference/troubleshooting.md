---
title: Fehlerbehebung
description: Haeufige Probleme und Loesungen fuer FlowMCP
---

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
</details>

<details>
<summary>Fehlende Pflichtfelder</summary>

**Fehler:** `main.root is required` oder `main.requiredServerParams is required`

v2.0.0 erfordert mehrere Felder, die in v1 optional waren:

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
    routes: { ... }                  // Erforderlich (mindestens eine Route)
}
```
</details>

## Server-Startprobleme

<details>
<summary>Port bereits belegt</summary>

**Fehler:** `EADDRINUSE: address already in use :::3000`

Ein anderer Prozess belegt den Port. Finden und stoppen:

```bash
lsof -i :3000
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

**Fehler:** `Cannot find module '@modelcontextprotocol/sdk'`

Kompatible MCP-SDK-Version sicherstellen:

```bash
npm ls @modelcontextprotocol/sdk
npm install @modelcontextprotocol/sdk@latest
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
<summary>Ungueltige JSON-Antwort</summary>

**Fehler:** `Unexpected token < in JSON at position 0`

Die API hat HTML oder XML statt JSON zurueckgegeben.

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

2. **Absolute Pfade** in `args` verwenden
3. Claude Desktop komplett neu starten (beenden und neu oeffnen)
</details>

<details>
<summary>Tools erscheinen nicht nach Server-Start</summary>

- Schemas ohne Fehler laden, indem der Server manuell im Terminal gestartet wird
- Pruefen, dass `loadSchema()` fuer alle Schemas `status: true` zurueckgibt
- Claude Desktop Logs auf MCP-bezogene Fehler pruefen
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

Libraries muessen in `requiredLibraries` im `main`-Export deklariert werden.

```javascript
export const main = {
    // ...
    requiredLibraries: [ 'ethers' ],
    // ...
}
```
</details>

## Fehlermeldungs-Referenz

### Schema-Fehler

| Fehler | Ursache | Loesung |
|--------|---------|---------|
| `namespace invalid` | Enthaelt nicht-Kleinbuchstaben | Nur `a-z` verwenden |
| `route missing method` | Route hat kein `method`-Feld | `method: 'GET'` hinzufuegen |
| `parameter missing z` | Parameter ohne Zod-Validierung | `z`-Block hinzufuegen |
| `serverParams not declared` | Header nutzt `{{KEY}}` aber `KEY` nicht in `requiredServerParams` | Zu `requiredServerParams` hinzufuegen |
| `handlers is not a function` | `handlers` als Objekt exportiert | In Factory-Funktion konvertieren |

### Laufzeitfehler

| Fehler | Ursache | Loesung |
|--------|---------|---------|
| `ECONNREFUSED` | Zielserver nicht erreichbar | API-Endpunkt-Erreichbarkeit pruefen |
| `ETIMEDOUT` | Request-Timeout | Netzwerk pruefen, Timeout erhoehen |
| `ENOTFOUND` | Ungueltiger Hostname | `root`-URL im Schema pruefen |
| `Invalid JSON` | Antwort ist kein gueltiges JSON | API-Endpunkt prueft JSON zurueck |

## Debug-Checkliste

Vor dem Melden eines Problems folgendes pruefen:

1. **Schema validiert** -- `FlowMCP.validateMain( { main } )` ausfuehren
2. **Security-Scan besteht** -- `FlowMCP.scanSecurity( { filePath } )` ausfuehren
3. **Schema laedt** -- `FlowMCP.loadSchema()` ausfuehren und `status: true` pruefen
4. **Umgebungsvariablen gesetzt** -- Alle `requiredServerParams`-Werte verfuegbar
5. **API erreichbar** -- API-Endpunkt direkt mit `curl` testen
6. **Node.js-Version** -- Node.js 22+ installiert (`node --version`)
7. **Abhaengigkeiten installiert** -- `npm ci` fuer saubere Installation ausfuehren

## Hilfe erhalten

:::note[GitHub Issues]
Bug-Reports und Feature-Requests: [github.com/FlowMCP/flowmcp-core/issues](https://github.com/FlowMCP/flowmcp-core/issues)
:::

:::note[GitHub Discussions]
Fragen, Ideen und Community-Hilfe: [github.com/FlowMCP/flowmcp-core/discussions](https://github.com/FlowMCP/flowmcp-core/discussions)
:::
