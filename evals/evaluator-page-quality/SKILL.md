# Skill: evaluator-page-quality

Trigger: Page-Quality-Audit auf Docs-Seiten (Memo 052 REV-07 Kap. 4.5).

## Bewertungs-Kriterien (max 6.0 Punkte)

| Rule | Weight |
|------|--------|
| Persona-Tonalitaet | 1.0 |
| Diagramm-Ratio (min 1 / 200 Zeilen) | 1.0 |
| Keine Emojis (oder begruendet) | 0.5 |
| GitHub-Install statt NPM | 0.5 |
| DE-Pendant + Delta < 30 Zeilen | 1.0 |
| Cross-Links funktionieren | 0.5 |
| Code-Beispiel mit Output-Annotation | 0.5 |
| Length-vs-Content-Ratio | 1.0 |

## Grade-Mapping

| Score | Grade |
|-------|-------|
| >= 5.5 | 5 |
| >= 4.5 | 4 |
| >= 3.5 | 3 |
| >= 2.5 | 2 |
| < 2.5  | 1 |

## Aufruf

```bash
# Single file (dry-run)
node evals/evaluator-page-quality/runner.mjs --file=src/content/docs/concepts/agents.md --dry-run

# All pages (writes frontmatter)
node evals/evaluator-page-quality/runner.mjs --all

# All pages, dry-run only
node evals/evaluator-page-quality/runner.mjs --all --dry-run
```

## Output

Pro Seite: Frontmatter-Block `page_quality:` mit:
- `grade` (1-5)
- `evaluated_at` (ISO timestamp)
- `evaluator` (Skill-Name@Version)
- `issues` (Liste der gefundenen Probleme)
- `persona_target` (uebernommen aus frontmatter oder "unknown")
