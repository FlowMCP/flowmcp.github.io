---
title: "Anschluss erreichen — Wie FlowMCP zum Mobility-Framework wurde"
description: "Story aus dem 'Anschluss erreichen'-Hackathon von DB InfraGO, mit FlowMCP als technischer Basis fuer drei Mobility-Challenges."
date: 2026-12-31
author: "FlowMCP Team"
tags: ["hackathon", "mobility", "deutsche-bahn", "berlin"]
draft: true
---

> ℹ️ **`date` ist Platzhalter** (2026-12-31). Vor Publish auf das exakte Mai-Datum setzen.

> ⚠️ **DRAFT — USER-REVIEW PFLICHT**
> Dieser Beitrag enthaelt Verweise auf offizielle Auszeichnungen und externe Stakeholder (Deutsche Bahn). Vor Veroeffentlichung muessen alle `[USER-REVIEW: …]`-Marker geklaert sein.

## Was war "Anschluss erreichen"?

Am **20. und 21. Maerz 2026** veranstalteten **DB InfraGO**, **DB mindbox**, die **Infostelle Radparken** und **Velokonzept** im Berliner Hauptbahnhof einen 2-tägigen Hackathon zum Thema Anschlussmobilitaet. Drei Challenges standen zur Wahl:

| Challenge | Thema | Kernfrage |
|-----------|-------|-----------|
| **Mobilitaetsdaten** | Datennutzung | Wie koennen Mobilitaetsdaten Wege entlang der ersten/letzten Meile verbessern? |
| **Anschlussmobilitaet** | Intermodalitaet | Wie koennen Fahrraeder, Scooter, Sharing und Fussverkehr die Bahnhofserreichbarkeit erhoehen? |
| **Radparken** | Sicheres Parken | Wie kann der Zugang zu gesichertem Fahrradparken an Bahnhoefen vereinfacht werden? |

Testfelder waren Berlin Hbf, S+U Jannowitzbruecke, Potsdam (4 Bahnhoefe) und Bad Belzig.

## Wie wir FlowMCP eingesetzt haben

Unser Beitrag adressierte die **Mobilitaetsdaten-Challenge**. Die Aufgabe: aus einem heterogenen Set deutscher Mobility-APIs einen Agenten bauen, der Anschluss-Fragen beantwortet — "Wie komme ich von Berlin Hbf nach Bad Belzig mit dem Anschluss-Rad?", "Welche Sharing-Optionen gibt es am Ziel-Bahnhof?".

Vorher hatten wir in mehreren Sprints (`.memo/003-hackathon-anschluss-erreichen`) ein Inventar deutscher Mobility-Provider erstellt und systematisch als FlowMCP-Schemas vorbereitet — ÖPNV (DELFI, VBB), Fernverkehr, Sharing-APIs, Radparken-Datensaetze. Am Hackathon-Tag mussten wir die Schemas nicht mehr schreiben — wir mussten sie nur noch komponieren.

### Was hat sich bewaehrt

| Aspekt | Wirkung |
|--------|---------|
| **Schema-Library als Vorrat** | Statt 8 verschiedene API-Docs am Tag zu lesen, hatten wir eine `flowmcp search mobility`-Liste mit fertigen Integrationen. |
| **AI-Key-Trennung** | Demo lief auf einem Rechner, an dem mehrere Augen mitschauten. API-Keys blieben in FlowMCP, nie in der LLM-Konversation. |
| **Mock-Mode** | Bei flackerndem WiFi am Hauptbahnhof half der Mock-Mode, die Praesentation unabhaengig vom Netz zu testen. |

### Was wir gelernt haben

Mobility-Daten sind **zeitlich** strukturiert. GTFS-Feeds, Service-Calendars, Realtime-Endpoints — ohne deterministische Time-Window-Abfragen verliert sich die LLM in Fragen wie "welcher der drei Trains ist morgen?". Hier zeigte sich die spaetere Antwort von v4: **Skills mit Prefill** und **Pipes mit Output-Schema**.

Aus dieser Friction entstand v4.1: GTFS als erste vollwertige Datenklasse mit eigenem Add-on (`gtfs-sqlite-toolkit`). Mehr dazu im Folge-Beitrag.

## Ergebnis

`[USER-REVIEW: Platzierung — wir wissen, dass eine Auszeichnung erfolgt ist; bitte exakte Formulierung pruefen und ggf. Link zur Pressemitteilung einsetzen]`

`[USER-REVIEW: Preisverleihung im Mai — bitte exaktes Datum und Veranstaltungsort einsetzen]`

`[USER-REVIEW: Bundesminister-Bezug — wer genau, welches Ministerium, welche Auszeichnung? Nur einsetzen wenn extern verifiziert]`

`[USER-REVIEW: Foto-Freigabe — Foto-Freigabe vom Team + Veranstalter eingeholt? Ohne Freigabe: kein Foto einsetzen]`

## Was wir mitnehmen

| Erkenntnis | Folge |
|------------|-------|
| Schemas als Vorrat schlagen Live-Integration | bestaetigt FlowMCP-Kernhypothese |
| Mock-Mode ist nicht "nice to have" | wurde zur Pflicht in Hackathon-Kontexten |
| Mobility braucht eigene Primitive | fuehrte zu v4.1 GTFS Add-on |
| Determinismus + LLM-Komposition braucht Strukturen | wurde Skills + Pipes (v4) |

## Quellen

- Hackathon-Page DB InfraGO: `[USER-REVIEW: Link zur offiziellen Event-Page]`
- Pressemitteilung: `[USER-REVIEW: Link bzw. "noch nicht veroeffentlicht"]`
- Memo 003 (Vorbereitungs-Dokumentation): intern

---

> 📖 Lies auch:
> - *[FlowMCP v4 — Skills, Selections, Pipes](/blog/2026-05-flowmcp-v4-skills-selections-pipes/)*
> - *FlowMCP v4.1 — GTFS als erste Datenklasse mit eigenem Add-on* (in Vorbereitung)
