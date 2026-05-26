---
title: "Anschluss erreichen — Wie FlowMCP zum Mobility-Framework wurde"
description: "Story aus dem 'Anschluss erreichen'-Hackathon von DB InfraGO, mit FlowMCP als technischer Basis fuer drei Mobility-Challenges."
date: 2026-03-23
author: "FlowMCP Team"
tags: ["hackathon", "mobility", "deutsche-bahn", "berlin"]
lang: de
---

## Was war "Anschluss erreichen"?

Am **20. und 21. Maerz 2026** (Freitag 10:00 bis Samstag 18:00) veranstalteten **DB InfraGO**, **DB mindbox**, die **Infostelle Radparken** und **Velokonzept** im **Berliner Hauptbahnhof** (Washingtonplatz 2, 10557 Berlin) einen 2-tägigen Hackathon zum Thema Anschlussmobilitaet. Drei Challenges standen zur Wahl:

| Challenge | Thema | Kernfrage |
|-----------|-------|-----------|
| **Mobilitaetsdaten** | Datennutzung | Wie koennen Mobilitaetsdaten Wege entlang der ersten/letzten Meile verbessern? |
| **Anschlussmobilitaet** | Intermodalitaet | Wie koennen Fahrraeder, Scooter, Sharing und Fussverkehr die Bahnhofserreichbarkeit erhoehen? |
| **Radparken** | Sicheres Parken | Wie kann der Zugang zu gesichertem Fahrradparken an Bahnhoefen vereinfacht werden? |

Testfelder waren Berlin Hbf, S+U Jannowitzbruecke, Potsdam (4 Bahnhoefe) und Bad Belzig.

## Wie wir FlowMCP eingesetzt haben

Unser Beitrag adressierte die **Mobilitaetsdaten-Challenge**. Die Aufgabe: aus einem heterogenen Set deutscher Mobility-APIs einen Agenten bauen, der Anschluss-Fragen beantwortet — "Wie komme ich von Berlin Hbf nach Bad Belzig mit dem Anschluss-Rad?", "Welche Sharing-Optionen gibt es am Ziel-Bahnhof?".

In mehreren Vorbereitungs-Sprints haben wir die deutschen Mobility-Provider als REST-API-Schemas in FlowMCP eingepflegt — DELFI, VBB, Sharing-APIs, Radparken-Datensaetze. Damals noch ohne GTFS-Add-on: jede Schedule-Abfrage ging als REST-Call durch.

### Was hat sich bewaehrt

| Aspekt | Wirkung |
|--------|---------|
| **Schema-Library als Vorrat** | Statt 8 verschiedene API-Docs am Tag zu lesen, hatten wir eine `flowmcp search mobility`-Liste mit fertigen Integrationen. |
| **AI-Key-Trennung** | Demo lief auf einem Rechner, an dem mehrere Augen mitschauten. API-Keys blieben in FlowMCP, nie in der LLM-Konversation. |
| **Mock-Mode** | Bei flackerndem WiFi am Hauptbahnhof half der Mock-Mode, die Praesentation unabhaengig vom Netz zu testen. |

### Was wir gelernt haben

Mobility-Daten sind **zeitlich** strukturiert. GTFS-Feeds, Service-Calendars, Realtime-Endpoints — ohne deterministische Time-Window-Abfragen verliert sich die LLM in Fragen wie "welcher der drei Trains ist morgen?". Hier zeigte sich die spaetere Antwort von v4: **Skills mit Prefill** und **Pipes mit Output-Schema**.

Mobility-Daten ueber REST-Calls funktioniert, ist aber teuer fuer Time-Window-Queries (jede Frage = ein API-Call). Aus dieser Friction entstand v4.1: GTFS-Feeds werden einmal lokal zu SQLite konvertiert, danach laufen tausende Queries ohne weiteren Netzwerk-Hit. Mehr im Folge-Beitrag.

## Ergebnis

Wir haben einen funktionierenden Mobilitaetsdaten-Agenten gebaut, der mehrere deutsche Mobility-APIs ueber eine einzige FlowMCP-Schema-Library anspricht und Anschluss-Fragen entlang der ersten und letzten Meile beantwortet. Der Lauf am Hauptbahnhof bestaetigte die Kernhypothese: eine kuratierte Schema-Library schlaegt Live-Integration unter Zeitdruck.

## Was wir mitnehmen

| Erkenntnis | Folge |
|------------|-------|
| Schemas als Vorrat schlagen Live-Integration | bestaetigt FlowMCP-Kernhypothese |
| Mock-Mode ist nicht "nice to have" | wurde zur Pflicht in Hackathon-Kontexten |
| Mobility braucht eigene Primitive | fuehrte zu v4.1 GTFS Add-on |
| Determinismus + LLM-Komposition braucht Strukturen | wurde Skills + Pipes (v4) |

## Quellen

- Veranstalter: DB InfraGO, DB mindbox, Infostelle Radparken, Velokonzept
- Ort: Berliner Hauptbahnhof, Washingtonplatz 2, 10557 Berlin (20.–21. Maerz 2026)

---

> 📖 Lies auch:
> - *[FlowMCP v4 — Skills, Selections, Pipes](/de/blog/2026-05-flowmcp-v4-skills-selections-pipes/)*
> - *[FlowMCP v4.1 — GTFS als erste Datenklasse mit eigenem Add-on](/de/blog/2026-05-flowmcp-v41-gtfs-add-on/)*
