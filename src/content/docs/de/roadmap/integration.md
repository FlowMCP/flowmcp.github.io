---
title: Integration (Coming Soon)
description: MVP 2 — Wie unsere Schemas in bestehende Clients kommen, warum wir auf OpenClaw und CLI setzen, und was das fuer Nutzer bedeutet.
---

:::caution[In Planung]
Diese Seite beschreibt die geplante naechste Phase. Die Architektur ist durchdacht, die technische Umsetzung hat noch nicht begonnen.
:::

## Von der Demo zur echten Nutzung

FlowMCP-Schemas funktionieren End-to-End — von der Datenquelle bis zur KI-Agent-Antwort. Aber eine eigene App ist nicht das Ziel. Die meisten Menschen wollen keine neue App installieren. Sie wollen Antworten dort, wo sie bereits sind: in WhatsApp, Telegram, Slack oder ihrem bevorzugten KI-Assistenten.

Genau darum geht es in dieser Phase: Unsere Schemas und Agenten in **bestehende Clients** integrieren — nicht als Insel, sondern als Baustein in einem groesseren Oekosystem.

## Warum CLI-first?

Als wir im Oktober 2025 die erste Architektur entworfen haben, war der Plan: alles ueber MCP-Server. Das Model Context Protocol war der Standard, und es funktionierte. Aber seitdem hat sich etwas veraendert.

In der Praxis hat sich gezeigt, dass KI-Agenten am zuverlaessigsten mit **Commandline-Interfaces** arbeiten. Die Gruende sind technisch: Session-Initialisierung bei MCP ist fehleranfaellig, State-Management ueber Protokollgrenzen hinweg ist kompliziert, und sofortige Updates funktionieren mit CLI besser.

**Das bedeutet nicht, dass MCP tot ist.** MCP bleibt als zweiter Kanal bestehen — fuer Clients, die es bevorzugen. FlowMCP unterstuetzt beides. Aber fuer den primaeren Integrationsweg setzen wir auf CLI, weil es heute am zuverlaessigsten funktioniert.

## OpenClaw: Warum gerade dieses Projekt?

[OpenClaw](https://docs.openclaw.ai) ist ein Open-Source AI Assistant Gateway unter MIT-Lizenz. Es existiert erst seit November 2025 und hat bereits ueber 330.000 GitHub-Sterne erreicht — mehr als Linux, Kubernetes und Blender zusammen. Es ist das schnellstwachsende Software-Projekt auf GitHub.

Fuer uns ist OpenClaw aus mehreren Gruenden der richtige Partner:

**Cron Jobs veraendern alles.** Die meisten KI-Interaktionen sind reaktiv: Der Nutzer fragt, die KI antwortet. Mit OpenClaw koennen wir **proaktive** Abfragen einrichten. Ein Cron Job ist eine wiederkehrende Aufgabe, die automatisch laeuft — ohne dass der Nutzer etwas tun muss. Beispiele:

- "Jeden Morgen um 7:30 Uhr: Pruefe meine Verbindung zur Arbeit und melde Stoerungen"
- "Jeden Donnerstag: Suche alle neuen Ausschreibungen in meinem Fachgebiet"
- "Jeden Montag: Gibt es neue Handelsregistereintraege fuer diese Branche?"

Das ist eine zweite Ausbaustufe, die mit reinen MCP-Servern oder MCPUI nicht moeglich ist.

**Kalender-Integration.** OpenClaw kann mit externen Systemen wie Google Calendar oder iCal verbunden werden. Das ermoeglicht bedingte Abfragen: "Wenn morgens ein Termin mit dem Stichwort 'Kundenbesuch' im Kalender steht, dann bereite eine Zusammenfassung der relevanten Daten vor." Die Vorbereitung beruht auf Datenquellen, die wir ueber unsere Schemas bereitstellen. Das Ergebnis liegt fertig im Chat, bevor der Nutzer seinen Tag beginnt.

**Multi-Channel statt Multi-App.** OpenClaw liefert Antworten ueber WhatsApp, Telegram, Slack, Discord und weitere Kanaele. Der Nutzer entscheidet, wo er die Daten empfangen will — nicht wir. Unsere Schemas funktionieren in jedem dieser Kanaele gleich.

**Kein Gatekeeper.** Bei anderen Plattformen (z.B. OpenAI MCPUI) braucht man eine Genehmigung, um sichtbar zu werden. Bei OpenClaw nicht. Open Source bedeutet: Jeder kann unser Plugin installieren und nutzen — sofort, ohne Freigabe.

## Drei Integrations-Ebenen

Die Integration ist nicht ein einzelner Schritt, sondern ein Stufenmodell. Jede Stufe bringt unsere Schemas naeher an die Nutzer:

| Ebene | Was passiert | Fuer wen | Status |
|-------|-------------|----------|--------|
| **Ebene 1: MCP-Server** | Unsere Schemas werden direkt als MCP-Server in OpenClaw eingebunden. Alle drei Nutzungsarchitekturen funktionieren: einzelne Tools, Sub-Agenten mit eigener Intelligenz oder vollstaendige Orchestrierung mit Koordinator. | Entwickler, die MCP-Clients nutzen | Moeglich |
| **Ebene 2: OpenClaw Plugin** | Ein npm-Paket, das jedes Schema als Tool registriert. Veroeffentlichbar auf ClawHub, installierbar mit einem Befehl. Der schnellste Weg fuer Endnutzer. | Alle OpenClaw-Nutzer | Geplant |
| **Ebene 3: NemoClaw Policy-Preset** | Eine YAML-Datei, die alle API-Endpoints unserer Schemas buendelt. Enterprise-Kunden koennen damit sofort freischalten — mit den Sicherheitsrichtlinien, die ihre Organisation verlangt. | Firmen und Behoerden | Geplant |

### Enterprise-Sicherheit mit NemoClaw

Fuer den Einsatz in Firmen und Behoerden reicht Open Source allein nicht. Es braucht Sicherheitsrichtlinien, Sandbox-Isolation und kontrollierte Freigabeprozesse.

[NVIDIA NemoClaw](https://docs.nvidia.com/nemoclaw/) ist die Enterprise-Sicherheitsschicht fuer OpenClaw — ebenfalls Open Source unter **Apache 2.0 Lizenz** (Alpha seit Maerz 2026). Es bietet Deny-by-default Network Policies, Sandbox-Isolation und ein Blueprint-System. Ein Policy-Preset wuerde alle API-Endpoints unserer Schemas buendeln — sodass ein Sicherheitsbeauftragter mit einer einzigen Freigabe den Zugang zu allen offenen Datenquellen ermoeglichen kann.

Das ist relevant, weil: Offene Daten sind zwar oeffentlich, aber der Zugang zu ihnen innerhalb einer Organisation muss trotzdem geregelt sein. NemoClaw macht das moeglich, ohne dass wir selbst Enterprise-Infrastruktur betreiben muessen.

## Offen und frei: Lokaler Betrieb

Nicht jeder will oder kann Cloud-Dienste nutzen. Deshalb arbeiten wir parallel an einer komplett lokalen Loesung:

- **llama.cpp** als lokales LLM — kein API-Key, keine Kosten, volle Kontrolle ueber die eigenen Daten
- Betrieb auf einem **Raspberry Pi** — ein Geraet fuer unter 100 Euro, komplett unabhaengig von Cloud-Diensten
- Ideal fuer **Privatpersonen**, die ihre Daten nicht an Dritte senden wollen, fuer **Schulen**, die mit begrenztem Budget arbeiten, und fuer **Organisationen** mit strengen Datenschutz-Anforderungen

Unsere Schemas funktionieren lokal genauso wie in der Cloud. Das ist das Prinzip der offenen Protokolle: Die Daten und die Aufbereitung sind getrennt vom Betriebsmodell. Wer lokal arbeiten will, kann das tun — ohne Einschraenkungen.

## Beispiel: Multi-Source Datenintegration

Eine praktische Integration kombiniert mehrere FlowMCP-Schemas ueber einen einzigen MCP-Server.
Beispielsweise koennte ein Reiseplanungssystem Fahrplan-, Wetter- und Standort-Schemas laden —
und so jedem verbundenen KI-Client Zugriff auf alle drei Datenquellen ueber einen Endpunkt geben.

Das gleiche Muster funktioniert fuer jede Domaene: Umweltmonitoring, oeffentliche Verwaltung,
Finanzdaten oder jede andere Kombination strukturierter Datenquellen.

## Pilot-Programm

Parallel zur technischen Integration suchen wir **Datenpartner**, die gemeinsam mit uns KI-Anbindungen fuer oeffentliche Daten entwickeln. Wir suchen nicht nach Geld oder Arbeitszeit — wir suchen nach Datenquellen und der Bereitschaft, eine fertige Anbindung zu pruefen.

**[Team kennenlernen →](/de/roadmap/team/)**

## Naechste Schritte

Diese Phase ist in Vorbereitung. Konkret arbeiten wir an:

1. **Validierung** bestehender Schemas mit echten Datenpartnern — funktionieren sie im Alltag?
2. **Optimierung** basierend auf praktischer Nutzung — bessere Antwortqualitaet, bessere Fehlerbehandlung
3. **OpenClaw-Integration** — das Plugin, das Schemas als Tools verfuegbar macht
4. **Lokaler Betrieb** — Tests mit llama.cpp auf Raspberry Pi

Mehr zum Zeitplan: [Roadmap](/de/roadmap/overview/)
