---
title: "SQLite — Ein Speicher für lokale, große und private Daten"
description: "Nicht jeder Datensatz gehört hinter eine Live-API. FlowMCP hat drei Wege, Daten lokal zu verankern — Preload, Shared Lists und SQLite-Resources — und eine klare Regel, wann welcher."
date: 2026-06-01
author: "FlowMCP Team"
tags: ["data-formats", "sqlite", "resources"]
lang: de
---

> 2026-06-01 · FlowMCP Team · #data-formats #sqlite #resources

Ein Tool, das eine Live-API aufruft, ist der naheliegende Baustein — aber nicht immer der richtige. Manche Daten ändern sich kaum. Manche sind zu groß, um sie bei jedem Aufruf zu holen. Manche sind privat und sollten die Maschine nie verlassen. Dafür hat FlowMCP drei lokale Mechanismen. Dieser Beitrag erklärt, wofür jeder gedacht ist — und geht dann beim mächtigsten in die Tiefe: den **SQLite-Resources**.

## Drei Wege, Daten zu verankern

| Mechanismus | Was es ist | Greif dazu, wenn… |
|-------------|-----------|-------------------|
| **Preload** | Ein optionaler `preload`-Block an einer Route (`enabled`, `ttl`). Die Runtime cacht die API-Antwort lokal im Speicher für die Time-to-live. | Die Daten kommen aus einer API, ändern sich aber langsam und sind teuer nachzuladen — ein paar hundert KB bis wenige MB, die du nicht bei jedem Aufruf ziehen willst. |
| **Shared Lists** | Versionierte, zentral gepflegte Wert-Sets, per Name referenziert und pro Schema gefiltert. | Du brauchst kleine, kanonische Wert-Sets über viele Schemas hinweg — EVM-Chain-IDs, Fiat-Codes, Ländercodes. Eine Quelle der Wahrheit statt duplizierter Inline-Listen. |
| **SQLite-Resources** | Eine lokale SQLite-Datenbank, als MCP-Resource bereitgestellt (`main.resources`). | Die Daten sind groß, oder statische Referenzdaten, oder privat, oder vom Agenten selbst erzeugt. |

Die ersten beiden drehen sich um *leichte* Daten. SQLite dreht sich um *schwere* und *lokale* Daten.

## SQLite: ein sperriges Format in abfragbare Tabellen verwandeln

Das stärkste Argument für SQLite ist die Konvertierung. Viele Datensätze kommen in Formaten, die direkt mühsam abzufragen sind — ein ZIP aus dutzenden CSVs, ein wuchernder XML-Dump, ein eigenes Binärformat. So ein Format **einmal** nach SQLite zu konvertieren, macht daraus gewöhnliche Tabellen, die du per SQL abfragen kannst, mit Indizes, ohne die Quelle bei jedem Zugriff neu zu parsen. GTFS-Fahrplandaten sind genau diese Geschichte: das [`geo-gtfs-toolkit`](/de/blog/2026-05-flowmcp-v41-gtfs-add-on/) konvertiert einen Feed in eine versiegelte SQLite-Datenbank, die ein Schema einfach referenziert.

### Zwei Modi

SQLite-Resources gibt es in zwei Modi, und der Unterschied ist der ganze Punkt:

| Modus | Geöffnet als | Erlaubt | Anwendungsfall |
|-------|--------------|---------|----------------|
| **in-memory** | `better-sqlite3` mit `readonly: true` | **Nur SELECT** — die Datei auf der Platte wird nie verändert | Referenzdaten, Lookups, Open Data |
| **file-based** | WAL-Modus, schreibbar | Alle SQL-Statements; Änderungen bleiben erhalten; vor dem ersten Write wird ein `.bak` angelegt | Agent-erzeugte Daten: Analyse-Ergebnisse, gesammelte Metriken |

### Read vs. Write: sicher per Design

Hier kommt der Teil, der für Sicherheit zählt. Im **in-memory**-Modus kann eine KI SQL-Queries selbst schreiben und ausführen — aber nur Lesezugriffe kommen durch, und diese Garantie hält auf **zwei unabhängigen Schichten**:

1. **Treiber-Ebene.** Die Datenbank wird mit `better-sqlite3` und dem Flag `readonly: true` geöffnet. Der Treiber selbst verweigert jeden Schreibzugriff.
2. **Modul-Ebene.** Bevor eine Query läuft, prüft die Runtime, dass das Statement mit `SELECT` oder `WITH` beginnt. Write-Keywords — `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `ALTER`, `DROP`, `REPLACE`, `TRUNCATE` — werden zurückgewiesen mit *„Only SELECT statements are allowed in in-memory mode."*

Die KI bekommt also volle Freiheit, einen Datensatz zu erkunden und abzufragen, und null Möglichkeit, ihn zu verändern. Schreiben ist dem expliziten file-based-Modus vorbehalten, den nur Schemas mit `origin: 'project'` nutzen dürfen. Die Trennung ist Absicht: komplett read-only und sicher, oder komplett auf der Platte und frei — nie ein uneindeutiger Mittelweg.

### Die Default-Methoden

Jede SQLite-Resource bekommt zwei Methoden automatisch von der Runtime injiziert, sodass der KI das Tabellen-Layout nie vorab gesagt werden muss:

| Methode | Was sie tut |
|---------|-------------|
| **`describeTables`** | Liefert die Tabellen und ihre Spalten — die KI inspiziert die Struktur, bevor sie abfragt. |
| **`runSql`** | Führt eine Query aus, die die KI selbst formuliert. Im **in-memory**-Modus: nur SELECT. Im **file-based**-Modus: alle Statements. |

Ein Schema-Autor kann darüber hinaus bis zu sieben weitere benannte Queries ergänzen, aber in der Praxis lassen `describeTables` + `runSql` einen Assistenten eine unbekannte Datenbank schon selbstständig erkunden und Fragen dazu beantworten.

## Die Wahl treffen

- **Live, häufig wechselnde Daten** → ein normales Tool (ein API-Aufruf).
- **Langsam wechselnde API-Daten, die du nicht ständig neu holen willst** → **Preload** an der Route ergänzen.
- **Kleine kanonische Listen über Schemas hinweg** → eine **Shared List**.
- **Große statische Referenzdaten, oder private Daten, oder alles, was du sonst jedes Mal neu parsen würdest** → eine **SQLite-Resource** (in-memory, read-only).
- **Daten, die der Agent erzeugt und behalten muss** → eine **SQLite-Resource** (file-based, schreibbar).

Der rote Faden: Schemas dünn halten und Daten dort lassen, wo sie hingehören. Preload und Shared Lists decken die leichten Fälle; SQLite die schweren und die privaten — mit einer Read/Write-Grenze, die die Runtime für dich durchsetzt.

---

> 📖 Lies auch:
> - *[FlowMCP v4.1 — GTFS als erste Datenklasse mit eigenem Add-on](/de/blog/2026-05-flowmcp-v41-gtfs-add-on/)* — SQLite-Resources in Aktion an einem echten, schweren Datensatz.
> - *[OParl — Ein Schema für Deutschlands Ratsinformationssysteme](/de/blog/2026-06-oparl-council-data/)* — das Leicht-API-Gegenstück, wo Preload (nicht SQLite) das richtige Werkzeug ist.
