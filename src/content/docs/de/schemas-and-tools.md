---
title: Schemas und Tools
description: Was ein Schema ist, was es enthaelt, und wie daraus Tools werden die jede KI nutzen kann.
---

## Was ist ein Schema?

Ein Schema ist der vollstaendige Bauplan fuer den Zugang zu einer Datenquelle. Es beschreibt einen einzelnen Datenanbieter — zum Beispiel den Deutschen Wetterdienst, die Deutsche Bahn oder ein Fahrradsystem wie nextbike.

**Pro Datenanbieter gibt es ein Schema. Pro Schema gibt es mehrere Tools.**

Das Schema selbst veraendert die Datenquelle nicht. Es uebersetzt zwischen der API des Anbieters und der KI — damit die KI die Daten strukturiert abfragen kann, ohne die API-Dokumentation selbst lesen und interpretieren zu muessen.

## Was steckt in einem Schema?

Ein Schema enthaelt vier Bereiche. Nur Tools sind Pflicht — die anderen drei sind optional und kommen bei komplexeren Datenquellen zum Einsatz.

![Provider-Schema Aufbau: Tools, Resources, Prompts, Skills](/images/provider-schema-aufbau.png)

### Tools (Pflicht)

Tools sind die Kernbausteine. Jedes Tool ist eine einzelne Abfrage an die API des Datenanbieters. Ein Schema kann mehrere Tools enthalten — typischerweise zwischen 2 und 8.

Jedes Tool definiert:

| Bestandteil | Was es tut |
|-------------|-----------|
| **method** | HTTP-Methode (GET, POST) |
| **path** | Der Endpunkt der API (z.B. `/weather/:city`) |
| **parameters** | Was reingeht — mit Validierung (Typ, Pflichtfeld, Grenzen) |
| **modifiers** | Vor- und Nachverarbeitung der Daten |
| **tests** | Mindestens 3 Testfaelle pro Tool — damit sichergestellt ist, dass es funktioniert |
| **output** | Was zurueckkommt — als strukturiertes Schema, damit die KI die Antwort versteht |

### Resources (Optional)

Lokale Daten, die nicht ueber eine API kommen sondern direkt im Schema mitgeliefert werden. Zum Beispiel eine SQLite-Datenbank mit Referenzdaten oder eine Markdown-Datei mit Erklaerungen.

### Prompts (Optional)

Hinweise fuer die KI, wie sie die Tools dieses Anbieters am besten nutzt. Model-neutral formuliert — sie helfen jeder KI, nicht nur einer bestimmten.

### Skills (Optional)

Schritt-fuer-Schritt-Anleitungen fuer komplexe Ablaeufe, die mehrere Tools kombinieren. Zum Beispiel: "Erst die Station finden, dann die Verbindungen abfragen, dann die Preise vergleichen."

## Beispiel: Bright Sky (Deutscher Wetterdienst)

Das Bright Sky Schema macht die Wetterdaten des DWD zugaenglich. Es enthaelt zwei Tools:

- **getWeather** — Aktuelles Wetter fuer einen Ort (Parameter: Breitengrad, Laengengrad, Datum → Ergebnis: Temperatur, Niederschlag, Wind, Bewoelkung)
- **getForecast** — 7-Tage-Vorhersage fuer einen Ort (Parameter: Breitengrad, Laengengrad → Ergebnis: Vorhersage pro Tag)

```
Datenquelle:  https://api.brightsky.dev
Tool:         getWeather
Aufruf:       GET /weather?lat=52.52&lon=13.41&date=2026-03-28
Ergebnis:     { temperature: 14.2, precipitation: 0, wind_speed: 12.5 }
```

Die KI sieht dieses Tool und weiss: "Damit kann ich das Wetter abfragen." Sie muss die API-Dokumentation des DWD nicht kennen — das Schema hat die Arbeit bereits erledigt.

## Wie wird ein Schema nutzbar?

Ein Schema ist zunaechst eine `.mjs`-Datei — eine Beschreibung in Code. Damit die darin enthaltenen Tools fuer KI-Clients verfuegbar werden, braucht es einen Server, der sie bereitstellt.

Das uebernimmt [FlowMCP](https://docs.flowmcp.org) — ein Open-Source-Framework, das Schemas laedt, die Struktur validiert, die Tests ausfuehrt und die Tools ueber das **Model Context Protocol (MCP)** bereitstellt. Ueber 100 KI-Clients unterstuetzen MCP bereits — von Claude ueber ChatGPT bis Cursor.

Das Ergebnis: Ein Tool, das in einem Schema definiert wurde, kann von jeder MCP-kompatiblen KI aufgerufen werden. Einmal beschrieben, ueberall nutzbar.

## Wie entstehen Schemas?

Schemas werden von der Community und dem FlowMCP-Team erstellt und gepflegt — basierend auf oeffentlich zugaenglichen API-Dokumentationen und in Zusammenarbeit mit Datenpartnern. Jedes Schema wird getestet (mindestens 3 Tests pro Tool), validiert und dokumentiert, bevor es verfuegbar wird.

Die Community kann Schemas ueber eine [5-Stufen-Pipeline](/de/community/) mit automatischer Validierung, KI-Pruefung und menschlicher Freigabe beitragen. Das Prinzip dahinter: **"Validated once, for all."** Was einmal sorgfaeltig geprueft wurde, steht danach allen zur Verfuegung.

## Eigene Schemas erstellen

Schemas folgen der FlowMCP Spezifikation v3.0.0:

- **Dokumentation:** [docs.flowmcp.org](https://docs.flowmcp.org)
- **Spezifikation:** [FlowMCP Spec v3.0.0](https://github.com/FlowMCP/flowmcp-spec)
- **Wie du beitragen kannst:** [Community Hub →](/de/community/)
- **Schema-Repository:** [github.com/flowmcp/flowmcp-schemas-public](https://github.com/flowmcp/flowmcp-schemas-public)
