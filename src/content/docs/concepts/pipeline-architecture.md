---
title: Source-of-Truth-Architektur — wie FlowMCP-Releases zur Webseite werden
description: Architektur-Regeln R1-R8, refs.manual.json-Pflege, Konsumenten-Pipeline und Troubleshooting fuer die FlowMCP-Release-Pipeline.
sidebar:
  order: 10
---

Diese Seite beschreibt, wie eine einzige manuelle Aenderung an `data/refs.manual.json` im Spec-Repo automatisch zu aktualisierten Docs, Org-Profile, llms.txt-Varianten und robots.txt fuehrt.

## Architektur-Regeln R1-R8

| Regel | Kurz | Detail |
|-------|------|--------|
| **R1** | Informationshoheit | Die Spec entscheidet, was angezeigt wird |
| **R2** | Payload-First | Einziger Austausch via `manifest.json` + Spec-Files |
| **R3** | Build-Trigger | Spec-Push triggert Docs-Build automatisch |
| **R4** | Keine Interpretation | Docs-Repo darf Spec-Inhalte nicht umdeuten |
| **R5** | Kein Karteileichen-Inhalt | Legacy-Dateien (z. B. `route-tests.md`) werden gefiltert |
| **R6a** | Spec-Repo English-Only | Keine DE-Mirrors in `spec/v4.1.0/`, keine `translations.*`-Felder im Manifest |
| **R6b** | Docs-Webseite darf DE-Versionen haben | `flowmcp.github.io/src/content/docs/de/...` ist erlaubt, aber kein Spec-Spiegel — eigene Texte mit Placeholder-System |
| **R7** | Single Source of Truth | `flowmcp-spec/data/refs.manual.json` (manuell) + auto-generierte `refs.resolved.json` |
| **R8** | Placeholder-First | Alle Konsumenten lesen Werte aus der Schnittstellen-JSON. Hardcoded Versionen/URLs sind verboten. Build-Skripte werfen Fehler bei missing Placeholder. |

## Pipeline-Diagramm

```mermaid
flowchart TD
    subgraph SPEC["flowmcp-spec (Source of Truth)"]
        M1["data/refs.manual.json<br/>(manuell, PR-Review)"]
        M2["data/refs.schema.json<br/>(JSON-Schema)"]
        M3["scripts/generate-refs.mjs"]
        M4["generated/refs.resolved.json<br/>(auto, validiert)"]
        MS["data/mini-skill.template.md<br/>(Single-Source Mini-Skill)"]
        M5["scripts/generate-docs-payload.mjs"]
        M6["scripts/generate-manifest.mjs"]
        M7["generated/docs-payload/<br/>(Markdown + manifest.json)"]
        M8["spec/v4.1.0/*.md<br/>(English-Only, R6a)"]
        M1 --> M3
        M2 --> M3
        M3 --> M4
        M8 --> M5
        M5 --> M7
        M8 --> M6
        M6 --> M7
    end

    subgraph CI1[".github/workflows"]
        W1["generate-refs.yml"]
        W2["notify-docs-site.yml<br/>(repo-dispatch)"]
        W3["notify-org-profile.yml<br/>(repo-dispatch, ohne Approval)"]
    end

    M4 --> W1
    M4 --> W2
    M4 --> W3
    MS --> W2
    MS --> W3

    subgraph DOCS["flowmcp.github.io (Konsument 1)"]
        D1["sync-spec.yml<br/>(listener)"]
        D2["scripts/fetch-refs.mjs"]
        D3["src/data/refs.json<br/>+ mini-skill.template.md"]
        D4["scripts/replace-placeholders.mjs<br/>(Strict-Mode)"]
        D5["src/templates/* (EN + de/, R6b)"]
        D6["src/content/docs/*"]
        D7["scripts/generate-llms-txt.mjs"]
        D8["scripts/generate-robots-txt.mjs"]
        D9["dist/llms.txt + docs-llms.txt + llms-full.txt + robots.txt"]
        D10["dist/ (Production)"]
        D1 --> D6
        D2 --> D3
        D3 --> D4
        D5 --> D4
        D4 --> D6
        D3 --> D7
        D3 --> D8
        D7 --> D9
        D8 --> D9
        D6 --> D10
        D9 --> D10
    end

    subgraph ORG["dot-github (Konsument 2)"]
        O1["scripts/fetch-refs.mjs"]
        O2["src/data/template.txt<br/>(Placeholder)"]
        O3["src/data/config.mjs<br/>(BadgeTable-Config)"]
        O4["index.mjs<br/>(Placeholder-Replace + BadgeTable)"]
        O5["profile/README.md"]
        O1 --> O4
        O2 --> O4
        O3 --> O4
        O4 --> O5
    end

    W2 --> D1
    W3 --> O1
```

## refs.manual.json — Pflege-Anleitung

### Wer darf pflegen

`flowmcp-spec/data/refs.manual.json` ist die **einzige** manuell gepflegte Quelle fuer Versionen, Imports und URLs.

| Aspekt | Wert |
|--------|------|
| Pfad | `flowmcp-spec/data/refs.manual.json` |
| Pflege | Pull-Request mit Review (Branch-Protection auf `main`) |
| Schutz | JSON-Schema `flowmcp-spec/data/refs.schema.json` validiert Struktur + Regex |
| Sichtbarkeit | offen im Spec-Repo (nicht in `generated/`) |

### JSON-Schema-Referenz

Die Validation passiert in zwei Schritten:

1. **CI-Workflow** `generate-refs.yml` triggert bei Push auf `data/refs.manual.json`
2. **Resolver** `scripts/generate-refs.mjs` validiert gegen `refs.schema.json` und Import-Regex `^github:FlowMCP/[\w-]+(#[\w./-]+)?$`

Bei Verletzung bricht der Resolver ab — keine `refs.resolved.json`, kein Notify, keine Konsumenten-Builds.

### Pflicht-Felder

| Feld-Pfad | Validation |
|-----------|------------|
| `schemaVersion` | `^refs/\d+\.\d+\.\d+$` |
| `spec.currentVersion` | `^4\.\d+\.\d+$` |
| `spec.recommendedRelease` | `^v\d+\.\d+\.\d+$` |
| `spec.miniSkillTemplate` | `^data/.*\.md$` |
| `imports.*` | `^github:FlowMCP/[\w-]+(#[\w./-]+)?$` |
| `docs.canonical` | `^https://[a-z0-9.-]+(/.*)?$` |
| `llmsFiles.*` | URL-Regex |

## Konsumenten der Pipeline

Die folgenden Komponenten lesen `refs.resolved.json` aus dem Spec-Repo:

| Konsument | Repo | Funktion |
|-----------|------|----------|
| Docs-Webseite | `flowmcp.github.io` | Templates mit `{{spec.currentVersion}}`, `{{imports.cli.github}}`, etc. |
| Org-Profile | `.github` (org profile) | `profile/README.md` mit Versions- und Spec-URL-Placeholdern |
| llms.txt-Varianten | `flowmcp.github.io` | `dist/llms.txt`, `dist/docs-llms.txt`, `dist/llms-full.txt` aus refs |
| robots.txt | `flowmcp.github.io` | `dist/robots.txt` aus `refs.json.robotsTxt.publishedLlmsFiles` |
| Mini-Skill | `flowmcp.github.io` (gehostet) / `flowmcp-spec` (Single-Source) | `data/mini-skill.template.md` mit Placeholdern |

## Troubleshooting

### Mein Placeholder ist nicht ersetzt

**Symptom:** Im gebauten `dist/` taucht ein `{{key.subkey}}`-String auf.

**Ursachen + Loesungen:**

1. Placeholder-Schluessel existiert nicht in `refs.resolved.json` — pruefe Schreibweise und JSON-Pfad
2. Template liegt nicht in `src/templates/` — Replacer verarbeitet nur diesen Ordner
3. Build hat den Strict-Mode nicht erreicht — pruefe `npm run check:placeholders`

### Org-Profile zeigt alte Version

**Symptom:** `profile/README.md` zeigt v4.0.0 obwohl Spec auf v4.1.0 ist.

**Ursachen + Loesungen:**

1. `notify-org-profile.yml` wurde nicht ausgeloest — pruefe Spec-Workflow-Runs
2. `.github/.github/workflows/sync-refs.yml` Listener ist nicht aktiv
3. `fetch-refs.mjs` in `.github` laeuft nicht in der Build-Chain — pruefe `index.mjs`-Reihenfolge

### Sync laeuft nicht durch

**Symptom:** Spec-Push triggert kein Docs-Build.

**Ursachen + Loesungen:**

1. Branch-Protection blockiert direkten Push — Push via Pull-Request
2. `notify-docs-site.yml` Token expired — pruefe GitHub-Repo-Secrets
3. `sync-spec.yml`-Listener im Docs-Repo nicht installiert

## Versions-Lifecycle

Wie eine neue Minor-Version (z. B. v4.2.0) ausgerollt wird:

1. **Spec-Repo:** Hardcopy `cp -r spec/v4.1.0 spec/v4.2.0`
2. **Spec-Repo:** Generatoren auf `SPEC_VERSION = '4.2.0'` umstellen
3. **Spec-Repo:** `CHANGELOG.md` `## v4.2.0 — YYYY-MM-DD` mit Release-Datum
4. **Spec-Repo:** `package.json` `"version": "4.2.0"`
5. **Spec-Repo:** `data/refs.manual.json` aendern:
   - `spec.currentVersion: "4.2.0"`
   - `spec.recommendedRelease: "v4.2.0"`
   - `imports.cli: "github:FlowMCP/flowmcp-cli#v4.2.0"`
   - `imports.core: "github:FlowMCP/flowmcp-core#v4.2.0"`
6. **Spec-Repo:** Pull-Request → Review → Merge
7. **CI:** `generate-refs.yml` validiert + generiert `refs.resolved.json`
8. **CI:** `notify-docs-site.yml` + `notify-org-profile.yml` triggern via repo-dispatch
9. **Docs/Org-Profile:** Konsumenten ziehen automatisch neue refs, Build laeuft
10. **Spec-Repo:** Git-Tag `v4.2.0` + GitHub-Release

Das alte v4.1.0-Verzeichnis bleibt unberuehrt als historisches Release.

:::note
Die R6a-R6b-Trennung gilt auch fuer neue Versionen: `spec/v4.2.0/` ist English-Only, die DE-Webseite in `src/content/docs/de/...` wird parallel aktualisiert.
:::
