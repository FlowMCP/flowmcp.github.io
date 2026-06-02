---
title: "GeoJSON als per URL geladene In-Memory-Ressource"
description: "Wie das geojson-sqlite-toolkit eine vollständige GeoJSON-FeatureCollection per URL lädt, beim Laden validiert und FlowMCP räumliche Abfrage-Tools automatisch einspeist, die aus dem Speicher bedient werden — ohne eine einzige Zeile Parsing-Konfiguration."
date: 2026-06-02
author: "FlowMCP Team"
tags: ["data-formats", "geojson", "add-on", "url", "spatial", "open-data"]
lang: de
---

> 2026-06-02 · FlowMCP Team · #data-formats #geojson #add-on #url

> **Architektur-Hinweis:** Eine frühere Version dieses Add-ons baute eine versiegelte SQLite-Datei. Es wurde in Memo 096 auf ein **URL + In-Memory**-Modell korrigiert: Die vollständige Datei wird in einem Request geladen, beim Laden validiert und aus dem Speicher abgefragt — keine `.db`-Datei, kein Qualitätssiegel, kein Konverter-Schritt.

GeoJSON ist das Format, auf das sich das geografische Web geeinigt hat: Punkte, Linien und Polygone in einer schlichten JSON-Hülle. Es ist überall — Verwaltungsgrenzen, Points of Interest, Sensor-Standorte, Routen-Geometrien. Eine rohe GeoJSON-Datei lässt sich aber nur umständlich abfragen. „Welche Features liegen in dieser Bounding-Box?" oder „was ist in der Nähe dieser Koordinate?" bedeutet, die ganze Datei neu zu parsen und bei jedem Aufruf über jedes Feature zu iterieren. Das **`geojson-sqlite-toolkit`**-Add-on löst das: Es lädt eine GeoJSON-FeatureCollection **einmal** von einer URL, hält sie im Speicher, und die FlowMCP-CLI speist die räumlichen Abfrage-Tools obendrauf automatisch ein.

## Was ist GeoJSON?

GeoJSON — standardisiert als **RFC 7946** — beschreibt geografische Features als JSON. Eine `FeatureCollection` hält ein `features[]`-Array; jedes Feature trägt eine `geometry` (Koordinaten als `[lon, lat]`) und ein freiformatiges `properties`-Objekt. Point, LineString, Polygon und ihre Multi-Varianten lassen sich alle in derselben Hülle ausdrücken.

Das entscheidende Merkmal für ein Add-on: GeoJSON ist **selbstbeschreibend**. Die Struktur ist durch die Spezifikation festgelegt, und die Attribute reisen innerhalb von `properties` mit. Es gibt keine Spaltenköpfe zu deuten, keine Trennzeichen zu erraten. Anders als ein CSV-Add-on — das explizite Parse-Hinweise braucht — kommt der GeoJSON-Loader deshalb **ohne Konfiguration** aus. Du zeigst ihm eine URL; die Form ist bereits bekannt.

## Was ist `geojson-sqlite-toolkit`?

Es ist ein **Geschwister von [`gtfs-sqlite-toolkit`](/de/blog/2026-05-flowmcp-v41-gtfs-add-on/)** in FlowMCPs Add-on-Familie für Datenformate. Wie sein Geschwister ist es **kein** generischer Loader, der in `flowmcp-core` eingebaut wäre. Es ist ein eigenständiges Repository mit der vollständigen Pipeline: eigener URL-Store, eigene In-Memory-Abfragemethoden und Auto-Injektion über einen `FlowMcpAdapter`. Verteilt wird es über **GitHub, nicht über npm**:

```bash
npm install github:FlowMCP/geojson-sqlite-toolkit
```

Beim `flowmcp add` erledigt das Add-on vier Dinge:

| Schritt | Was passiert |
|---------|--------------|
| 1. Laden | Lädt das **VOLLSTÄNDIGE** GeoJSON-Dokument in einem **einzigen HTTPS-Request**. |
| 2. Parsen + validieren | `JSON.parse`t die Antwort und validiert sie gegen RFC 7946 — **Validierung beim Laden** ersetzt das alte Qualitätssiegel. Ungültiges GeoJSON bricht das Laden ab. |
| 3. Reduzieren | Klopft jedes Feature in eine abfragefertige Zeile flach (mit einem expliziten repräsentativen Punkt). |
| 4. Im Speicher halten | Behält die Zeilen **im Speicher**, nach URL geschlüsselt. Es gibt keine `.db`-Datei und kein On-Disk-Artefakt. |

Es gibt keinen Konverter-Schritt, kein Siegel und kein `dbPath`. Die Validierung beim Laden ist der Vertrag: Eine Datei, die nicht als RFC-7946-GeoJSON parst, schafft es nie in den Speicher — die Tools bedienen also immer nur eine geprüfte Datei.

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

Die je Feature angewandte Regel wird pro Zeile gespeichert. Die Bounding-Box dagegen umspannt immer **alle** Koordinaten eines Features — eine Bounding-Box-Abfrage bleibt also exakt, ganz gleich, auf welchen repräsentativen Punkt ein Feature reduziert wurde.

## Die räumlichen Tools

Sobald eine Datei geladen ist, stehen drei Abfragen bereit, die aus dem Speicher bedient werden. Der Radius wird an der API in **Metern** angegeben; Distanzen werden intern mit der Haversine-Formel berechnet:

| Tool | Was es beantwortet |
|------|--------------------|
| `featuresInBBox` | Alle Features innerhalb einer Bounding-Box (`minLon`, `minLat`, `maxLon`, `maxLat`). |
| `nearPoint` | Features innerhalb eines Radius um eine Koordinate, nach Distanz sortiert, mit `distanceM` in der Ausgabe. |
| `byType` | Features gefiltert nach Geometrie-Typ und/oder einem Property-Schlüssel/-Wert. |

Weil die Methoden in einem zentralen Add-on liegen, propagiert ein Fix zu jedem Schema, das es nutzt — es gibt keine Kopie pro Datei, die man synchron halten müsste.

## Wie ein Schema sie aufgreift

Ein FlowMCP-Schema listet diese Tools nie von Hand auf. Es deklariert eine schlanke URL-Ressource, und die CLI erledigt den Rest — sie lädt und validiert die Datei beim Laden, liest die Capability-Matrix und speist genau die passenden Tools ein:

```javascript
export const schema = {
    namespace: 'mygeo',
    name: 'mygeo-features-v1',
    version: '2.0.0',
    main: {
        resources: [
            {
                source:       'sqlite-geojson',
                mode:         'url',
                url:          'https://example.org/features.geojson',
                addon:        'geojson-sqlite-toolkit',
                addonVersion: '>=0.1.0',
                addonSource:  'github:FlowMCP/geojson-sqlite-toolkit'
            }
        ],
        tools: []
    }
}
```

Das Schema bleibt schlank, die Engine bleibt bei FlowMCP, und die Anbieter-Daten bleiben unter der eigenen URL des Anbieters — sie liegen nie im Add-on-Repo. Es gibt keine API-Schlüssel, weil es keine API gibt.

## Scope: vollständige Downloads in einem Schritt

Das URL-Modell setzt voraus, dass die ganze FeatureCollection in **einem** Request zurückkommt. Das deckt den häufigen Fall ab — eine veröffentlichte, statische GeoJSON-Datei. Paginierte oder Query-pro-Seite-Quellen wie **WFS sind out of scope**: Ein einzelnes `loadFromUrl` kann sie nicht rekonstruieren, und Seiten still zusammenzustückeln wäre genau das stille Raten, das das Toolkit vermeidet.

## Warum das zählt

Das Add-on-Konzept ist dasselbe, das GTFS begründet hat — angewandt auf ein zweites Format: eine sperrige Quelle **einmal** vorbereiten, validieren und die CLI nur die Tools einspeisen lassen, die die Daten wirklich beantworten können. GeoJSON ist der selbstbeschreibende Fall — eine Hülle, keine Konfiguration. Wo das ursprüngliche Design eine SQLite-Datei auf der Platte baute und versiegelte, lädt das korrigierte Design (Memo 096) die vollständige Datei per URL und bedient Abfragen aus dem Speicher: ein schlankeres Schema, kein On-Disk-Artefakt und eine einzige zentrale Implementierung hinter jedem räumlichen Tool.

---

> 📖 Lies auch:
> - *[FlowMCP v4.1 — GTFS als erste Datenklasse mit eigenem Add-on](/de/blog/2026-05-flowmcp-v41-gtfs-add-on/)* — das Geschwister-Add-on, mit dem das Datenformat-Add-on-Muster begann.
> - *[SQLite — Ein Speicher für lokale, große und private Daten](/de/blog/2026-06-local-data-sqlite-preload-shared-lists/)* — die Daten-Verankerungs-Mechanismen hinter Add-ons wie diesem.
</content>
