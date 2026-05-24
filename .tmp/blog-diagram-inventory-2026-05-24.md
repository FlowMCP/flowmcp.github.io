# Blog Diagram Inventory — 2026-05-24

**Quelle:** Memo 059 REV-04 Cluster H.1, PRD-020 (reduzierter Scope).

**User-Entscheidung 2026-05-24:** Image-Generation deferred. Pflicht-Regel "min. 1 Diagramm pro Blogpost" (verankert in `repos/flowmcp-spec/personas/diagramme-policy.md` und `personas/tone-guide.md`) wird in einem Folge-Memo umgesetzt. Diese Inventur dokumentiert den IST-Zustand fuer den spaeteren Backfill — KEINE Aenderung an Blog-Markdown, KEINE Image-Generation in diesem Rollout.

## Methodik

- Verzeichnis: `repos/flowmcp.github.io/src/content/blog/`
- Ausgeschlossen: `welcome.md` (Starlight-Default, kein redaktioneller Blogpost)
- Erfassung pro Datei:
  - **Mermaid:** Anzahl Code-Bloecke mit ```` ```mermaid ````
  - **Image:** Anzahl Markdown-Image-Embeds (`![...](...)`)
  - **Status:** OK (>=1 Diagramm vorhanden) oder MISSING (kein Diagramm)
  - **Action-Item:** `defer` (Image-Generation in Folge-Memo) oder `none` (Pflicht erfuellt)

## Inventar

| Filename | Mermaid | Image | Status | Action-Item |
|----------|---------|-------|--------|-------------|
| `2026-05-flowmcp-v4-skills-selections-pipes.md` | 1 | 0 | OK | none — Pflicht-Regel erfuellt (interner Mermaid TD). Hero-Bild (Excalidraw) optional, in Folge-Memo zu entscheiden. |
| `2026-XX-anschluss-erreichen-hackathon.md` | 0 | 0 | MISSING | defer — min. 1 Diagramm fehlt. Vorschlag fuer Folge-Memo: Hero (Excalidraw-Stil) + optional interner Mermaid TD fuer Anschluss-Logik. |
| `2026-XX-flowmcp-v41-gtfs-add-on.md` | 0 | 0 | MISSING | defer — min. 1 Diagramm fehlt. Vorschlag fuer Folge-Memo: Hero (Excalidraw-Stil) + optional interner Mermaid TD fuer GTFS-Add-on-Architektur. |

**Posts erfasst:** 3 (exkl. `welcome.md`)
**Pflicht-Regel erfuellt:** 1 / 3
**Pflicht-Regel offen:** 2 / 3

## Action-Items fuer Folge-Memo (Image-Generation)

1. **`2026-XX-anschluss-erreichen-hackathon.md`** — Hero-Diagramm im Excalidraw-Stil generieren (Skill: `image-diagram-excalidraw`). Motiv: Bahn-/Anschluss-Symbolik. Optional zusaetzlich: interner Mermaid TD fuer Datenfluss DB InfraGO -> FlowMCP -> Agent.
2. **`2026-XX-flowmcp-v41-gtfs-add-on.md`** — Hero-Diagramm im Excalidraw-Stil generieren. Motiv: GTFS-Schienennetz-Andeutung + Add-on-Stecker-Metapher. Optional zusaetzlich: Mermaid TD fuer GTFS-Add-on-Pipeline.
3. **`2026-05-flowmcp-v4-skills-selections-pipes.md`** — Pflicht erfuellt, aber **optionaler** Hero-Bild-Kandidat (Excalidraw-Stil) zur Steigerung des visuellen Hooks. In Folge-Memo als P2-Eintrag.

## Out of Scope (Memo 059 PRD-020 reduziert)

- KEINE Markdown-Edits an Blog-Drafts (auch keine Frontmatter)
- KEINE Image-Generation via Nano Banana oder anderem Tool
- KEINE Mermaid-Einsaetze in Blogposts in diesem Rollout

## Verification

```bash
ls repos/flowmcp.github.io/src/content/blog/*.md
grep -l '```mermaid' repos/flowmcp.github.io/src/content/blog/*.md
grep -l '!\[' repos/flowmcp.github.io/src/content/blog/*.md
cat .tmp/blog-diagram-inventory-2026-05-24.md
```

## Audit-Spur

- Memo 059 REV-04 Cluster H.1 (Diagrammstyle-Guideline + Pflicht-Regel)
- PRD-020 (reduziert auf Inventur per User-Entscheidung 2026-05-24)
- PRD-019 (Style-Tabelle in `personas/diagramme-policy.md` + Pflicht-Regel in `personas/tone-guide.md`)
