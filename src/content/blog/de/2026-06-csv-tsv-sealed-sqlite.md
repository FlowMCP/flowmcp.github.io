---
title: "CSV und TSV von einer URL — mit verpflichtender Parse-Config"
description: "Warum sich eine CSV-Datei nicht selbst beschreiben kann und wie das csv-tsv-sqlite-toolkit Geo-CSV/TSV von einer URL in den Speicher lädt, indem es jede Parse-Entscheidung explizit erzwingt — keine stillen Defaults."
date: 2026-06-02
author: "FlowMCP Team"
tags: ["data-formats", "csv", "tsv", "add-on", "url", "open-data"]
lang: de
---

> 2026-06-02 · FlowMCP Team · #data-formats #csv #add-on #url

> **Architektur-Hinweis:** Der Slug sagt aus URL-Stabilitätsgründen weiterhin `sealed-sqlite`, doch das Add-on baut keine versiegelte SQLite-Datei mehr. Es wurde in Memo 096 auf ein **URL + In-Memory**-Modell korrigiert: Die vollständige Datei wird in einem Request geladen, beim Laden validiert und aus dem Speicher abgefragt — keine `.db`-Datei, kein Qualitätssiegel, kein Konverter-Schritt.

CSV ist das häufigste Format, in dem offene Daten ausgeliefert werden — und das mehrdeutigste. Eine Tabelle mit Orten, Koordinaten, Einwohnerzahlen, Hauptstadt-Flags wirkt trivial, bis man sie tatsächlich parsen muss. Ist das Trennzeichen ein Komma oder ein Semikolon? Ist `52,5` eine Dezimalzahl oder sind es zwei Spalten? Welche Spalte ist die geografische Breite? Die Datei selbst verrät es nicht. Das neue **`csv-tsv-sqlite-toolkit`** lädt Geo-CSV/TSV von einer URL in den Speicher — und sein gesamtes Design ist darauf ausgelegt, diese Fragen erzwingen zu lassen, statt zu raten.

## Das Problem: CSV beschreibt sich nicht selbst

Das ist der entscheidende Unterschied zum Geschwister-Add-on [`geojson-sqlite-toolkit`](https://github.com/FlowMCP/geojson-sqlite-toolkit). Eine GeoJSON-Datei trägt ihre eigene Struktur in sich — Geometrietypen, Koordinatenreihenfolge, Eigenschaften — ein Loader kann sie lesen, ohne dass man ihm etwas sagt. Eine CSV kann das nicht. Dieselbe Datei europäischer Städte kann ein Komma als Trennzeichen mit Punkt-Dezimalen nutzen (`Berlin,52.52,13.41`) oder ein Semikolon mit Komma-Dezimalen (`Berlin;52,52;13,41`). Beides ist gültiges CSV. Rät man falsch, bekommt man stillschweigend Datenmüll: eine Spalte statt drei, Zeichenketten dort, wo Zahlen stehen sollten, Breitengrade, die um eine Größenordnung daneben liegen.

Drei Dinge lassen sich schlicht nicht aus den Bytes ableiten:

- das **Trennzeichen** (Komma, Semikolon oder Tab),
- die **Dezimal-Notation** (Punkt oder Komma),
- welche Spalten **geografische Breite und Länge** tragen.

Ein Loader, der hierfür still Defaults wählt, ist ein Loader, der deine Daten früher oder später wortlos verstümmelt.

## Keine stillen Defaults

Deshalb rät das Toolkit nicht. Es erzwingt eine **verpflichtende Parse-Config**, und fehlt ein Pflichtfeld, **bricht** das Laden mit dem Fehler `CSV-URL-005` ab — es fällt niemals auf einen Default zurück.

| Feld | Typ | Erlaubte Werte |
|------|-----|----------------|
| `separator` | enum | `comma` (`,`), `semicolon` (`;`), `tab` (`\t`) |
| `decimal` | enum | `point` (`1.5`), `comma` (`1,5`) |
| `latColumn` | string | Header-Name der Breitengrad-Spalte |
| `lonColumn` | string | Header-Name der Längengrad-Spalte |
| `typeCoercion` | object | Spalte → `integer` \| `number` \| `string` \| `boolean` |

Das ist der Kern des Toolkits. Jede Entscheidung, die still schiefgehen könnte, wird stattdessen zu einer Entscheidung, die du belegt triffst. Der Tausch ist gewollt: ein wenig mehr Tipparbeit vorab und im Gegenzug ein Ladevorgang, der reproduzierbar und ehrlich darüber ist, was er getan hat. Die konfigurierten Geo- und `typeCoercion`-Spalten werden **beim Laden** gegen den tatsächlichen Header geprüft — fehlt eine deklarierte Spalte, bricht das Laden ab, statt stillen Datenmüll zu bedienen.

**TSV ist einfach CSV mit Tab als Trennzeichen.** Es gibt keinen separaten Code-Pfad — eine TSV-Datei wird geladen, indem man `separator: 'tab'` angibt.

### Die 0/1-Falle

Dasselbe Prinzip regiert die Typen. Eine Spalte aus `0` und `1` ist die klassische Mehrdeutigkeit: ist es ein boolesches Flag oder eine kleine Ganzzahl? Das Toolkit nimmt die vorsichtige Position ein. Eine `0`/`1`-Spalte **ohne** expliziten Typ bleibt ein **Integer** — sie wird *niemals* still in einen Boolean verwandelt. Einen Boolean bekommst du **nur**, wenn `typeCoercion` diese Spalte als `boolean` deklariert. (Das deckt sich mit der `boolean()`-Regel von FlowMCP selbst, sodass sich Typen überall gleich verhalten.)

## Wie es sich in FlowMCP einfügt

Das Toolkit folgt demselben Add-on-Muster wie sein Geschwister `geojson-sqlite-toolkit`: eigenes Repo → schlankes URL-Schema → In-Memory-Laden → automatisch eingespeiste Tools. Beim `flowmcp add` lädt das Add-on die **vollständige** CSV/TSV in einem **einzigen HTTPS-Request**, parst sie mit der verpflichtenden `parseConfig`, prüft, dass die deklarierten Spalten existieren, und hält die Zeilen **im Speicher**, nach URL geschlüsselt — es gibt keine SQLite-Datei und kein Qualitätssiegel. Ein Schema deklariert dann nur noch die URL:

```javascript
export const schema = {
    namespace: 'places',
    name: 'places-csv-v1',
    version: '1.0.0',
    main: {
        resources: [
            {
                source:       'sqlite-csv',
                mode:         'url',
                url:          'https://example.org/places.csv',
                addon:        'csv-tsv-sqlite-toolkit',
                addonVersion: '>=0.1.0',
                addonSource:  'github:FlowMCP/csv-tsv-sqlite-toolkit',
                parseConfig: {
                    separator: 'semicolon',
                    decimal:   'comma',
                    latColumn: 'latitude',
                    lonColumn: 'longitude',
                    typeCoercion: { population: 'integer' }
                }
            }
        ],
        tools: [
            // Standard-Spatial-Tools werden automatisch eingespeist.
        ]
    }
}
```

Sieht die FlowMCP-CLI eine `source: 'sqlite-csv'`-Resource, lädt und validiert sie die Datei beim Hinzufügen, liest die Capability-Matrix und speist dann die Spatial-Tools ein, die die geladene Datei tatsächlich beantworten kann:

| Tool | Liefert | Benötigt |
|------|---------|----------|
| `featuresInBBox` | Zeilen innerhalb einer Breiten-/Längen-Bounding-Box | `spatialQuery` |
| `nearPoint` | Zeilen nahe einer Koordinate, Haversine-sortiert | `spatialQuery` |
| `byType` | Exact-Match-Attributfilter auf einer beliebigen Spalte | `attributeFilter` |

Die Tool-Namen werden mit dem Schema-Namespace vorangestellt — `places.nearPoint`, `places.featuresInBBox`. Fehlt den geladenen Daten eine Fähigkeit (etwa weil sie keine brauchbaren Koordinatenspalten haben), wird das passende Tool schlicht nicht eingespeist. Kein 404, kein Fehler zum Aufrufzeitpunkt, keine halluzinierte Antwort. Weil die Abfragemethoden in einem zentralen Add-on liegen, propagiert ein Fix zu jedem Schema, das es nutzt.

## Verteilung und Daten-Politik

Wie sein Geschwister wird das Toolkit **über GitHub ausgeliefert, nicht über die npm-Registry**:

```bash
npm install github:FlowMCP/csv-tsv-sqlite-toolkit
```

Provider-CSV/TSV-Datensätze tragen eigene Lizenzen und werden **niemals** im Repo mitgeliefert — nur eine synthetische CC0-Fixture für die Tests. Das Schema zeigt auf die eigene HTTPS-URL des Anbieters; die Daten bleiben beim Anbieter, und die Engine bleibt bei FlowMCP. Das Modell setzt voraus, dass die ganze Datei in **einem** Request zurückkommt — paginierte Quellen (etwa WFS) sind out of scope.

## Warum das zählt

CSV ist der Ort, an dem offene Daten leben, und stilles Parsen ist der Ort, an dem Open-Data-Pipelines leise schiefgehen. Das `csv-tsv-sqlite-toolkit` macht die heiklen Teile von CSV unüberspringbar: Du benennst das Trennzeichen, die Dezimal-Notation, die Koordinatenspalten und den Typ jeder mehrdeutigen Spalte — oder das Laden stoppt und sagt dir, warum. Zurück bekommst du einen validierten In-Memory-Datensatz hinter drei Spatial-Tools, die kostenlos in FlowMCP verdrahtet sind. Kein Raten, keine Defaults, keine Überraschungen — und, seit Memo 096, auch kein On-Disk-Artefakt.

---

> 📖 Lies auch:
> - *[FlowMCP v4.1 — GTFS als erste Datenklasse mit eigenem Add-on](/de/blog/2026-05-flowmcp-v41-gtfs-add-on/)* — das Add-on-Muster, dem dieses Toolkit folgt, an einem schweren CSV-in-ZIP-Datensatz.
> - *[GeoJSON als per URL geladene In-Memory-Ressource](/de/blog/2026-06-geojson-sealed-sqlite/)* — das selbstbeschreibende Geschwister, das keine Parse-Config braucht.
</content>
