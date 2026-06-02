---
title: "GeoJSON als versiegelte SQLite-Ressource"
description: "Wie das geojson-sqlite-toolkit GeoJSON-FeatureCollections in qualitätsversiegelte SQLite-Datenbanken verwandelt und FlowMCP räumliche Abfrage-Tools automatisch einspeist — ohne eine einzige Zeile Parsing-Konfiguration."
date: 2026-06-02
author: "FlowMCP Team"
tags: ["data-formats", "geojson", "add-on", "sqlite", "spatial", "open-data"]
lang: de
---

> 2026-06-02 · FlowMCP Team · #data-formats #geojson #add-on #sqlite

GeoJSON ist das Format, auf das sich das geografische Web geeinigt hat: Punkte, Linien und Polygone in einer schlichten JSON-Hülle. Es ist überall — Verwaltungsgrenzen, Points of Interest, Sensor-Standorte, Routen-Geometrien. Eine rohe GeoJSON-Datei lässt sich aber nur umständlich abfragen. „Welche Features liegen in dieser Bounding-Box?" oder „was ist in der Nähe dieser Koordinate?" bedeutet, die ganze Datei neu zu parsen und bei jedem Aufruf über jedes Feature zu iterieren. Das **`geojson-sqlite-toolkit`**-Add-on löst das: Es konvertiert eine GeoJSON-FeatureCollection **einmal** in eine qualitätsversiegelte SQLite-Datenbank, und die FlowMCP-CLI speist die räumlichen Abfrage-Tools obendrauf automatisch ein.

## Was ist GeoJSON?

GeoJSON — standardisiert als **RFC 7946** — beschreibt geografische Features als JSON. Eine `FeatureCollection` hält ein `features[]`-Array; jedes Feature trägt eine `geometry` (Koordinaten als `[lon, lat]`) und ein freiformatiges `properties`-Objekt. Point, LineString, Polygon und ihre Multi-Varianten lassen sich alle in derselben Hülle ausdrücken.

Das entscheidende Merkmal für ein Add-on: GeoJSON ist **selbstbeschreibend**. Die Struktur ist durch die Spezifikation festgelegt, und die Attribute reisen innerhalb von `properties` mit. Es gibt keine Spaltenköpfe zu deuten, keine Trennzeichen zu erraten. Anders als ein CSV-Add-on — das explizite Parse-Hinweise braucht — kommt der GeoJSON-Konverter deshalb mit **minimaler Konfiguration** aus. Du zeigst ihm eine Datei; die Form ist bereits bekannt.

## Was ist `geojson-sqlite-toolkit`?

Es ist ein **Geschwister von [`gtfs-sqlite-toolkit`](/de/blog/2026-05-flowmcp-v41-gtfs-add-on/)** in FlowMCPs Add-on-Familie für Datenformate. Wie sein Geschwister ist es **kein** generischer Loader, der in `flowmcp-core` eingebaut wäre. Es ist ein eigenständiges Repository mit der vollständigen Pipeline: eigener Konverter, eigene versiegelte SQLite-Ausgabe und Auto-Injektion über einen `FlowMcpAdapter`. Verteilt wird es über **GitHub, nicht über npm**:

```bash
npm install github:FlowMCP/geojson-sqlite-toolkit
```

Der Konverter erledigt vier Dinge:

| Schritt | Was passiert |
|---------|--------------|
| 1. Parsen + validieren | Liest und `JSON.parse`t die Eingabe, validiert sie gegen RFC 7946. |
| 2. Flachklopfen | Schreibt eine Zeile pro Feature in eine `features`-Tabelle. |
| 3. Versiegeln | Stempelt `meta.qualitySeal = 'sqlite-geojson'` — aber nur, wenn es keine Fehler und keine Warnungen gibt. |
| 4. Atomarer Tausch | Schreibt über eine temporäre `.new`-Datei und einen atomaren Tausch, damit nie eine halbfertige DB auftaucht. |

Der Siegelwert `sqlite-geojson` ist der Vertrag. Auf ihn verweist ein Schema, und ihn prüft die CLI, bevor sie der Datenbank vertraut.

### Ein repräsentativer Punkt — nie ein stilles Raten

Manche räumlichen Abfragen brauchen einen einzigen Punkt pro Feature. Ein Polygon oder eine Linie hat keinen offensichtlichen — also reduziert das Toolkit Nicht-Point-Geometrien nach einer **expliziten, dokumentierten Regel** auf einen repräsentativen Punkt, nie nach einem stillen „nimm einfach die erste Koordinate":

| Geometrie | Repräsentativer Punkt |
|-----------|------------------------|
| Point | der Punkt selbst |
| MultiPoint | Mittel aller Punkte |
| LineString | der mittlere Stützpunkt |
| MultiLineString | mittlerer Stützpunkt der längsten Teillinie |
| Polygon | Schwerpunkt des äußeren Rings |
| MultiPolygon | Schwerpunkt des äußeren Rings des ersten Teils |

Die je Feature angewandte Regel wird pro Zeile gespeichert, die vollständige Zuordnung steht im `meta` der DB. Die Bounding-Box dagegen umspannt immer **alle** Koordinaten eines Features — eine Bounding-Box-Abfrage bleibt also exakt, ganz gleich, auf welchen repräsentativen Punkt ein Feature reduziert wurde.

## Die räumlichen Tools

Sobald eine DB versiegelt ist, stehen drei Abfragen bereit. Der Radius wird an der API in **Metern** angegeben; Distanzen werden intern mit der Haversine-Formel berechnet:

| Tool | Was es beantwortet |
|------|--------------------|
| `featuresInBBox` | Alle Features innerhalb einer Bounding-Box (`minLon`, `minLat`, `maxLon`, `maxLat`). |
| `nearPoint` | Features innerhalb eines Radius um eine Koordinate, nach Distanz sortiert, mit `distanceM` in der Ausgabe. |
| `byType` | Features gefiltert nach Geometrie-Typ und/oder einem Property-Schlüssel/-Wert. |

## Wie ein Schema sie aufgreift

Ein FlowMCP-Schema listet diese Tools nie von Hand auf. Es deklariert die versiegelte Datenbank als `sqlite-geojson`-Ressource, und die CLI erledigt den Rest — sie prüft das Siegel, liest die Capability-Matrix und speist genau die passenden Tools ein:

```javascript
export const schema = {
    namespace: 'mygeo',
    name: 'mygeo-features-v1',
    version: '2.0.0',
    main: {
        resources: [
            {
                source:       'sqlite-geojson',
                mode:         'file-based',
                path:         '${FLOWMCP_RESOURCES}/my-features.db',
                addon:        'geojson-sqlite-toolkit',
                addonVersion: '>=0.1.0',
                addonSource:  'github:FlowMCP/geojson-sqlite-toolkit'
            }
        ],
        tools: []
    }
}
```

`${FLOWMCP_RESOURCES}` löst sich in das eigene Ressourcen-Verzeichnis des Nutzers auf. Das Schema bleibt schlank, die Engine bleibt bei FlowMCP, und die Anbieter-Daten bleiben in der eigenen Datenbank des Nutzers — sie liegen nie im Add-on-Repo. Es gibt keine API-Schlüssel, weil es keine API gibt.

## Warum das zählt

Das Add-on-Konzept ist dasselbe, das GTFS begründet hat — angewandt auf ein zweites Format: eine sperrige Quelle **einmal** in eine versiegelte SQLite-Datenbank konvertieren, ein Qualitätssiegel und eine Capability-Matrix anheften und die CLI nur die Tools einspeisen lassen, die die Daten wirklich beantworten können. GTFS war der Schwer-Feed-Fall — dutzende CSVs in einem ZIP. GeoJSON ist der selbstbeschreibende Fall — eine Hülle, minimale Konfiguration. Beide landen am selben Ort: gewöhnliche, indizierte Tabellen, abfragbar über deterministische Tools, mit der Engine in einem Repository und den Daten beim Nutzer selbst.

---

> 📖 Lies auch:
> - *[FlowMCP v4.1 — GTFS als erste Datenklasse mit eigenem Add-on](/de/blog/2026-05-flowmcp-v41-gtfs-add-on/)* — das Geschwister-Add-on, mit dem das versiegelte-SQLite-Muster begann.
> - *[SQLite — Ein Speicher für lokale, große und private Daten](/de/blog/2026-06-local-data-sqlite-preload-shared-lists/)* — die Daten-Verankerungs-Mechanismen hinter Add-ons wie diesem.
