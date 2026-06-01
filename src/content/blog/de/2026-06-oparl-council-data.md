---
title: "OParl — Ein Schema für Deutschlands Ratsinformationssysteme"
description: "Wie ein einziges, vendor-agnostisches FlowMCP-Schema lesenden Zugriff auf kommunale Ratsdaten öffnet — Sitzungen, Drucksachen, Personen — über mehr als hundert Ratssysteme hinweg."
date: 2026-06-01
author: "FlowMCP Team"
tags: ["data-formats", "oparl", "open-government", "open-data"]
lang: de
---

> 2026-06-01 · FlowMCP Team · #data-formats #oparl #open-government

Deutsche Kommunen veröffentlichen einen großen Teil ihrer demokratischen Arbeit online: Ratssitzungen, Tagesordnungen, Anträge, die Personen in den Gremien. Die Daten sind öffentlich — aber sie liegen hinter dutzenden verschiedenen Ratsinformationssystemen (RIS), jedes von einem anderen Hersteller, jedes mit eigenem URL-Aufbau. **OParl** ist der offene Standard, der sie vereinheitlicht, und FlowMCP spricht ihn jetzt mit einem einzigen Schema.

## Was ist OParl?

OParl ist ein offener Standard für den **anonymen, lesenden Zugriff auf deutsche Ratsinformationssysteme**. Er definiert JSON-basierte REST-APIs — kein Login, keine Sessions — für die wiederkehrenden Objekte kommunaler Demokratie: Körperschaften, Sitzungen, Tagesordnungspunkte, Drucksachen (Anträge und Dokumente), Personen und Organisationen (Gremien und Fraktionen). Zwei Versionen sind im Feld: OParl 1.1 (aktuell) und OParl 1.0.

Der Haken: OParl standardisiert die *Datenform*, nicht den *URL-Aufbau*. Verschiedene Hersteller liefern dieselben Objekte unter unterschiedlichen Pfaden. Ein Tool, das „die neuesten Sitzungen von Rat X" lesen will, muss wissen, auf welcher Hersteller-Familie X läuft.

## Was das FlowMCP-`oparl`-Schema kann

FlowMCP verbirgt diese Hersteller-Spaltung hinter einem Schema. Du nennst einen Rat; der Handler erkennt die Hersteller-Familie am URL-Muster des Endpoints und leitet die Anfrage auf die richtigen Pfade. Drei Bausteine greifen ineinander:

| Komponente | Rolle |
|------------|-------|
| **`oparl-registry`** | Discovery-Schicht. `listEndpoints` liefert alle bekannten deutschen OParl-Räte; `getMetaData` gibt für einen Rat OParl-Version, Hersteller-Familie, verfügbare Objekttypen und Lizenz zurück. Die Registry wird täglich vorgeladen (`preload { ttl: 86400 }`). |
| **`oparl`** | Zugriffs-Schicht. Acht Kern-Tools decken die Standard-Objekte ab (siehe unten). |
| **`oparl-select`** (Skill) | UI-Helfer. Nutzt `prefill` auf `listEndpoints`, damit die Rats-Auswahl immer die Live-Registry spiegelt — nie eine veraltete, fest verdrahtete Liste. |

Die acht Zugriffs-Tools:

| Tool | Liefert |
|------|---------|
| `getBodies` | Die Körperschaften eines Rats |
| `getMeetings` | Sitzungen einer Körperschaft (paginiert) |
| `getMeeting` | Eine einzelne Sitzung mit Tagesordnung |
| `getPapers` | Drucksachen / Anträge (paginiert) |
| `getPaper` | Eine einzelne Drucksache |
| `getPersons` | Ratsmitglieder (paginiert) |
| `getOrganizations` | Gremien und Fraktionen (paginiert) |
| `getAgendaItem` | Ein einzelner Tagesordnungspunkt (OParl 1.1) |

Die Hersteller-Familie — SD.NET RIM, ALLRIS, gremien.info — wird automatisch aus dem URL-Muster erkannt. Für den Aufrufer ist sie unsichtbar: Du fragst einen Rat beim Namen, das Schema erledigt den Rest.

## Abdeckung

Die Registry listet derzeit **mehr als 120 deutsche Ratssysteme**, und weil sie täglich von `dev.oparl.org/api/endpoints` geholt wird, wächst diese Zahl von allein, sobald weitere Kommunen online gehen. Berlin allein erscheint mit mehreren einzeln gelisteten Bezirken. Die Abdeckung ist so breit wie die öffentliche Registry — von großen Stadträten bis zu kleinen Gemeinden mit wenigen tausend Einwohnern.

## Was man fragen kann

- **„Zeig mir die neuesten Sitzungen von Rat X."** — `getMeetings` mit umgekehrter Pagination.
- **„Wer sitzt im Rat? Wer leitet welche Fraktion?"** — `getPersons`, `getOrganizations`.
- **„Was wurde zu diesem Antrag entschieden?"** — `getPaper`, entlang der verlinkten Beratungen und Sitzungen.
- **„Was hat sich seit gestern geändert?"** — der Parameter `modified_since`, für Crawler und Sync-Jobs.

### Ehrliche Grenzen

OParl ist ein bewusst einfacher Standard, und das Schema kaschiert seine Lücken nicht. Die API hat keine Freitext-Titelsuche und keine Datums-Sortierung, und `created_since` filtert nach *Erfassungs*-Datum, nicht nach *Sitzungs*-Datum. „Alle Sitzungen aus 2024" ist deshalb ein Zwei-Schritt-Muster (durchblättern, client-seitig filtern), keine einzelne Abfrage. Wir bilden ab, was der Standard wirklich kann — nichts dazuerfunden.

## Warum das zählt

Ratsdaten sind die roheste Form von Open Government: wer was beantragt hat, wer abgestimmt hat, wann. Bisher hieß kommunenübergreifendes Arbeiten damit: pro Hersteller einen eigenen Adapter schreiben. Mit OParl als FlowMCP-Datenklasse kann ein KI-Assistent jeden registrierten Rat über dieselben acht Tools lesen — und die Implementierung bleibt bewusst minimal: acht Tools, eine tägliche Registry, keine Datenbank. Genau das, was der Standard braucht, nichts mehr.

---

> 📖 Lies auch:
> - *[Lokale Daten in FlowMCP — Wann SQLite, Preload oder Shared Lists?](/de/blog/2026-06-local-data-sqlite-preload-shared-lists/)* — die Daten-Verankerungs-Mechanismen hinter Schemas wie diesem.
> - *[FlowMCP v4.1 — GTFS als erste Datenklasse mit eigenem Add-on](/de/blog/2026-05-flowmcp-v41-gtfs-add-on/)* — eine weitere Open-Data-Klasse, das Schwer-Daten-Gegenstück zur leichten OParl-API.
