---
title: Uebersicht
description: "FlowMCP-Schemas definieren, wie Datenquellen zu MCP-kompatiblen Tools werden — eine .mjs-Datei pro Provider"
---

Ein Schema ist eine einzelne `.mjs`-Datei, die eine Datenquelle fuer KI-Agenten kapselt. Jedes Schema deklariert seine Tools, Resources, Prompts und Skills in einem statischen `main` Export. Ein optionaler `handlers` Export ergaenzt Antwort-Transformation.

FlowMCP v3.0.0 unterstuetzt vier Primitive:

:::note[Tools]
REST API Endpoints. Parameter auf URLs abbilden, Authentifizierung injizieren, Eingaben validieren. Das Kern-Primitiv — jedes Schema hat mindestens ein Tool. Siehe [Tools](/de/docs/schemas/tools/).
:::

:::note[Resources]
Lokale SQLite-Datenbanken. Schnelle, deterministische Abfragen fuer Massendaten wie Handelsregister, Fahrplaene oder Sanktionslisten. Siehe [Resources](/de/docs/schemas/resources/).
:::

:::note[Prompts]
Erklaerende Texte, die KI-Agenten beibringen, wie die Tools eines Providers zusammenarbeiten — Paginierungs-Muster, Fehlercodes, Dateninterpretation. Siehe [Prompts](/de/docs/schemas/prompts/).
:::

:::note[Skills]
Mehrstufige Workflow-Anweisungen. Wiederverwendbare Pipelines, die Tools und Resources zu uebergeordneten Operationen zusammensetzen. Siehe [Skills](/de/docs/schemas/skills/).
:::

## Schema-Struktur

Jedes Schema exportiert zwei Dinge:

| Export | Erforderlich | Zweck |
|--------|-------------|-------|
| `main` | Ja | Deklarative Konfiguration — Tools, Resources, Prompts, Skills. JSON-serialisierbar und hashbar. |
| `handlers` | Nein | Antwort-Transformation — Pre/Post-Processing fuer API-Antworten. |

:::tip
Die meisten Schemas benoetigen nur `main`. Fuege `handlers` hinzu, wenn API-Antworten vor der Weitergabe an den KI-Agenten transformiert werden muessen.
:::
