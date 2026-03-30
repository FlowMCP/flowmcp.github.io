---
title: Haeufige Fragen (FAQ)
description: Antworten auf die wichtigsten Fragen zu Open Data Enabled AI.
---

## Bietet ihr Daten an?

Nein. Wir erstellen **Schemas**, damit bestehende oeffentliche Daten fuer KI-Systeme einfacher erreichbar werden. Die Daten bleiben beim Anbieter — wir speichern nichts, hosten nichts, veraendern nichts. Wir bauen den Adapter zwischen der Datenquelle und der KI.

## Warum braucht man so viele Datenquellen?

Weil echte Fragen im Alltag nie einfach sind.

"Soll ich morgen mit dem Fahrrad fahren?" klingt nach einer einfachen Frage. Aber um sie gut zu beantworten, braucht die KI:
- **Wetterdaten** — Regnet es morgen?
- **Routendaten** — Wie weit ist es?
- **Sharing-Daten** — Gibt es ein Fahrrad in der Naehe?
- **Kalenderdaten** — Habe ich ueberhaupt einen Termin ausser Haus?

Eine einzelne Datenquelle liefert eine einzelne Antwort. Erst die Kombination macht die Antwort wirklich nuetzlich. Genau das machen unsere Schemas moeglich.

Konkrete Beispiele: [Use Cases →](/de/introduction/use-cases/)

## Brauche ich einen API-Key?

Fuer die meisten unserer Schemas nicht. Wir starten bewusst mit Datenquellen, die **ohne API-Key** frei zugaenglich sind — Wetterdaten, OEPNV-Fahrplaene, Geocoding, Fahrrad-Sharing und mehr.

Schemas die einen API-Key benoetigen, sind klar gekennzeichnet.

## Was ist ein Schema?

Ein Schema beschreibt, wie man eine Datenquelle abfragt — strukturiert und standardisiert. Es ist wie ein **Adapter** zwischen der API des Datenanbieters und der KI.

Pro Datenanbieter gibt es ein Schema. Pro Schema gibt es mehrere Tools (einzelne Abfragen). Die KI muss die API-Dokumentation nicht selbst lesen — das Schema hat die Arbeit bereits erledigt.

Mehr dazu: [Schemas und Tools →](/de/basics/schemas-and-tools/)

## Kann ich eure Schemas auch ohne OpenClaw nutzen?

Ja. Unsere Schemas funktionieren mit **jedem MCP-kompatiblen Client** — ueber 100 Anwendungen, darunter Claude, ChatGPT, Cursor, VS Code Copilot und viele mehr. OpenClaw ist nur eine von vielen Moeglichkeiten.

Welcher Client fuer wen: [Clients und Kompatibilitaet →](/de/basics/clients/)

## Ist das kostenlos?

Ja. Alles ist **Open Source unter MIT-Lizenz** — die Schemas, die Tools, der Code, die Dokumentation. Frei nutzbar fuer alle, ohne Einschraenkungen.

## Speichert ihr meine Daten?

Nein. Wir haben **kein Backend**. Die Schemas laufen lokal auf deinem Geraet oder ueber den Client deiner Wahl. Wir sehen keine Anfragen, speichern keine Daten, haben keinen Zugang zu deinen Abfragen.
