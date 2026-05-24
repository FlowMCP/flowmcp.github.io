# Link Audit Rollout — Memo 057 PRD-06

## Phase 1 (Warning-Mode) — Start

- **Start:** {DATUM_INSERT_BEIM_MERGE}
- **Cron:** Mo 06:00 UTC
- **Mode:** continue-on-error: true, Annotations als ::warning::
- **Workflow:** `.github/workflows/link-audit.yml`

## Wochen-Reports (2 Wochen Beobachtung)

| Woche | Datum | Broken Links (extern) | Broken Links (intern) | Notes |
|-------|-------|-----------------------|-----------------------|-------|
| 1 | — | — | — | — |
| 2 | — | — | — | — |

## Phase 2 Flip-Entscheidung

- **Schwellwert (REV-04 F-C):** <3 broken Links in 2 consecutive weekly reports
- **Status:** PENDING (Phase 1 laeuft)
- **Wenn erreicht:** Workflow auf Phase 2 umstellen
  - `continue-on-error: true` aus beiden Check-Steps entfernen
  - Annotations `::warning::` → `::error::`
  - Header-Kommentar im Workflow auf Phase 2 aktualisieren
  - Eintrag hier mit Flip-Datum + Owner
- **Wenn nicht erreicht:** Separates Issue oeffnen, Bug-Tracking-Plan, Phase 1 verlaengert

## Flip-Anleitung (Schritt-fuer-Schritt)

1. `.github/workflows/link-audit.yml` editieren
2. Bei beiden Steps (`check_links`, `check_spec_links`) `continue-on-error: true` entfernen
3. `::warning::` → `::error::` in beiden `echo`-Statements ersetzen
4. Header-Kommentar (Zeilen 1-15) aktualisieren: Mode auf PHASE 2 setzen
5. Commit-Message: `Flip link-audit workflow to Phase 2 (hard-fail) #<issue>`
6. Diesen Report mit Flip-Datum + Owner-Handle ergaenzen

## Owner

- **Verantwortlich:** {GITHUB_HANDLE}
- **Backup:** {BACKUP_HANDLE}

## Quellen

- Memo: `057-webseite-ui-polish` REV-04 Kap. 8 + F-C Entscheidung
- PRD: `.memo/057-webseite-ui-polish/rollout/phase-2/PRD-06_link-audit-ci-workflow.md`
- Workflow: `.github/workflows/link-audit.yml`
