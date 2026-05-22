# evaluator-page-quality

Deterministischer Quality-Skill fuer Docs-Seiten in `src/content/docs/`.
Quelle: Memo 052-webseite-content-audit REV-07 Kap. 4.5.

## Struktur

```
evaluator-page-quality/
├── SKILL.md              # Skill-Definition + Trigger
├── README.md             # Dieses Dokument
├── criteria.json         # Gewichtung + Grade-Mapping
├── runner.mjs            # CLI-Runner
└── rules/
    ├── persona-tonality.mjs     (1.0)
    ├── diagram-ratio.mjs        (1.0)
    ├── no-emojis.mjs            (0.5)
    ├── github-install.mjs       (0.5)
    ├── de-pendant.mjs           (1.0)
    ├── cross-links.mjs          (0.5)
    ├── code-examples.mjs        (0.5)
    └── length-content-ratio.mjs (1.0)
```

## Rule Contract

Jede Rule exportiert eine Klasse mit static `evaluate({ content, frontmatter, filePath, repoRoot })` →
`{ score, max, issues }`. Async-Rules sind erlaubt (siehe `de-pendant.mjs`).

## Beispiel-Output

```
Grade 4 (score 4.75) — src/content/docs/concepts/agents.md
   - Persona-Signals "Daniel" zu schwach (1/5)
   - Pendant-Delta 119 Zeilen (> 30)
```

## Erweiterungen

Neue Rule hinzufuegen:
1. Modul in `rules/` anlegen (export class, static `evaluate`, `{ score, max, issues }`-Return)
2. Eintrag in `criteria.json` `rules`-Array
3. Import + Aufruf in `runner.mjs`

## NPM-Script

```bash
npm run eval:page-quality -- --all --dry-run
```
