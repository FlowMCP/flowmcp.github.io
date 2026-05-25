---
title: Schemas & Quellen
description: Die drei Schichten von FlowMCP — Engine, Schemas und Datenbetreiber — und warum FlowMCP Schemas weder publiziert noch anzeigt.
---
<!-- PAGEFIND-META-START -->
<span style="display:none" data-pagefind-meta="section">About</span>
<!-- PAGEFIND-META-END -->

FlowMCP besteht aus drei Schichten, die leicht zu verwechseln sind, aber strikt getrennt bleiben. Sie auseinanderzuhalten ist der Schluessel zum Verstaendnis, wofuer FlowMCP verantwortlich ist und wofuer nicht.

## Engine, Schemas und Datenbetreiber

Die **Engine** ist der Teil, den FlowMCP baut und pflegt. Sie ist die Core-Bibliothek und die CLI, die ein Schema laden, die Anfrage signieren, die Quelle aufrufen und die Antwort normalisieren. Die Engine ist MIT-lizenziert, Open Source, und derselbe Audit deckt jeden Call ab, der durch sie laeuft.

Ein **Schema** ist eine duenne Deklaration, die der Engine sagt, wie sie eine Datenquelle erreicht und wie sie deren Antwort formt. Schemas sind Community-Beitraege: jede:r kann eines fuer eine API oder einen Datensatz schreiben. Sie sind nicht Teil der Engine, und ein Schema kann hinzugefuegt, ersetzt oder entfernt werden, ohne die Engine anzufassen.

Ein **Datenbetreiber** ist, wer die API betreibt oder den Datensatz hinter einem Schema publiziert. Er entscheidet ueber seine eigenen Terms of Service, die Daten-Lizenz und die Rate-Limits. FlowMCP hat keine Kontrolle ueber diese Schicht — es reicht den Call nur durch und gibt die Antwort zurueck.

Diese drei Schichten verschmelzen nie. Die Engine bewegt Daten, Schemas beschreiben Quellen, und Betreiber besitzen die Daten. Sie zu verwechseln ist die haeufigste Quelle von Missverstaendnissen darueber, was FlowMCP tut.

## Was FlowMCP nicht tut

FlowMCP **publiziert keine Schemas und zeigt keine Schemas auf dieser Website.** Es gibt hier keine Katalog-Seite, keinen Schema-Browser und keine gehostete Liste von Quellen. Schemas liegen in eigenen Repositories und werden von der CLI bei Bedarf geladen; die Website erklaert die Engine und das Modell, nicht die einzelnen Schemas.

Weil die Datenbetreiber die Quelle und ihre Bedingungen besitzen, faellt FlowMCP auch kein Urteil darueber. Wir halten einige neutrale Fakten fest, sofern ein Provider sie publiziert — die Terms-of-Service-URL (`meta.termsOfService`), das Datum der letzten Pruefung (`meta.termsOfServiceCheckedAt`) und den Daten-Lizenznamen, sofern einer genannt ist (`meta.dataLicenseName`) — und verlinken auf das Original. Wir klassifizieren diese Bedingungen nicht, interpretieren sie nicht und beraten nicht zur kommerziellen Nutzung. Die Pruefung der Terms of Service, Rate-Limits und Daten-Lizenz eines Providers, bevor du dich auf eine Quelle verlaesst, bleibt deine Verantwortung, und FlowMCP gibt keine Gewaehrleistung fuer Eignung zu irgendeinem Zweck.

## Siehe auch

- [Spezifikation: License & ToS (spec/v4.1.0/23-license-and-tos.md)](https://github.com/FlowMCP/flowmcp-spec/blob/main/spec/v4.1.0/23-license-and-tos.md)
- [DISCLAIMER.md in flowmcp-core](https://github.com/FlowMCP/flowmcp-core/blob/main/DISCLAIMER.md)
- [DISCLAIMER.md in flowmcp-cli](https://github.com/FlowMCP/flowmcp-cli/blob/main/DISCLAIMER.md)
