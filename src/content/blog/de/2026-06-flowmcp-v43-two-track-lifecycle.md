---
title: "FlowMCP v4.3 — Zwei Spuren: Entwicklung und Grading-Monitoring"
description: "FlowMCP Spec v4.3 teilt den Schema-Lebenszyklus in zwei Spuren und richtet das Grading auf die breaking Grading-Spec 3.0.0 aus, bei der ein fehlgeschlagener Pretest jetzt einen blockierten Eintrag erzeugt statt abzubrechen — dazu eine schlankere CLI, ein einziger Grading-Pfad und vier Geodaten-Add-ons."
date: 2026-06-02
author: "FlowMCP Team"
tags: ["release", "v43", "grading", "lifecycle", "spec"]
lang: de
---

> 2026-06-02 · FlowMCP Team · #release #v43 #grading

Ein Lebenszyklus funktioniert am besten, wenn jeder Teil seine eigene Aufgabe erledigen darf. Bislang behandelte FlowMCP das *Bauen* eines Schemas und das *Benoten* als ein einziges sequenzielles Tor: erst validieren, dann benoten, in einer geraden Linie. Mit **v4.3** wird diese Linie zweigeteilt. Der Kern dieses Releases ist die **Aufteilung des Lebenszyklus in zwei Spuren** und die Ausrichtung auf eine neue, breaking **Grading-Spec 3.0.0**. Das Schema-*Format* selbst ändert sich nicht.

## Warum den Lebenszyklus aufteilen

Der Entwicklungs-Lebenszyklus und die Grading-Monitoring-Spur beantworten unterschiedliche Fragen. Die eine fragt: *Ist dieses Schema korrekt genug zum Ausliefern?* Die andere fragt: *Wie ist der Zustand jedes Schemas, das wir beobachten — auch der noch kaputten?* Beide durch dasselbe Tor zu zwingen bedeutete, dass ein Schema, das die Validierung nicht bestand, schlicht nichts erzeugte — keinen Eintrag, kein Signal, keinen Ort, an dem man es verfolgen konnte. Genau die Information, die für das Monitoring am wichtigsten war, ging verloren.

v4.3 trennt beide, damit jede ehrlich sein kann. Der **Entwicklungs-Lebenszyklus** — die sechs Stufen von der Recherche bis zur Produktion — bleibt in der Schemas-Spec. **Monitoring, Issue-Tracking und das Grade-Rollup** wandern in die Grading-Spec, in eine neue `§26 monitoring-track`.

## Emit-on-failure: ein fehlgeschlagener Pretest bricht nicht mehr ab

Die konkreteste Änderung steckt im Grading-Vertrag. Die Grading-Delegation zielt jetzt auf **`gradingSpec/3.0.0`** (vorher `2.0.0`), und das Verhalten des deterministischen Pretests kippt:

- **Vorher:** Ein Schema, das die Validierung nicht bestanden hatte, führte zum **harten Abbruch** des Gradings. Es kam kein Eintrag heraus.
- **Jetzt:** Der deterministische Pretest erzeugt einen **`blocked`-Knoten** mit `reason: validation-failed` und fährt fort. Das Schema, das die Validierung nicht bestanden hat, erzeugt trotzdem einen Monitoring-Eintrag — er ist lediglich als blockiert markiert.

Deshalb ist der Grading-Bump **MAJOR**: Der Vertrag hat sich auf eine nicht abwärtskompatible Weise geändert. Das alte Verzeichnis `grading/2.0.0/` bleibt unverändert erhalten, für alles, was noch darauf festgelegt ist.

### Emit-on-failure in der Praxis

```bash
# Ein Schema, das die Validierung nicht bestanden hat, erzeugt weiterhin einen Monitoring-Eintrag:
flowmcp grading deterministic myprovider/broken-schema
# → erzeugt einen `blocked`-Knoten (reason: validation-failed) statt abzubrechen
```

Vor v4.3 hätte derselbe Lauf hart abgebrochen, ohne etwas zum Verfolgen. Jetzt ist das kaputte Schema in der Monitoring-Spur als `blocked`-Eintrag sichtbar — ohne je näher an die Produktion zu rücken.

## Das Entwicklungs-Tor bleibt unverändert

Das gehört klar gesagt: **Emit-on-failure senkt die Latte fürs Ausliefern nicht.** Ein `blocked`-Monitoring-Eintrag bringt ein Schema **nicht** näher an die Produktion. Das Entwicklungs-Tor bleibt genau wie zuvor — `flowmcp validate` muss **0 Fehler** liefern, bevor ein Schema `stage:production` erreicht. Die Lockerung gilt nur für die Monitoring-Spur, in der ein Eintrag jetzt im Zustand `blocked` für ein Schema existieren darf, das `stage:validation` noch nicht passiert hat. Das Bauen verlangt weiterhin eine saubere Validierung; verbessert hat sich nur die *Sichtbarkeit* von Fehlern.

## Eine neue Invariante: VAL019

v4.3 fügt außerdem eine neue Validierungsregel hinzu, **VAL019** — eine Ordner↔Namespace-Invariante. Ein Verzeichnisname `providers/<dir>/` **MUSS** dem `main.namespace` jedes Schemas entsprechen, das er enthält. Sie steht neben den bestehenden Prüfungen `CAT002` / `AGT001` / `SKL003` und kommt mit einem Fallback für nicht parsbare Ordner sowie einem Rename-on-parse-Lebenszyklus. Kleine Regel, echter Nutzen: Das Ordner-Layout kann nicht mehr von dem abdriften, was die enthaltenen Schemas deklarieren.

## Jenseits der Spec — das v4.3-Ökosystem

Die Spec-Aufteilung kam zusammen mit einer Runde von Ökosystem-Änderungen, die die Zwei-Spuren-Idee im Alltag praktikabel machen:

- **Eine schlankere CLI (Memo 099).** Der Aktivierungsschritt ist weg — die alten Befehle `add` / `import` / `group` gibt es nicht mehr. Jedes Schema in einem konfigurierten `schemaFolders[]`-Verzeichnis ist sofort aufrufbar, der Workflow ist also nur `flowmcp search <query>` (oder `flowmcp list`) → `flowmcp call <tool> '{...}'`. Ein Tool, dem der API-Key fehlt, erscheint als `[disabled: missing KEY]`, statt still zu scheitern.
- **Ein einziger Grading-Pfad (Memo 102).** Das Grading ist auf einen Pfad zusammengefallen: `flowmcp grading deterministic <id>` führt die strukturelle Validierung plus den Live-Daten-Pretest aus (HTTP 200 **und** nicht-leere Daten), und `flowmcp grading non-deterministic <ns>` treibt das LLM-Scoring. Es gibt keinen separaten Import-Schritt — Schemas werden live aus `schemaFolders[]` gelesen, und die Workbench-Island ist rein der Output-Store.
- **Vier Geodaten-Add-ons.** Das v4.3-FlowMCP liefert vier externe Toolkit-Add-ons, jedes ein eigenes Repository, keines in `flowmcp-core` eingebaut:
  - `geo-gtfs-toolkit` — GTFS-Transit-Feeds als versiegelte lokale SQLite-Datenbank.
  - `geo-geojson-toolkit` und `geo-csv-tsv-toolkit` — laden eine vollständige GeoJSON- oder CSV/TSV-Datei per URL, validieren sie beim Laden und fragen sie aus dem Speicher ab (keine SQLite-Datei, kein Qualitätssiegel).
  - `geo-overpass-toolkit` — führt Live-Overpass-Abfragen (OpenStreetMap) hinter einer gecachten HTTP-Quelle aus.

  Jedes Add-on benennt sein Paket `geo-*-toolkit`; die GitHub-Repositories behalten ihre ursprünglichen Namen (zum Beispiel `github:FlowMCP/geo-geojson-toolkit`).

## Wo man es liest

Der Zwei-Spuren-Lebenszyklus ist in der Schemas-Spec unter **`21-schema-lifecycle.md`** dokumentiert, und die Monitoring-Spur, die nun das Grade-Rollup besitzt, liegt in der **[Grading-Spec v3.0.0](/grading/overview/)**, `§26`. Zwei Spuren, zwei Specs — jede frei, ihre eigene Aufgabe zu erledigen.
