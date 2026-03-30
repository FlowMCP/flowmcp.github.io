---
title: Ueber das Projekt
description: Was FlowMCP ist, wie es funktioniert und fuer wen es gedacht ist.
---

## Das Problem

Offene Daten gibt es in Deutschland und Europa in grosser Menge — Fahrplaene, Wetterdaten, Verwaltungsdaten, Geodaten, Umweltdaten. Aber sie sind verstreut ueber hunderte Portale und Schnittstellen, in verschiedenen Formaten, mit unterschiedlicher Qualitaet und hinter unterschiedlichen Zugaengen.

Fuer einen Menschen ist es aufwaendig, die richtigen Daten zu finden und zu nutzen. Fuer eine KI ist es fast unmoeglich — ohne vorherige Aufbereitung.

## Unsere Loesung

Wir machen offene Daten ueber ein Schema-System nutzbar fuer KI-Agenten. Jedes Schema beschreibt, wie eine Datenquelle angesprochen wird — und bringt sie auf einen gemeinsamen Standard.

![Datenquellen werden normalisiert](../../../../assets/diagram-1-data-normalization.png)

**Dabei veraendern wir die Datenquellen nicht.** Wir passen uns an sie an. Das Schema uebersetzt zwischen der Datenquelle und dem Agenten.

## Das Ziel

> **Bau deinen eigenen Agenten in 5 Minuten.**

Wir stellen validierte Schemas bereit. Du kombinierst sie zu einem Agenten, der deine Fragen mit echten Daten beantwortet. Open Source, selbst betreibbar, fuer alle zugaenglich.

Das ist unsere Challenge — und wir arbeiten daran, sie Realitaet werden zu lassen. Unsere Schemas legen die Grundlage. Die KI kann sie anpassen und der Nutzer kann sie fuer seine Beduerfnisse weiterentwickeln.

## Fuer wen?

| Zielgruppe | Beschreibung |
|------------|-------------|
| **Privatpersonen** | Entscheidungshilfe mit echten Daten — z.B. Reiseplanung, Wetter, lokale Informationen |
| **Behoerden und Verwaltung** | Ein Ausgangspunkt, um offene Daten strukturiert bereitzustellen — kein fertiges Produkt, sondern eine Basis zum Weiterentwickeln |
| **Entwickler** | Eigene Agenten bauen, Schemas anpassen, zum Oekosystem beitragen |

## Warum Schemas?

Eine KI ohne Vorwissen muesste jede Datenquelle von Grund auf analysieren — ein enormer Token-Verbrauch und Energieaufwand bei jedem Aufruf. Unsere Schema-Aufbereitung ist eine **einmalige Investition**: einmal beschrieben, fuer jede KI nutzbar. Das spart Energie und Kosten — um den **Faktor 10**.

Mehr dazu und zu unseren Ueberzeugungen: [Warum wir das machen →](/de/introduction/why/)

## Ein schnell wachsender Markt

KI-Agenten entwickeln sich rasant. [OpenClaw](https://docs.openclaw.ai) — ein Open-Source AI Assistant Gateway — existiert erst seit November 2025 und hat bereits ueber 330.000 GitHub-Sterne erreicht. Damit hat es das Linux-Betriebssystem (225.000 Sterne) in weniger als vier Monaten ueberholt und ist das schnellstwachsende Software-Projekt auf GitHub.

Die Industrie arbeitet daran, Sicherheitsrichtlinien einzuziehen, damit auch Firmen und Behoerden mit KI-Agenten arbeiten koennen. Unser Beitrag: Die Datensaetze aufbereiten und vorbereiten, sodass KI-Agenten sie nutzen koennen.

## Technische Offenheit

Unsere Software ist **model-agnostisch**: Sie laeuft mit jedem LLM. Wir optimieren die Agents auf ein Modell (eine notwendige Entscheidung fuer die bestmoegliche Qualitaet), aber der Betrieb auf anderen Modellen ist problemlos moeglich.

Sie ist auch **client-agnostisch**: Jeder MCP-kompatible Client oder CLI kann unsere Schemas nutzen — du hast freie Wahl. Mehr dazu unter [MCP-Clients & CLI](/de/basics/clients/).

## Woher kommt das?

FlowMCP entstand aus der Idee, oeffentliche Datenquellen fuer KI-Agenten zugaenglich zu machen. Heute bietet es ein vollstaendiges Framework — von der Schema-Definition bis zur Agent-Integration. Mehr dazu unter [Schemas und Tools](/de/basics/schemas-and-tools/)
