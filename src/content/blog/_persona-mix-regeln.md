# Blog Persona-Mix-Regeln (Hand-off an Memo 047)

> **Diese Datei ist KEINE oeffentliche Seite.** Der Underscore-Prefix (`_`) schliesst
> sie aus der Astro Content-Collection aus. Sie dient ausschliesslich als Schreib-
> Anleitung fuer Memo 047 (Blog-Content) und als Referenz fuer Reviewer.
>
> **Verantwortlichkeiten:**
> - **Memo 052** (Content-Audit) verantwortet diese Regeln, das Frontmatter-Schema
>   und die Persona-Mix-Tabelle (Strukturentscheidungen).
> - **Memo 047** (Blog-Content) verantwortet die tatsaechlichen Blog-Texte und
>   muss sich an diese Regeln halten.

## Personas (Kurzreferenz)

- **Daniel** — Developer/Integrator. Will Code, lauffaehige Snippets, Quickstart.
- **Sofia** — Schema-Autorin. Will Schema-Beispiele, Validation-Output, Catalog-Updates.
- **Mira** — Hackathon/Community-Teilnehmerin. Will Stories, Atmosphaere, "wie war es vor Ort".
- **Anders** — Decision-Maker. Will Trust-Signale, Reife-Indikatoren, sachliche Sprache, KEINE Buzzwords.

## Persona-Mix-Tabelle (pro Blog-Typ)

| Blog-Typ              | Personas                  | Begruendung                                                   |
|-----------------------|---------------------------|---------------------------------------------------------------|
| Version-Release       | Daniel + Sofia + Anders   | Entwickler-Changes + Schema-Migration + Stabilitaets-Signal   |
| Hackathon-Bericht     | Mira + Anders             | Community-Atmosphaere + Trust ("FlowMCP wird genutzt")        |
| Use-Case-Story        | Daniel + Anders           | Konkretes Integrations-Beispiel + Validierung des Ansatzes    |
| Schema-Catalog-Update | Sofia + Anders            | Neue Schemas + Reife-Indikator (Catalog waechst stetig)       |
| Tooling-Release       | alle 4                    | CLI/Editor-Tools betreffen alle Persona-Gruppen                |

## Schreib-Standard

### Sprache & Stil

- **Keine Emojis** in Fliesstext oder Headlines, ausser sie sind *zwingend* (z.B.
  Status-Indikatoren in Tabellen, wo Text-Alternativen umstaendlich waeren).
  Default: Emojis raus.
- **Tonalitaet pro Persona-Mix:**
  - Anders-zentrische Posts (Version-Release, Catalog-Update): sachlich, niedrige
    Adjektiv-Dichte, keine Werbe-Sprache.
  - Mira-zentrische Posts (Hackathon-Bericht): erzaehlerisch, ich-Perspektive
    erlaubt, Atmosphaere wichtiger als Vollstaendigkeit.
  - Daniel-zentrische Posts (Use-Case-Story): code-getrieben, kurze Saetze,
    Snippets zentral.
  - Sofia-zentrische Posts (Schema-Catalog-Update): praezise, Schema-Beispiele
    statt Prosa, Validation-Output erwuenscht.
- **DE-Pendant bei DACH-Bezug:** Hackathons in Deutschland, deutsche Schemas
  (KBA, Handelsregister, Bundesnetzagentur), deutsche Behoerden-Themen — IMMER
  auch deutsche Version unter `src/content/docs/de/blog/`.

### Diagramme & Bilder

- **Mermaid statt ASCII-Diagramme.** Mermaid ist via `rehype-mermaid` als
  `pre-mermaid`-Strategy konfiguriert (siehe `astro.config.mjs`).
- **PNG-Bilder NUR auf User-Freigabe.** Die Stellenwert-Hierarchie:
  - Stern-Stern (PNG explizit angefordert): nicht aendern, nur dokumentieren
  - Stern (PNG vorhanden, ersetzbar): Mermaid-Alternative vorschlagen
  - kein Diagramm: bei mind. 1 Diagramm/Bild Pflicht aktiv werden
- **Mindestens 1 Diagramm oder Bild pro Post** — Posts ohne visuelles Element
  werden in der Sidebar weniger geklickt (auch Anders-Persona scannt visuell).

### Code-Beispiele

- **Code-Beispiele muessen lauffaehig sein.** Vor Publish einmal lokal testen.
- **`<InstallNote />`-Komponente fuer Install-Steps** verwenden (siehe
  `src/components/InstallNote.astro`). Verhindert, dass `npm install flowmcp`
  als kopierbares Snippet auftaucht (FlowMCP ist NICHT auf npm, immer
  `github:FlowMCP/...`).

## Frontmatter-Schema

Jeder Blog-Post unter `src/content/docs/blog/*.md(x)` muss folgendes Frontmatter
fuehren:

```yaml
---
title: <Post-Titel>
description: <1 Satz, max 160 Zeichen>
date: YYYY-MM-DD
persona_mix: [Mira, Anders]      # 1-4 Personas aus {Daniel, Sofia, Mira, Anders}
blog_type: "Hackathon-Bericht"   # Einer der 5 Typen aus Persona-Mix-Tabelle
has_diagram: true                # Mermaid oder PNG vorhanden? (Pflicht-Check)
de_pendant: true                 # Existiert DE-Version unter de/blog/?
---
```

**Validierungs-Regeln (Memo 047 Hand-off):**

- `persona_mix` muss zur `blog_type`-Zeile in der Tabelle oben passen.
- Wenn `de_pendant: true`, muss die DE-Datei unter `de/blog/<slug>.md(x)`
  existieren.
- `has_diagram: false` ist NUR erlaubt fuer reine Tooling-Release-Posts ohne
  Architektur-Bezug — Memo 047 darf das pro Post begruenden.

## Verifikation (durch Memo 047 vor Publish)

- [ ] Persona-Mix matched Blog-Typ
- [ ] Keine Emojis ausser zwingend
- [ ] Mindestens 1 Mermaid-Diagramm oder PNG
- [ ] Code-Snippets lauffaehig (lokal getestet)
- [ ] Bei DACH-Bezug: DE-Pendant vorhanden
- [ ] Tonalitaet zum Persona-Mix passend
