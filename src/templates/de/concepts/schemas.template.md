---
title: Schemas
description: Was ein FlowMCP-Schema ist, wie es aufgebaut ist und wie das Schema-Inventar funktioniert.
---
<!-- PAGEFIND-META-START -->
<span style="display:none" data-pagefind-meta="section">Concepts</span>
<!-- PAGEFIND-META-END -->

## Was ist ein Schema?

Ein Schema ist der vollstaendige Bauplan fuer den Zugriff auf einen einzelnen Datenanbieter — zum Beispiel den Deutschen Wetterdienst, die Deutsche Bahn oder ein Sharing-System wie nextbike. Ein Schema pro Anbieter, mehrere Tools pro Schema. Das Schema uebersetzt zwischen der API des Anbieters und dem KI-Agenten, sodass der Agent die Daten strukturiert abfragen kann, ohne die API-Dokumentation selbst lesen zu muessen.

![Provider-Schema Aufbau: Tools, Resources, Prompts, Skills](/images/provider-schema-aufbau.png)

Ein Schema buendelt vier Primitive — Tools, Resources, Prompts, Skills. Nur Tools sind verpflichtend; die anderen drei sind optional und kommen bei komplexeren Datenquellen ins Spiel. Die vier Primitive werden auf der Seite [Primitive](/de/concepts/primitives/) erklaert.

## Schema-Format

Ein Schema ist eine einzelne `.mjs`-Datei. Es deklariert seine Tools, Resources, Prompts und Skills in einem statischen `main`-Export. Ein optionaler `handlers`-Export ergaenzt Response-Transformationen. Top-Level-Felder wie `requiredServerParams` (umgebungsgebundene Werte, z.B. API-Keys), `requiredLibraries` (npm-Pakete, die zur Laufzeit geladen werden) und `sharedLists` (wiederverwendbare Referenzdaten) stehen neben `main`.

Die vollstaendige Felddefinition steht in der Spezifikation: [FlowMCP Spec v4.1.0 — Schema Format](/specification/schema-format/). Die Spezifikation dokumentiert auch die Validierungsregeln und das Schema-ID-Format. Diese Seite bleibt bewusst auf der Konzept-Ebene.

## Inventar

Schemas sind in Provider-Namespaces im oeffentlichen Schema-Repository organisiert.

- {{stats.count_schemas}} Production-Schemas ueber Kategorien wie Blockchain EVM, Blockchain Solana, DeFi, Crypto Data, Government DE/EU, Weather & Geo, Web3 Social, News & Media, Dev Tools und NFT & Identity
- {{stats.count_tools}} einzelne Tools, die ueber diese Schemas bereitgestellt werden
- Dynamische Quelle: [github.com/FlowMCP/flowmcp-schemas-public](https://github.com/FlowMCP/flowmcp-schemas-public), `meta.stats`-Feld pro Schema

Live-Discovery via CLI: `flowmcp search <provider>` listet Schemas, `flowmcp add <namespace>` aktiviert sie lokal.

## Lifecycle

Ein neues Schema startet als Entwurf in `tests/new-schemas/PROVIDER/`. Der Autor validiert die Struktur mit `flowmcp validate <pfad>`, faehrt die Live-API-Tests mit `flowmcp test single <pfad>` und — wenn alle Routen passieren — verschiebt die Datei nach `schemas/v4.1.0/PROVIDER/` zum Release. Ab diesem Punkt ist das Schema Teil des globalen Inventars und ueber die CLI oder programmatisch ueber die Core-API erreichbar. Updates folgen derselben Schleife: edit, validate, test, release.

Anleitungen pro Schritt liegen im [Schema Creation Guide](/guides/schema-creation/) und in der Spezifikation: [FlowMCP Spec v4.1.0 — Schema Lifecycle](/specification/schema-lifecycle/).
