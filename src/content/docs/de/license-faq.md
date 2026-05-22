---
title: Lizenz & AGB FAQ
description: Wie FlowMCP mit Lizenzierung, API Terms of Services und Daten-Lizenzen ueber drei Schichten umgeht.
---

FlowMCP arbeitet in einem dreischichtigen Lizenzmodell. Das Verstaendnis aller drei Schichten ist Pflicht, bevor FlowMCP in Produktion oder im kommerziellen Kontext eingesetzt wird.

## Die drei Schichten

| Schicht | Was | Wer entscheidet | Was FlowMCP tut |
|-------|------|-------------|---------------------|
| **1. FlowMCP Schema Code** | Schema-Definitionen (`.mjs`), Core-Bibliothek, CLI | FlowMCP (wir) | **MIT-lizenziert** |
| **2. API Provider ToS** | Was mit der aufgerufenen API erlaubt ist | API Provider | **Nur Verlinkung — keine Klassifikation** |
| **3. Data License** | Was mit den zurueckgegebenen Daten erlaubt ist | Daten-Publisher | **Nur Verlinkung — keine Klassifikation** |

## Was wir tun

- Wir dokumentieren die ToS-URL sofern verfuegbar (`meta.termsOfService` pro Schema)
- Wir dokumentieren das Datum der letzten Pruefung (`meta.termsOfServiceCheckedAt`)
- Wir dokumentieren die Sprache des ToS-Dokuments (`meta.termsOfServiceLanguage`)
- Wir spiegeln den Daten-Lizenznamen, sofern der Provider ihn explizit publiziert (`meta.dataLicenseName`)

## Was wir NICHT tun

- Wir klassifizieren Terms of Services **nicht** in rechtliche Kategorien
- Wir geben **keine** Empfehlungen zur kommerziellen Nutzung
- Wir reproduzieren **keine** ToS-Inhalte in unseren Schemas
- Wir leisten **keine** Rechtsberatung

## Warum wir nicht klassifizieren

Terms of Services sind lebende Dokumente — sie aendern sich ohne Vorwarnung. Eine Klassifikation erfordert juristische Expertise, die wir nicht haben, und unsere Jurisdiktion ist begrenzt. Compliance ist deine Verantwortung.

## Wie pruefe ich die Terms of Services einer API?

1. Schema-Datei oeffnen — `meta.termsOfService` enthaelt die URL (oder `null` wenn unbekannt)
2. URL aufrufen — Hinweis: sie kann sich seit `termsOfServiceCheckedAt` geaendert haben
3. Pruefen auf:
   - Free vs. kommerzieller Tier
   - Attributionspflichten
   - LLM-Training-Beschraenkungen
   - Re-Distribution-Regeln

## Was, wenn ich Rechtsberatung brauche?

Konsultiere einen qualifizierten Anwalt in deiner Jurisdiktion. FlowMCP leistet keine Rechtsberatung und uebernimmt keine Haftung fuer Compliance-Entscheidungen.

## Ist `meta.dataLicense` rechtsverbindlich?

Nein. Wir spiegeln nur, was der Provider auf seiner Seite publiziert. Die tatsaechlichen Bedingungen des Providers haben Vorrang. Wir geben keine Gewaehrleistung.

## Was, wenn ein Schema keine `termsOfService`-URL hat?

Das bedeutet entweder:
- Wir haben den Provider noch nicht recherchiert, ODER
- Der Provider publiziert keine ToS (z. B. NASA APOD — Public-Domain-Daten der US-Regierung)

In beiden Faellen: vor kommerzieller Nutzung selbst pruefen.

## Wie oft pruefen wir ToS-URLs erneut?

Wir streben eine Re-Pruefung alle 6 Monate an. Ein Background-Audit-Script markiert veraltete Eintraege. Reaktive Updates erfolgen, wenn groessere ToS-Aenderungen oeffentlich bekannt sind.

## CLI-Disclaimer-Ausgabe

Du kannst Opt-in-Lizenz-Disclaimer in der CLI aktivieren:

```bash
# In flowmcp.config.json (global oder projekt-lokal):
{
    "licenseDisclaimer": true
}

# Dann:
flowmcp call coingecko_market_chart
# [License Info] Provider: coingecko
# [License Info] ToS: https://www.coingecko.com/en/terms (last checked: 2026-05-18)
# [License Info] We do not interpret ToS. Please review before commercial use.
```

Standard: `licenseDisclaimer: false` (aus).

## Verantwortung der Nutzenden

Du bist allein verantwortlich fuer:

- Die Pruefung der Terms of Services jedes API-Providers vor der Nutzung
- Die Einhaltung von Rate-Limits, Attributionspflichten und Daten-Lizenzen
- Die Entscheidung ueber Eignung fuer kommerzielle, Forschungs- oder Produktiv-Nutzung
- Die Einhaltung von LLM-Training-Beschraenkungen und Re-Distribution-Klauseln

FlowMCP gibt **keine Gewaehrleistung** fuer ToS-Compliance, Daten-Lizenzierung oder Eignung fuer einen bestimmten Zweck. Nutzung auf eigenes Risiko.

## Siehe auch

- [Spezifikation: License & ToS (spec/v4.0.0/23-license-and-tos.md)](https://github.com/FlowMCP/flowmcp-spec/blob/main/spec/v4.0.0/23-license-and-tos.md)
- [DISCLAIMER.md in flowmcp-core](https://github.com/FlowMCP/flowmcp-core/blob/main/DISCLAIMER.md)
- [DISCLAIMER.md in flowmcp-cli](https://github.com/FlowMCP/flowmcp-cli/blob/main/DISCLAIMER.md)
