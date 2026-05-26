---
title: "FlowMCP v4.1 — GTFS als erste Datenklasse mit eigenem Add-on"
description: "Wie das gtfs-sqlite-toolkit GTFS-Feeds in auditierbare SQLite-Ressourcen verwandelt und FlowMCP zur ersten echten Mobility-Engine macht."
date: 2026-05-25
author: "FlowMCP Team"
tags: ["release", "v41", "gtfs", "add-on", "mobility", "open-data"]
---

> ℹ️ **Hinweis:** Die Pilot-Messwerte (Konvertierungszeiten, Latenzen, Output-Snippets) stammen aus dem laufenden GTFS-Pilot und werden ergaenzt, sobald die Messreihen abgeschlossen sind.

GTFS-Feeds sind die Lingua Franca des oeffentlichen Verkehrs — und gleichzeitig ein klassisches Beispiel fuer das Daten-Format-Problem: zwischen 30 und 60 CSV-Dateien in einer ZIP, fuer den DELFI-Feed mehrere hundert Megabyte, entpackt mehrere Gigabyte. Eine LLM kann diese Datei nicht im Kontext halten. Eine REST-API drumherum hilft, aber wer audiert die? Wer pflegt sie?

Mit **v4.1** loest FlowMCP das anders. GTFS wird zur ersten Datenklasse mit einem eigenen **Add-on** — `gtfs-sqlite-toolkit`. Das Toolkit konvertiert Feeds zu **versiegelten SQLite-Datenbanken** und meldet einer FlowMCP-CLI per Capability-Matrix, welche Abfragen sinnvoll moeglich sind. Schemas verweisen dann nur noch auf die DB — keine Wartung der CSV-Parser, keine API-Hosting-Kosten.

## Was ist GTFS?

GTFS — General Transit Feed Specification — ist ein offener Standard fuer Fahrplandaten, urspruenglich von Google fuer Transit-Suchen entwickelt, heute der weltweite De-facto-Standard fuer OePNV-Daten. Ein GTFS-Feed enthaelt ca. 30 CSV-Dateien: Stops, Routes, Trips, Stop-Times, Calendar, Transfers, ...

Wir betrachten zwei deutsche Feeds:

| Feed | Quelle | Groesse | Lizenz | Update |
|------|--------|---------|--------|--------|
| DELFI (Deutschland gesamt) | `download.gtfs.de/germany/free/latest.zip` | ~245 MB | CC-BY 4.0 (DELFI e.V.) | taeglich |
| VBB (Berlin/Brandenburg) | `vbb.de/vbbgtfs` | ~83 MB | CC-BY 4.0 (VBB GmbH) | Mi+Fr |

Beide Endpunkte erwidern HTTP 200 ohne Auth-Header. Die Lizenz verlangt Attribution in jeder Antwort, die diese Daten verwendet.

## Was ist `gtfs-sqlite-toolkit`?

Das Toolkit ist das **erste FlowMCP-Add-on**. Es konvertiert einen GTFS-Feed (CSV in ZIP) in eine SQLite-Datenbank mit drei Eigenschaften:

| Eigenschaft | Bedeutung |
|-------------|-----------|
| **Quality-Seal** | Eine `meta`-Tabelle in der DB enthaelt Hash, Datum, Spec-Revision, Provider — die DB ist eindeutig referenzierbar. |
| **Capability-Matrix** | 12 Booleans, die abbilden, welche Datei der Feed mitliefert (`stops`, `routes`, `transfers`, `shapes`, ...). |
| **Capability-Driven Auto-Injection** | Die FlowMCP-CLI liest die Capability-Matrix und injiziert nur die Tools, die der Feed tatsaechlich beantworten kann. |

Ein Schema sieht damit so aus:

```javascript
export const schema = {
    namespace: 'gtfsde',
    name: 'gtfsde-transit-v2',
    version: '2.0.0',
    main: {
        resources: [
            {
                source:       'sqlite-gtfs',
                mode:         'file-based',
                path:         '${FLOWMCP_RESOURCES}/gtfs-de.db',
                addon:        'gtfs-sqlite-toolkit',
                addonVersion: '>=0.1.0',
                addonSource:  'github:FlowMCP/gtfs-sqlite-toolkit'
            }
        ],
        tools: [
            // Default-Tools werden automatisch injiziert.
        ]
    }
}
```

Das Schema ist klein. Die Engine bleibt bei FlowMCP. Der Datenbank-Inhalt bei der user-eigenen DB. API-Keys gibt es nicht, weil es keine API gibt — die Daten sind frei.

## Pilot-Ergebnisse: DELFI + VBB

Wir haben beide Feeds in den Pilot genommen.

### Konvertierung

Erwartete Groessenordnungen aus dem Pilot: DELFI startet bei rund 245 MB ZIP und waechst nach Konvertierung auf rund 800 MB bis 2 GB SQLite, VBB von rund 83 MB ZIP auf rund 300 bis 700 MB. Die exakten Konvertierungszeiten und Quality-Seal-Stati ergaenzen wir, sobald die Messreihen abgeschlossen sind.

### Performance

Die Latenz-Messung (P50/P95) fuer `searchStops`, `findRoute` und `nextDeparture` laeuft im Pilot. SQLite-Index-Hits auf den konvertierten Datenbanken erlauben Tausende Queries ohne weiteren Netzwerk-Hit — die konkreten Zahlen reichen wir nach.

### Fünf Use-Cases

#### 1. "Naechste S-Bahn von Berlin Hbf nach Spandau"

```bash
flowmcp call gtfsvbb.findRoute '{"origin":"Berlin Hbf","destination":"Spandau"}'
```

_Beispiel-Output folgt nach Abschluss der Pilot-Messreihe._

#### 2. "Berlin Hbf → Hamburg Hbf am schnellsten"

```bash
flowmcp call gtfsde.findRoute '{"origin":"Berlin Hbf","destination":"Hamburg Hbf","criterion":"fastest"}'
```

_Beispiel-Output folgt nach Abschluss der Pilot-Messreihe._

#### 3. "Buslinien Karlsruhe Sonntag"

```bash
flowmcp call gtfsde.findRoutesByCalendar '{"city":"Karlsruhe","day":"sunday"}'
```

_Beispiel-Output folgt nach Abschluss der Pilot-Messreihe._

#### 4. "Bahnhoefe im 10km-Umkreis um Koordinate X"

```bash
flowmcp call gtfsde.searchStopsByGeo '{"lat":52.52,"lon":13.41,"radius_m":10000}'
```

_Beispiel-Output folgt nach Abschluss der Pilot-Messreihe._

#### 5. "Anschluss an Event Y in Stadt Z" *(Kombinatorik)*

Dieser Use-Case verkettet **zwei Schemas** und ist der Killer-Beleg fuer die Vision von FlowMCP: Schemas sind klein, die Engine ist eine, die Kombinatorik passiert oben.

```bash
# Schritt 1: Event suchen
flowmcp call eventbrite.search '{"name":"Berlin Mobility Conference","date":"2026-06-15"}'
# → venue=Tempelhof, lat=52.473, lon=13.402

# Schritt 2: Nahe Stops finden
flowmcp call overpass-osm.nearbyStops '{"lat":52.473,"lon":13.402,"radius_m":800}'
# → [Tempelhof, Platz der Luftbruecke, ...]

# Schritt 3: Route dorthin
flowmcp call gtfsvbb.findRoute '{"origin":"Berlin Hbf","destination":"Tempelhof","date":"2026-06-15T18:00"}'
# → S-Bahn S41 → Bus M46
```

_Ausgefuehrte Outputs und Latenzen folgen nach Abschluss der Pilot-Messreihe._

## Add-on-Konzept allgemein

GTFS ist das erste Add-on, aber nicht das einzige. Das Konzept ist generisch:

| Schritt | Was passiert |
|---------|--------------|
| 1. Add-on schreibt SQLite-DB mit `meta`-Tabelle | Hash, Spec-Revision, Provider, Capabilities |
| 2. Schema verweist auf `source: 'sqlite-<typ>'` + `addon: '<repo>'` + `addonSource: 'github:org/repo'` | Schema bleibt dünn |
| 3. FlowMCP-CLI liest Capabilities | injiziert nur passende Tools |
| 4. AI ruft Tools | DB-Operationen sind deterministisch, fast (Index-Hits) |

Capability-Matrix-Beispiele aus GTFS:

- `hasStops` (Datei `stops.txt` vorhanden) → `searchStops` wird injiziert
- `hasShapes` (Datei `shapes.txt` vorhanden) → `getRouteShape` wird injiziert
- `hasTransfers` → `findTransfer` wird injiziert
- `hasFareRules` → `getFare` wird injiziert

Schemas, die einen Feed bekommen, dem `transfers.txt` fehlt, sehen `findTransfer` schlicht nicht im Tool-Set. Keine 404, keine Fehlermeldung, keine halluzinierte Antwort.

## Open Data und Recht

Beide verwendeten Feeds stehen unter **CC-BY 4.0**. Das verlangt Attribution in jeder weitergegebenen Antwort. FlowMCP setzt das in der Output-Struktur:

```json
{
    "data": { "route_id": "ICE793", "dep_time": "09:34" },
    "licenseAttribution": "Daten: DELFI e.V. / VBB GmbH, CC-BY 4.0",
    "source": "gtfs-de | gtfs-vbb"
}
```

Warum sind diese Daten frei? Das deutsche **E-Government-Gesetz §12a** (eingefuehrt 2017, novelliert 2021) verpflichtet Bundes- und Landesbehoerden, Datenbestaende grundsaetzlich als Open Data bereitzustellen. DELFI als Zweckverband der Bundeslaender fuer Mobilitaetsdaten, VBB als oeffentlicher Verkehrsverbund, beide unterliegen diesen Vorgaben. CC-BY 4.0 ist die gewaehlte Lizenz-Form.

## Wie geht's weiter

| Naechster Schritt | Status |
|--------------------|--------|
| Realtime (GTFS-RT) | separater Endpoint, im Pilot nicht abgedeckt — Folge-Iteration |
| Weitere Add-ons (OFAC, OSM, Wikidata) | in Diskussion |
| Schema-Validator fuer Add-on-Capabilities | Folge-Memo |



---

> 📖 Lies auch:
> - *[FlowMCP v4 — Skills, Selections, Pipes](/blog/2026-05-flowmcp-v4-skills-selections-pipes/)* — Pipes-Konzept verkettet diese GTFS-Tools elegant.
> - *Anschluss erreichen — Wie FlowMCP zum Mobility-Framework wurde* — Hackathon-Validierung der Mobility-Use-Cases.
