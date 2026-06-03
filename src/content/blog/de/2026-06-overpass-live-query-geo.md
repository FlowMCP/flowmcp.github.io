---
title: "OpenStreetMap rund um einen Punkt — das Overpass-Live-Query-Add-on"
description: "Wie das geo-overpass-toolkit die Overpass-API in eine sichere, wiederverwendbare Geo-Quelle verwandelt — kuratierte Multi-Key-Kategorien, vorgefertigte kombinierte Selections und eine Union-Query pro Aufruf, damit Rate-Limits nie zuschlagen."
date: 2026-06-03
author: "FlowMCP Team"
tags: ["data-formats", "geo", "overpass", "openstreetmap", "add-on", "live-query", "open-data"]
lang: de
---

> 2026-06-03 · FlowMCP Team · #geo #overpass #add-on #live-query

> **Eine dritte Add-on-Kategorie.** Die bisherigen Geo-Add-ons sind entweder *In-Memory-statisch* ([geojson](https://github.com/FlowMCP/geojson-sqlite-toolkit) / [csv-tsv](https://github.com/FlowMCP/csv-tsv-sqlite-toolkit)) oder *sealed-SQLite* ([gtfs](https://github.com/FlowMCP/gtfs-sqlite-toolkit)). Das neue **`geo-overpass-toolkit`** ist das erste **Live-Query**-Add-on: ein HTTP-Request pro Aufruf gegen die öffentliche Overpass-API, mit Response-Cache.

Die Frage, die dieses Add-on beantwortet, ist die gewöhnlichste der Geo-Welt: *„Wo bin ich, und was ist um mich herum?"* OpenStreetMap weiß es längst — die Restaurants, die Apotheken, die Bushaltestellen, die Spielplätze sind alle da. Das Schwierige waren nie die Daten, sondern danach zu fragen, ohne sich zu verletzen.

## Das Problem: Overpass ist mächtig und scharfkantig

Die Overpass-API ist das richtige Werkzeug, um live in OSM abzufragen, aber sie hat drei Kanten, an denen sich Einsteiger schneiden:

- **Tag-Chaos.** „Gibt es eine Apotheke in der Nähe?" ist `amenity=pharmacy`. Eine **Drogerie** ist `shop=chemist` — ein völlig anderer Tag. Ein **Späti** ist `shop=convenience` oder `shop=kiosk`. Mit dem falschen Tag bekommst du nichts zurück, ohne Fehlermeldung.
- **Rate-Limits.** Feuere zehn kleine Queries für zehn Kategorien ab, und du bekommst zehn Slots plus Cooldowns — und dann HTTP 429. Die Anzahl der *Clauses* in einer Query ist nicht das Limit; die *Ergebnisgröße* ist es.
- **Ergebnis-Trunkierung.** Frage volle Geometrie über eine große Fläche ab, und der Server kürzt deine Antwort stillschweigend.

Ein naiver Wrapper versteckt das und scheitert unvorhersehbar. Dieses Add-on macht das Gegenteil: Es backt die scharfen Kanten in wiederverwendbare, getestete Bausteine ein.

## Eine Union-Query statt N Requests

Die Kernregel lautet **Over-Fetch schlägt Under-Fetch**: Eine einzelne Overpass-*Union*-Query über viele Tags kostet **einen** Slot, während zehn getrennte Kategorie-Queries zehn Slots kosten und ins Rate-Limit laufen. Daher kollabieren beide Selektoren zu genau einem Request:

```
nearPoint({ lat, lon, radiusMeters, selection })        // ein vorgefertigtes Bündel
nearPoint({ lat, lon, radiusMeters, categories: [...] }) // dein eigenes Bündel, trotzdem EINE Query
```

Der Builder gibt immer `out tags center` aus (nie `out geom`), hält eine Radius-Decke ein und sendet einen aussagekräftigen `User-Agent` (ein generischer bringt HTTP 406). Ein Slot, begrenztes Ergebnis, Attribution angehängt.

## Eine Eskalations-Leiter

Du triffst die Daten auf der Ebene, die du brauchst, und steigst nur herab, wenn du mehr Kontrolle willst:

1. **Selection** — ein vorgefertigtes, kombiniertes Template mit eingebackenen Tag-Gotchas (`public_transport`, `daily_shopping`, `food_drink`, `health`, `culture`).
2. **`categories[]`** — stelle dein eigenes Bündel aus einem kuratierten Katalog von **238 Kategorien in 8 Gruppen** zusammen, multi-key und OR-gematcht, sodass *Drogerie ≠ Apotheke*, *Späti*, *Baumarkt* und *Döner* alle korrekt auflösen.
3. **`discoverCategories`** — „was ist hier eigentlich?" — eine Probe-Query liefert Kategorien und Anzahlen, ohne Geometrie.
4. **`runOverpassQL`** — die rohe Notausgang-Box für Experten, mit Guards (`[out:json]` erzwungen, Filter/bbox/area Pflicht, `[timeout]`/`[maxsize]` auto-vorangestellt, Schreibzugriffe abgelehnt).

## Derselbe Standard wie bei jedem Geo-Add-on

Jedes Ergebnis ist eine normalisierte RFC-7946-**FeatureCollection** mit `[lon, lat]`-Koordinaten und den kanonischen Anker-Feldern — `osm_id`, `name`, `category`, `_source`, `licence`, `_distanceMeters`. Genau diese Form liefern auch die geojson-, csv-tsv- und gtfs-Add-ons, mit derselben Methodenfamilie (`nearPoint`, `inBoundingBox`, `byType`). Ein Standard über alle vier bedeutet: Ergebnisse sind direkt vergleichbar und pipebar.

## Eingebunden in den Geo-Eintrittspunkt — opt-in, nie Default

Der kanonische `geo`-Provider kann `geoNearby` über lokale Quellen (GTFS, Overture) ausfächern und, **nur wenn du es anforderst**, über Overpass:

```
geoNearby({ lat, lon, radiusMeters, sources: "overpass", selection: "public_transport" })
```

Overpass ist nie ein stiller Default: Forderst du es ohne `selection` oder `categories[]` an, bekommst du einen expliziten Fehler, kein Raten. Die vier Betriebs-Blocker — Rate-Limit, Cache, ODbL-Attribution, keyless — leben *im* Add-on, sodass der Geo-Provider sie nie tragen muss.

## Scope: Entdecken, nicht Navigieren

Dies ist ein Punkt-und-Umkreis-Entdeckungswerkzeug. Es gibt **keine Routenplanung und keine Topologie** — das ist bewusst außerhalb des Scopes. Und eine ehrliche Grenze, die genannt werden sollte: **Events sind nicht in OpenStreetMap.** OSM hat den Veranstaltungsort; es hat nicht, was heute Abend läuft. Dafür ist eine Quelle wie [kulturdaten.berlin](https://github.com/FlowMCP) komplementär.

OpenStreetMap wusste schon immer, was um dich herum ist. Das Overpass-Add-on macht es nur sicher, danach zu fragen.
