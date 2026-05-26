---
title: Use Cases
description: Zwei Szenarien, die FlowMCP + AI im Einsatz zeigen — wie verstreute Daten zu einer Antwort werden.
---
<!-- PAGEFIND-META-START -->
<span style="display:none" data-pagefind-meta="section">About</span>
<!-- PAGEFIND-META-END -->

Zwei Szenarien, die FlowMCP + AI im Einsatz zeigen — nicht wie man einen Agent baut, sondern wie FlowMCP aus verstreuten Datenquellen eine nutzbare Antwort macht. Beide Cases setzen voraus, dass ein AI-Agent (Claude, GPT oder aehnlich) an ein Recherche-Tool, eine Planungssoftware oder einen CLI-Workflow angebunden ist und FlowMCP-CLI als Datenzugriffs-Schicht laeuft.

---

## Use Case 1: Deep Research

### Setup

Ein Recherche-Workflow — eine eigene Pipeline, ein internes Dashboard oder ein Notion-/Obsidian-Workspace — hat einen AI-Agent angebunden. Aufgabe des Agents: Daten aus vielen Quellen zusammentragen, um eine Forschungsfrage zu scopen oder zu beantworten. FlowMCP-CLI laeuft daneben als Werkzeug des Agents, um normalisierte Datenquellen zu finden und aufzurufen.

### Der Prompt

> Wir planen ein Open-Data-Projekt zur Luftqualitaet in deutschen Innenstaedten. Sammle Datenquellen zu Feinstaub-Messstationen, die Open-Data-Portale von Berlin, Muenchen und Hamburg, Wetter-Stationen zur Korrelation, und gib mir eine Liste mit Provider, Lizenz, Sample-Endpoint und Aktualisierungsfrequenz.

### Was FlowMCP macht

1. **Katalog durchsuchen** — Der Agent ruft `flowmcp search` mit Tags wie `airquality`, `opendata`, `berlin`, `weather`. FlowMCP gibt passende Schemas ueber viele Provider hinweg zurueck — mit Provider-Name, Lizenz und Kurzbeschreibung.
2. **Pro Schema einen Sample-Call** — Bei vielversprechenden Treffern macht der Agent einen Sample-Call (`flowmcp call <schema> <route>`). FlowMCP haelt die API-Keys, signiert den Request und liefert die normalisierte Antwort. Der Agent sieht die Datenform, nie die Credentials.
3. **Kombinieren und zusammenfassen** — Der Agent merget Ergebnisse aus Bundes-, Stadt- und Wetter-Quellen, dedupliziert ueberlappende Stationen und produziert eine Tabelle, mit der der User sofort arbeiten kann.

### Feste Datenquellen, eine Antwort

Der Agent greift auf einen festen Satz kuratierter Datenquellen zurueck — Bundes-, Stadt- und Wetter-Feeds, die einmal normalisiert wurden und nun bei jeder Anfrage wiederverwendet werden. Weil diese Quellen eine einheitliche Form und einen gemeinsamen Auth-Pfad teilen, fuehrt der Agent sie zu einer konsolidierten Antwort zusammen, statt fuer jede einzelne eine eigene API-Doku zu lesen. Die Arbeit, jede Quelle zu verstehen, passiert einmal — im Schema — und jeder Agent profitiert anschliessend davon.

> Statt der AI hunderte Tokens API-Doku pro Anfrage zu fuettern, sucht sie in einem normalisierten Katalog. Eine Schema-Investition, beliebig viele Agenten.

### Naechste Schritte

- [CLI-Setup →](/de/quickstart/quickstart/) — erster Call in unter 5 Minuten

---

## Use Case 2: Mobility — Anschluss erreichen

### Setup

Der GTFS-Pilot ist real und dokumentiert (siehe [GTFS-Pilot-Guide](/de/guides/gtfs-pilot/)). FlowMCP v4.1 liefert das Add-on-Konzept: externe Toolkits wie `gtfs-sqlite-toolkit` erweitern die CLI um lokale SQLite-Datenbanken fuer statische Fahrplaene. Die Kombination — statischer GTFS-Lookup plus Live-REST-API fuer Verspaetungen — macht diesen Case zu einem einzigen CLI-Call statt einer Jongliererei zwischen zwei Agenten.

### Der Prompt

> Ich bin am Berlin Hbf, will nach Muenchen. Mein ICE 8:05 hat 12 Minuten Verspaetung. Erreiche ich den Anschluss-IC in Nuernberg um 12:33 noch? Falls nicht, was waere die naechste Option?

### Was FlowMCP macht

1. **GTFS-SQLite-Lookup** (ueber `gtfs-sqlite-toolkit` Add-on, lokale DB) — Statischer Fahrplan ICE 8:05 → Anschluss IC 12:33, geplante Umsteigezeit 9 min, Bahnsteig-Layout in Nuernberg.
2. **Live-Verspaetungs-Query** (Deutsche-Bahn-REST-API via FlowMCP-Schema) — Aktueller Ankunfts-Forecast Nuernberg 12:29 (vorher 12:17), Umsteigezeit jetzt 4 min — kritisch.
3. **Alternativen-Suche** (GTFS-SQLite + REST kombiniert) — Naechster IC 13:33 als Backup, Ankunft Muenchen 14:55.
4. **AI-Antwort** — "IC 12:33 mit nur 4 Minuten Umsteigezeit nicht zuverlaessig. Backup: IC 13:33, Ankunft Muenchen 14:55 statt 13:13."

**Lokale SQLite-DB fuer Static-Lookup + Live-API ueber FlowMCP — ein CLI-Call, eine Antwort.** Ohne FlowMCP muesste der Agent die statische GTFS-Abfrage und die Live-REST-API separat orchestrieren, unterschiedliche Formate parsen und von Hand mergen.

### Naechste Schritte

- [GTFS-Pilot-Guide →](/de/guides/gtfs-pilot/) — die volle Mobility-Add-on-Geschichte
- [CLI-Setup →](/de/quickstart/quickstart/) — erster Call in unter 5 Minuten
