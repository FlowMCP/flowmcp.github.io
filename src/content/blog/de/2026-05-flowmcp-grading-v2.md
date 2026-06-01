---
title: "FlowMCP Spec v4.2 — Grading als versionierter Standard"
description: "FlowMCP Spec v4.2 delegiert die Schema-Bewertung an einen eigenen, unabhaengig versionierten Standard — die Grading-Spec v2.0, veroeffentlicht als eigener Doku-Bereich, damit Dritte nach denselben Regeln graden koennen."
date: 2026-05-31
author: "FlowMCP Team"
tags: ["release", "grading", "spec", "standard", "v2"]
featured: true
lang: de
---

Ein Schema ist nur so nuetzlich, wie es klar ist. FlowMCP hat Schemas schon immer benotet — aber bislang lebten die Regeln *wie* ein Schema bewertet und benotet wird als internes Protokoll. Mit diesem Release wird das Grading zu einem **veroeffentlichten, eigenstaendig versionierten Standard**: der **Grading-Spec v2.0**.

## Warum das zaehlt: ein Netzwerk aus Gradings

Der Sinn eines schriftlichen, versionierten Grading-Standards ist nicht die Note selbst. Es ist die **Reproduzierbarkeit ueber Personen hinweg**. Wenn die Regeln — die elf Bereiche, das Fuenf-Status-Modell, die Schwellenwerte, die Veto-Liste — oeffentlich und versioniert sind, kann eine zweite Person dasselbe Schema graden und zu einem vergleichbaren Ergebnis kommen. Andere Mitarbeiter und externe Contributors koennen nach *demselben* Standard graden.

Das ist die Vorarbeit fuer ein **Contributor-Netzwerk**: nicht ein einzelnes Team, das Noten von oben vergibt, sondern ein offener Standard, den viele anwenden — und der so eine gemeinsame, vergleichbare Sammlung von Gradings erzeugt. Grading hoert auf, ein internes Werkzeug zu sein, und wird etwas, an dem sich Dritte beteiligen koennen.

## FlowMCP delegiert — es vereinnahmt nicht

Die FlowMCP Schemas-Spec (jetzt **v4.2**) bleibt die hoechste Instanz — sie definiert, was ein Schema, eine Selection und die Primitive sind. Neu in 4.2 ist eine saubere **Delegation**: FlowMCP gibt das Grading-Modell an einen ausgelagerten, unabhaengig versionierten Standard ab und verweist darauf. Beide Specs haben getrennte Versionsnummern, sind aber verbunden — die Schemas-Spec besitzt den Upstream-Scoring-Transport, die Grading-Spec besitzt das Grading-Modell darauf.

## Was ist neu

- **v2, ehrlich nummeriert.** Die fruehere `1.0`/`1.1`-Linie war ein kurzlebiges Experiment. Der jetzige Bruch ist echt, also wird er als **2.0.0** veroeffentlicht statt unter einer irrefuehrenden Minor-Nummer.
- **Elf Grading-Bereiche** mit Fuenf-Status-Modell und abgeleitetem Rollup.
- **Die Delegation ist der Kern des 4.2-Bumps** — FlowMCP delegiert das Grading an einen eigenen, versionierten Nebenstandard.
- **Eigener Doku-Bereich** — Grading ist Navigationspunkt 5, mit eigenem Versions-Badge (v2.0), getrennt vom Spezifikations-Badge.
- **CLI-Grading ist experimentell** — heute schon nutzbar ueber den `grading`-Befehlsbereich, die Oberflaeche kann sich aber noch aendern.
- **Periphere Module ziehen nach** — die Grading-Referenzimplementierung wird ein reines Code-Repository; die einzige Quelle der Wahrheit fuer den Standard ist die Spec.

## Wo man es liest

Der Grading-Standard liegt unter **[/grading/](/grading/overview/)** — ein eigener Bereich in der Doku, unabhaengig von der Schemas-Spec versioniert. Die Referenzimplementierung ist das Repository `flowmcp-grading` (nur Code); der Standard selbst ist die Spec.

Das ist ein erster Schritt. Der Standard ist aufgeschrieben, versioniert und veroeffentlicht — damit die naechsten Gradings, woher auch immer sie kommen, dieselbe Sprache sprechen.
