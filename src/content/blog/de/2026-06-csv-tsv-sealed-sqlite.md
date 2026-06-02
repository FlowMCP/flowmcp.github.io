---
title: "CSV und TSV als versiegeltes SQLite — mit verpflichtender Parse-Config"
description: "Warum sich eine CSV-Datei nicht selbst beschreiben kann und wie das csv-tsv-sqlite-toolkit Geo-CSV/TSV in qualitätsversiegeltes SQLite verwandelt, indem es jede Parse-Entscheidung explizit erzwingt — keine stillen Defaults."
date: 2026-06-02
author: "FlowMCP Team"
tags: ["data-formats", "csv", "tsv", "add-on", "sqlite", "open-data"]
lang: de
---

> 2026-06-02 · FlowMCP Team · #data-formats #csv #add-on #sqlite

CSV ist das häufigste Format, in dem offene Daten ausgeliefert werden — und das mehrdeutigste. Eine Tabelle mit Orten, Koordinaten, Einwohnerzahlen, Hauptstadt-Flags wirkt trivial, bis man sie tatsächlich parsen muss. Ist das Trennzeichen ein Komma oder ein Semikolon? Ist `52,5` eine Dezimalzahl oder sind es zwei Spalten? Welche Spalte ist die geografische Breite? Die Datei selbst verrät es nicht. Das neue **`csv-tsv-sqlite-toolkit`** verwandelt Geo-CSV/TSV in qualitätsversiegeltes SQLite — und sein gesamtes Design ist darauf ausgelegt, diese Fragen erzwingen zu lassen, statt zu raten.

## Das Problem: CSV beschreibt sich nicht selbst

Das ist der entscheidende Unterschied zum Geschwister-Add-on [`geojson-sqlite-toolkit`](https://github.com/FlowMCP/geojson-sqlite-toolkit). Eine GeoJSON-Datei trägt ihre eigene Struktur in sich — Geometrietypen, Koordinatenreihenfolge, Eigenschaften — ein Konverter kann sie lesen, ohne dass man ihm etwas sagt. Eine CSV kann das nicht. Dieselbe Datei europäischer Städte kann ein Komma als Trennzeichen mit Punkt-Dezimalen nutzen (`Berlin,52.52,13.41`) oder ein Semikolon mit Komma-Dezimalen (`Berlin;52,52;13,41`). Beides ist gültiges CSV. Rät man falsch, bekommt man stillschweigend Datenmüll: eine Spalte statt drei, Zeichenketten dort, wo Zahlen stehen sollten, Breitengrade, die um eine Größenordnung daneben liegen.

Drei Dinge lassen sich schlicht nicht aus den Bytes ableiten:

- das **Trennzeichen** (Komma, Semikolon oder Tab),
- die **Dezimal-Notation** (Punkt oder Komma),
- welche Spalten **geografische Breite und Länge** tragen.

Ein Konverter, der hierfür still Defaults wählt, ist ein Konverter, der deine Daten früher oder später wortlos verstümmelt.

## Keine stillen Defaults

Deshalb rät das Toolkit nicht. Es erzwingt eine **verpflichtende Parse-Config**, und fehlt ein Pflichtfeld, **bricht** die Konvertierung mit dem Fehler `CSV-001` ab — sie fällt niemals auf einen Default zurück.

| Feld | Typ | Erlaubte Werte |
|------|-----|----------------|
| `separator` | enum | `comma` (`,`), `semicolon` (`;`), `tab` (`\t`) |
| `decimal` | enum | `point` (`1.5`), `comma` (`1,5`) |
| `latColumn` | string | Header-Name der Breitengrad-Spalte |
| `lonColumn` | string | Header-Name der Längengrad-Spalte |
| `typeCoercion` | object | Spalte → `integer` \| `number` \| `string` \| `boolean` |

Das ist der Kern des Toolkits. Jede Entscheidung, die still schiefgehen könnte, wird stattdessen zu einer Entscheidung, die du belegt triffst. Der Tausch ist gewollt: ein wenig mehr Tipparbeit vorab und im Gegenzug eine Konvertierung, die reproduzierbar und ehrlich darüber ist, was sie getan hat. Die vollständige `parseConfig` wird sogar in die `meta`-Tabelle der Datenbank geschrieben, sodass jeder genau nachsehen kann, wie die Datei gelesen wurde.

**TSV ist einfach CSV mit Tab als Trennzeichen.** Es gibt keinen separaten Code-Pfad — eine TSV-Datei wird konvertiert, indem man `separator: 'tab'` angibt.

### Die 0/1-Falle

Dasselbe Prinzip regiert die Typen. Eine Spalte aus `0` und `1` ist die klassische Mehrdeutigkeit: ist es ein boolesches Flag oder eine kleine Ganzzahl? Das Toolkit nimmt die vorsichtige Position ein. Eine `0`/`1`-Spalte **ohne** expliziten Typ bleibt ein **Integer** — sie wird *niemals* still in einen Boolean verwandelt. Einen Boolean bekommst du **nur**, wenn `typeCoercion` diese Spalte als `boolean` deklariert. (Das deckt sich mit der `boolean()`-Regel von FlowMCP selbst, sodass sich Typen überall gleich verhalten.)

## Wie es sich in FlowMCP einfügt

Das Toolkit folgt demselben Add-on-Muster wie seine Geschwister `gtfs-sqlite-toolkit` und `geojson-sqlite-toolkit`: eigenes Repo → Konverter → versiegeltes SQLite → automatisch eingespeiste Tools. Der Konverter schreibt ein Qualitätssiegel (den Wert `sqlite-csv`) und eine Capability-Matrix in die `meta`-Tabelle der Datenbank. Ein Schema referenziert dann nur noch die Datenbank:

```javascript
export const schema = {
    namespace: 'places',
    name: 'places-csv-v1',
    version: '1.0.0',
    main: {
        resources: [
            {
                source:       'sqlite-csv',
                mode:         'file-based',
                path:         '${FLOWMCP_RESOURCES}/places.db',
                addon:        'csv-tsv-sqlite-toolkit',
                addonVersion: '>=0.1.0',
                addonSource:  'github:FlowMCP/csv-tsv-sqlite-toolkit'
            }
        ],
        tools: [
            // Standard-Spatial-Tools werden automatisch eingespeist.
        ]
    }
}
```

Sieht die FlowMCP-CLI eine `source: 'sqlite-csv'`-Resource, prüft sie das Siegel und liest die Capability-Matrix, um dann die Spatial-Tools einzuspeisen, die die konvertierte Datei tatsächlich beantworten kann:

| Tool | Liefert | Benötigt |
|------|---------|----------|
| `featuresInBBox` | Zeilen innerhalb einer Breiten-/Längen-Bounding-Box | `spatialQuery` |
| `nearPoint` | Zeilen nahe einer Koordinate, Haversine-sortiert | `spatialQuery` |
| `byType` | Exact-Match-Attributfilter auf einer beliebigen Spalte | `attributeFilter` |

Die Tool-Namen werden mit dem Schema-Namespace vorangestellt — `places.nearPoint`, `places.featuresInBBox`. Fehlt der konvertierten DB eine Fähigkeit (etwa weil sie keine brauchbaren Koordinatenspalten hat), wird das passende Tool schlicht nicht eingespeist. Kein 404, kein Fehler zum Aufrufzeitpunkt, keine halluzinierte Antwort.

## Verteilung und Daten-Politik

Wie seine Geschwister wird das Toolkit **über GitHub ausgeliefert, nicht über die npm-Registry**:

```bash
npm install github:FlowMCP/csv-tsv-sqlite-toolkit
```

Provider-CSV/TSV-Datensätze tragen eigene Lizenzen und werden **niemals** im Repo mitgeliefert — nur eine synthetische CC0-Fixture für die Tests. Nutzer konvertieren ihre eigene Datei einmal und legen die entstehende `.db` unter `${FLOWMCP_RESOURCES}` ab (Default `~/.flowmcp/resources/`). Das Schema bleibt schlank, die Engine bleibt bei FlowMCP, und die Daten bleiben auf dem Rechner des Nutzers.

## Warum das zählt

CSV ist der Ort, an dem offene Daten leben, und stilles Parsen ist der Ort, an dem Open-Data-Pipelines leise schiefgehen. Das `csv-tsv-sqlite-toolkit` macht die heiklen Teile von CSV unüberspringbar: Du benennst das Trennzeichen, die Dezimal-Notation, die Koordinatenspalten und den Typ jeder mehrdeutigen Spalte — oder die Konvertierung stoppt und sagt dir, warum. Zurück bekommst du eine versiegelte, abfragbare SQLite-Datenbank, deren `meta`-Tabelle genau festhält, wie sie gebaut wurde — und drei Spatial-Tools, die kostenlos in FlowMCP verdrahtet sind. Kein Raten, keine Defaults, keine Überraschungen.

---

> 📖 Lies auch:
> - *[FlowMCP v4.1 — GTFS als erste Datenklasse mit eigenem Add-on](/de/blog/2026-05-flowmcp-v41-gtfs-add-on/)* — das Add-on-Muster, dem dieses Toolkit folgt, an einem schweren CSV-in-ZIP-Datensatz.
> - *[GeoJSON als versiegelte SQLite-Ressource](/de/blog/2026-06-geojson-sealed-sqlite/)* — das selbstbeschreibende Geschwister, das keine Parse-Config braucht.
