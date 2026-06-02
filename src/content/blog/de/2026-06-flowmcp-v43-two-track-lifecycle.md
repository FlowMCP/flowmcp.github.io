---
title: "FlowMCP v4.3 — Zwei Spuren: Entwicklung und Grading-Monitoring"
description: "FlowMCP Spec v4.3 teilt den Schema-Lebenszyklus in zwei Spuren und richtet das Grading auf die breaking Grading-Spec 3.0.0 aus, bei der ein fehlgeschlagener Import jetzt einen blockierten Eintrag erzeugt statt abzubrechen."
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

## Emit-on-failure: der Grading-Import bricht nicht mehr ab

Die konkreteste Änderung steckt im Grading-Import-Vertrag. Die Grading-Delegation zielt jetzt auf **`gradingSpec/3.0.0`** (vorher `2.0.0`), und das Import-Verhalten kippt:

- **Vorher:** Ein Schema, das die Validierung nicht bestanden hatte, führte zum **harten Abbruch** des Grading-Imports. Es kam kein Eintrag heraus.
- **Jetzt:** Der Import erzeugt einen **`blocked`-Knoten** mit `reason: validation-failed` und fährt fort. Das Schema, das die Validierung nicht bestanden hat, erzeugt trotzdem einen Monitoring-Eintrag — er ist lediglich als blockiert markiert.

Deshalb ist der Grading-Bump **MAJOR**: Der Import-Vertrag hat sich auf eine nicht abwärtskompatible Weise geändert. Das alte Verzeichnis `grading/2.0.0/` bleibt unverändert erhalten, für alles, was noch darauf festgelegt ist.

## Das Entwicklungs-Tor bleibt unverändert

Das gehört klar gesagt: **Emit-on-failure senkt die Latte fürs Ausliefern nicht.** Ein `blocked`-Monitoring-Eintrag bringt ein Schema **nicht** näher an die Produktion. Das Entwicklungs-Tor bleibt genau wie zuvor — `flowmcp validate` muss **0 Fehler** liefern, bevor ein Schema `stage:production` erreicht. Die Lockerung gilt nur für die Monitoring-Spur, in der ein Eintrag jetzt im Zustand `blocked` für ein Schema existieren darf, das `stage:validation` noch nicht passiert hat. Das Bauen verlangt weiterhin eine saubere Validierung; verbessert hat sich nur die *Sichtbarkeit* von Fehlern.

## Eine neue Invariante: VAL019

v4.3 fügt außerdem eine neue Validierungsregel hinzu, **VAL019** — eine Ordner↔Namespace-Invariante. Ein Verzeichnisname `providers/<dir>/` **MUSS** dem `main.namespace` jedes Schemas entsprechen, das er enthält. Sie steht neben den bestehenden Prüfungen `CAT002` / `AGT001` / `SKL003` und kommt mit einem Fallback für nicht parsbare Ordner sowie einem Rename-on-parse-Lebenszyklus. Kleine Regel, echter Nutzen: Das Ordner-Layout kann nicht mehr von dem abdriften, was die enthaltenen Schemas deklarieren.

## Was ist neu

- **Zwei-Spuren-Aufteilung** — die sechs Entwicklungsstufen bleiben in der Schemas-Spec; Monitoring, Issue-Tracking und das Grade-Rollup wandern in die Grading-Spec (`§26 monitoring-track`).
- **Grading-Delegation zielt auf `gradingSpec/3.0.0`** — ein breaking Grading-Release.
- **Emit-on-failure** — der Grading-Import erzeugt einen `blocked`-Knoten (`reason: validation-failed`) statt abzubrechen.
- **Entwicklungs-Tor unverändert** — `flowmcp validate` → 0 Fehler bleibt vor der Produktion Pflicht.
- **VAL019** — neue Ordner↔Namespace-Invariante, Geschwister von `CAT002` / `AGT001` / `SKL003`.

Begleitend zur Spec-Arbeit liefert v4.3 außerdem zwei neue Datenformat-Add-ons — `geojson-sqlite-toolkit` und `csv-tsv-sqlite-toolkit` — um gängige Datendateien in versiegelte lokale SQLite-Ressourcen zu verwandeln.

## Wo man es liest

Der Zwei-Spuren-Lebenszyklus ist in der Schemas-Spec unter **`21-schema-lifecycle.md`** dokumentiert, und die Monitoring-Spur, die nun das Grade-Rollup besitzt, liegt in der **[Grading-Spec v3.0.0](/grading/overview/)**, `§26`. Zwei Spuren, zwei Specs — jede frei, ihre eigene Aufgabe zu erledigen.
