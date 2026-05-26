---
title: "Anschluss erreichen — Wie FlowMCP zum Mobility-Framework wurde"
description: "Story aus dem 'Anschluss erreichen'-Hackathon von DB InfraGO — der Main Contributor von FlowMCP erreichte mit einem Multi-Agent-Mobility-Assistenten den 3. Platz."
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

Testfelder waren Berlin Hbf, S+U Jannowitzbruecke, Potsdam (4 Bahnhoefe) und Bad Belzig. Unser Team — **Open Data AI** — trat in der **Mobilitaetsdaten-Challenge** an, und der Main Contributor von FlowMCP **erreichte den 3. Platz**.

Das gesamte Projekt ist Open Source: **[github.com/a6b8/hackathon-anschluss-erreichen](https://github.com/a6b8/hackathon-anschluss-erreichen)**.

## Was wir angeschlossen haben

Die Aufgabe: aus einem heterogenen Set deutscher Mobility-APIs einen Assistenten bauen, der Anschluss-Fragen beantwortet — "Wie komme ich von Berlin Hbf nach Bad Belzig mit dem Anschluss-Rad?", "Welche Sharing-Optionen gibt es am Ziel-Bahnhof?".

Wir haben **9 oeffentliche APIs** (ohne Auth-Keys) als FlowMCP-Schemas eingebunden und damit insgesamt **27 Tools** bereitgestellt:

- **transport.rest** (DB- und VBB-Fahrplaene), **Overpass / OpenStreetMap** (Radparken & Amenities), **Nominatim** (Geocoding), **BrightSky** (DWD-Wetter), **nextbike** (Bike-Sharing), **infraVelo** (Berliner Radinfrastruktur), **FlixBus** (Fernrouten & Preise) und **V-Locker** (17 sichere Fahrradboxen) — Letzteres ein Schema, das wir fuer den Hackathon selbst geschrieben haben.

Das lief damals auf **FlowMCP v3.0.0**, ausgeliefert ueber den **mcp-agent-server** per streamable HTTP, auf Node.js 22 + Express, mit einem kleinen Leaflet.js- + marked.js-Frontend.

## Die Architektur: ein Agent Server vor v4

Das Projekt lief auf dem **[MCP Agent Server](https://github.com/FlowMCP/mcp-agent-server)** — eine Idee, die *vor* dem FlowMCP-v4-Release datiert und damals hochexperimentell war. Der Hackathon war der Stresstest; danach wurde das Agent-Server-Konzept fest in v4 eingebaut und die Learnings in den Spec uebertragen.

Wir haben bewusst **Level&nbsp;3 — Orchestration** gewaehlt, aus den drei Nutzungs-Ebenen, die die Doku unter [Agents](/de/concepts/primitives/#agents) beschreibt (Level 1: nur Tools · Level 2: ein einzelner Sub-Agent · Level 3: ein Orchestrator, der mehrere koordiniert). Die Form:

- Ein **Haupt-Agent ("Kommunikator", Claude Sonnet)** leitete jede Anfrage an den passenden Experten weiter.
- **Vier Experten-Sub-Agents (Claude Haiku)** erledigten die eigentliche Arbeit: **Bahnhof-Ueberleben** (Toiletten, Essen, Hotels), **Ticketkauf** (Preisvergleich DB vs. FlixBus), **Radparken** (Parken & Infrastruktur) und **Navigator** (Anschluss-Machbarkeit bei Verspaetungen).
- Der Kommunikator hielt **Rueckfragen** mit dem User ueber ein eigens gebautes Interface — die Idee war, diese Klaerungen ueber **Elicitation** laufen zu lassen.

Genau dieses Muster aus Orchestrierung-mit-Rueckfragen war die Luecke, die v4 spaeter geschlossen hat.

## Was wir gelernt haben

Mobility-Daten sind **zeitlich** strukturiert. GTFS-Feeds, Service-Calendars, Realtime-Endpoints — ohne deterministische Time-Window-Abfragen verliert sich die LLM in Fragen wie "welcher der drei Zuege ist morgen?". Und Routing ueber mehrere Experten-Agents funktioniert nur dann fluessig, wenn der Orchestrator eine Rueckfrage stellen und strukturierte Ergebnisse komponieren kann.

Beide Beobachtungen wurden zu **v4**: **Skills** fuer komplexe, mehrstufige Abfragen, erstklassige **Rueckfragen** und **Agents + Selections** als echte Primitive. Der Hackathon kam zuerst — als User-Test; erst danach war die Sicherheit da, v4 zu veroeffentlichen.

Eine zweite Friction war der Aufwand: Mobility-Daten ueber REST sind teuer fuer Time-Window-Queries (jede Frage = ein API-Call). Aus dieser Friction entstand **v4.1**: GTFS-Feeds werden einmal lokal zu SQLite konvertiert, danach laufen tausende Queries ohne weiteren Netzwerk-Hit. Mehr im Folge-Beitrag.

## Ergebnis

Wir haben einen funktionierenden Multi-Agent-Mobilitaetsassistenten gebaut, der neun deutsche Mobility-APIs ueber eine einzige FlowMCP-Schema-Library anspricht und Anschluss-Fragen entlang der ersten und letzten Meile beantwortet. Der Lauf am Hauptbahnhof bestaetigte die Kernhypothese: eine kuratierte Schema-Library schlaegt Live-Integration unter Zeitdruck — und es reichte fuer den **3. Platz**.

| Erkenntnis | Folge |
|------------|-------|
| Schemas als Vorrat schlagen Live-Integration | bestaetigt FlowMCP-Kernhypothese |
| Orchestrierung braucht Rueckfragen | wurde Rueckfragen + Agents (v4) |
| Mobility braucht eigene Primitive | fuehrte zum v4.1 GTFS Add-on |
| Determinismus + LLM-Komposition braucht Strukturen | wurde Skills + Selections (v4) |

## Ein Preis, zwei Monate spaeter

Am **19. Mai 2026** wurde auf der Konferenz "Anschluss erreichen" (Design Offices Berlin Humboldthafen, ~350 Teilnehmende) der Preis verliehen — ueberreicht vom **Bundesverkehrsminister Patrick Schnieder**. Wir waren dort und haben einen Preis vom Bundesminister erhalten. ([Konferenz-Seite](https://radparken.info/veranstaltung/anschluss-erreichen-2026/))

## Quellen

- Projekt-Repository: [a6b8/hackathon-anschluss-erreichen](https://github.com/a6b8/hackathon-anschluss-erreichen)
- Veranstalter: BMV, DB InfraGO, DB mindbox (mit Infostelle Radparken und Velokonzept)
- Ort: Berliner Hauptbahnhof, Washingtonplatz 2, 10557 Berlin (20.–21. Maerz 2026)

---

> 📖 Lies auch:
> - *[FlowMCP v4 — Skills, Selections, Pipes](/de/blog/2026-05-flowmcp-v4-skills-selections-pipes/)*
> - *[FlowMCP v4.1 — GTFS als erste Datenklasse mit eigenem Add-on](/de/blog/2026-05-flowmcp-v41-gtfs-add-on/)*
