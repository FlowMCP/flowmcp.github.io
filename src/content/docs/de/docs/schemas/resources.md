---
title: Resources
description: "Lokale SQLite-Datenbanken als abfragbare MCP Resources fuer Massendaten, Open Data und Offline-Zugriff buendeln"
---

Resources liefern lokale, deterministische Daten via SQLite. Im Gegensatz zu Tools (die Remote-REST-APIs aufrufen) fragen Resources lokale Datenbanken ab. Sie sind ideal fuer per Bulk-Download bezogene Open Data wie Handelsregister, Fahrplaene und Sanktionslisten.

## Was sind Resources?

Eine Resource ist eine SQLite-Datenbank, die mit einem Schema gebuendelt wird. Die FlowMCP Runtime laedt die `.db`-Datei via `sql.js` (eine reine JavaScript/WASM SQLite-Implementierung) und stellt jede definierte Abfrage als MCP Resource bereit. Keine Netzwerkaufrufe, keine API-Keys, keine Rate Limits.

Resources sind ideal wenn:

- Daten gross sind und sich selten aendern (Handelsregister, Geodaten)
- Offline-Zugriff erforderlich ist
- Latenz nahe null sein muss
- Der Datensatz oeffentlich als Bulk-Download verfuegbar ist

## Wann Resources vs Tools verwenden

| Aspekt | Tools | Resources |
|--------|-------|-----------|
| Datenquelle | Remote REST API | Lokale SQLite-Datenbank |
| Latenz | Netzwerkabhaengig | Sofort |
| Verfuegbarkeit | Erfordert Internet | Immer verfuegbar |
| Datenaktualitaet | Echtzeit | Snapshot (periodische Aktualisierung) |
| API-Key erforderlich | Meist ja | Nein |
| Anwendungsfall | Live-Preise, On-Chain-Daten | Handelsregister, Fahrplandaten |

:::tip
Viele Schemas profitieren von der Kombination beider Ansaetze. Verwende Tools fuer Live-Daten und Resources fuer Referenz-Lookups. Der KI-Agent waehlt den richtigen Ansatz basierend auf der Abfrage.
:::

## Resource-Definition

Resources werden in `main.resources` deklariert. Jede Resource zeigt auf eine SQLite-Datenbank und definiert benannte Abfragen mit SQL und Parametern:

```javascript
export const main = {
    namespace: 'offeneregister',
    name: 'OffeneRegister',
    version: '3.0.0',
    root: '',
    tools: {},
    resources: {
        companiesDb: {
            source: 'sqlite',
            database: 'companies.db',
            origin: 'global',
            description: 'German company register (OffeneRegister)',
            queries: {
                searchCompanies: {
                    sql: "SELECT * FROM companies WHERE name LIKE ? LIMIT ?",
                    description: 'Search companies by name',
                    parameters: {
                        searchTerm: { type: 'string', required: true },
                        limit: { type: 'number', required: false, default: 10 }
                    },
                    output: { columns: ['company_number', 'name', 'registered_address', 'status'] }
                }
            }
        }
    }
}
```

## Datenbank-Pfade -- Drei Ebenen

Das `origin`-Feld bestimmt, wo die Runtime nach der `.db`-Datei sucht:

| Origin | Pfadaufloesung | Ideal fuer |
|--------|---------------|-----------|
| `global` | `~/.flowmcp/data/{database}` | Geteilte Datensaetze, die projektuebergreifend genutzt werden |
| `project` | `.flowmcp/data/{database}` | Projektspezifische Daten |
| `inline` | Relativ zur Schema-Datei | Eigenstaendige Schemas mit kleinen Datenbanken |

:::note
Das `origin`-Feld ist erforderlich. Die Runtime raet nicht, wo die Datenbank liegt. Wenn die Datei am aufgeloesten Pfad nicht gefunden wird, schlaegt die Resource mit einer klaren Fehlermeldung fehl.
:::

## CTE-Unterstuetzung

Komplexe Abfragen koennen Common Table Expressions (CTEs) fuer mehrstufige Filterung verwenden:

```sql
WITH recent AS (
    SELECT * FROM companies WHERE registered_date > ?
)
SELECT * FROM recent WHERE status = 'active' LIMIT ?
```

CTEs muessen immer noch mit einer schreibgeschuetzten Anweisung beginnen. Die gleichen SQL-Sicherheitsregeln gelten: kein `INSERT`, `UPDATE`, `DELETE` oder andere Schreiboperationen irgendwo in der CTE-Kette.

## Einschraenkungen

:::note
Diese Limits halten Resources fokussiert und vorhersagbar. Wenn du mehr Abfragen brauchst, teile in mehrere Schemas auf.
:::

| Einschraenkung | Wert | Begruendung |
|----------------|------|-------------|
| Max Resources pro Schema | 2 | Resources sind ergaenzend, nicht primaerer Output |
| Max Abfragen pro Resource | 8 | 7 definierte + 1 automatisch injizierte `freeQuery` |
| `getSchema`-Abfrage | Erforderlich | Muss die Datenbank-Tabellenstruktur zurueckgeben |
| SQL-Operationen | Nur `SELECT` | Schreibschutz-Durchsetzung -- kein INSERT/UPDATE/DELETE |
| Parameter-Platzhalter | Nur `?` | Verhindert SQL-Injection |
| Quelltyp | Nur `sqlite` | Zukuenftige Versionen koennten andere Quellen hinzufuegen |
| Datenbank-Dateiendung | `.db` | Standard SQLite-Endung |

### Automatisch injizierte Abfragen

Zwei Abfragen werden automatisch von der Runtime behandelt:

- **`getSchema`** -- Du musst diese Abfrage definieren. Sie gibt die Datenbankstruktur zurueck, damit KI-Agenten verfuegbare Tabellen und Spalten verstehen koennen.
- **`freeQuery`** -- Automatisch von der Runtime injiziert. Erlaubt KI-Agenten, beliebige `SELECT`-Abfragen innerhalb der schreibgeschuetzten Sandbox auszufuehren. Dies zaehlt zum 8-Abfragen-Limit.

## Vollstaendiges Beispiel

Ein OffeneRegister-Schema mit einer SQLite Resource zur Abfrage des deutschen Handelsregisters:

```javascript
export const main = {
    namespace: 'offeneregister',
    name: 'OffeneRegister',
    description: 'German company register — local SQLite database',
    version: '3.0.0',
    tags: ['open-data', 'germany', 'companies'],
    root: '',
    tools: {},
    resources: {
        companiesDb: {
            source: 'sqlite',
            database: 'openregister.db',
            origin: 'global',
            description: 'OffeneRegister company database (2.5 GB)',
            queries: {
                getSchema: {
                    sql: "SELECT sql FROM sqlite_master WHERE type='table'",
                    description: 'Get database schema',
                    parameters: {},
                    output: { columns: ['sql'] }
                },
                searchCompanies: {
                    sql: "SELECT company_number, name, registered_address, status FROM companies WHERE name LIKE ? LIMIT ?",
                    description: 'Full-text search for companies by name',
                    parameters: {
                        searchTerm: { type: 'string', required: true, description: 'Company name (use % for wildcards)' },
                        limit: { type: 'number', required: false, default: 10, description: 'Max results' }
                    },
                    output: { columns: ['company_number', 'name', 'registered_address', 'status'] }
                },
                getByNumber: {
                    sql: "SELECT * FROM companies WHERE company_number = ?",
                    description: 'Look up a company by its registration number',
                    parameters: {
                        companyNumber: { type: 'string', required: true, description: 'Company registration number' }
                    },
                    output: { columns: ['company_number', 'name', 'registered_address', 'status', 'registered_date'] }
                },
                recentRegistrations: {
                    sql: "SELECT company_number, name, registered_date FROM companies ORDER BY registered_date DESC LIMIT ?",
                    description: 'List the most recently registered companies',
                    parameters: {
                        limit: { type: 'number', required: false, default: 20, description: 'Max results' }
                    },
                    output: { columns: ['company_number', 'name', 'registered_date'] }
                }
            }
        }
    }
}
```

Dieses Schema hat keine Tools und keine `root`-URL -- es arbeitet vollstaendig mit lokalen Daten. Der KI-Agent kann Unternehmen suchen, nach Nummer nachschlagen oder kuerzliche Registrierungen durchblaettern, ohne jeglichen Netzwerkzugriff.

:::tip
Reine Resource-Schemas setzen `root: ''` und `tools: {}`. Sie sind gueltige FlowMCP-Schemas, die ausschliesslich MCP Resources bereitstellen, keine MCP Tools.
:::

## Validierungsregeln

Resources werden durch die Regeln RES001-RES023 validiert. Wichtige Regeln:

| Code | Regel |
|------|-------|
| RES003 | Maximal 2 Resources pro Schema |
| RES005 | Source muss `'sqlite'` sein |
| RES006 | Datenbankpfad muss auf `.db` enden |
| RES008 | Maximal 8 Abfragen pro Resource (7 + freeQuery) |
| RES012 | SQL muss mit `SELECT` beginnen (oder `WITH` fuer CTEs) |
| RES013 | SQL darf keine blockierten Muster enthalten |
| RES014 | SQL muss `?`-Platzhalter verwenden |
| RES015 | Platzhalter-Anzahl muss mit Parameter-Anzahl uebereinstimmen |

Siehe [Validierungsregeln](/de/docs/specification/validation-rules/) fuer die vollstaendige Liste.
