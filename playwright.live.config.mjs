// Memo 060 Phase 9 (PRD-027): Playwright-Konfig fuer Live-Site-Smoke.
//
// Lokal-Modus: Default baseURL ist http://localhost:4321 (npm run preview), weil
// die Phase-1-bis-8-Commits noch nicht gepusht sind. Live-Modus ueber Env-Var
// PHASE9_BASE_URL=https://flowmcp.github.io aktivieren.
//
// Diese Config startet KEINEN webServer-Block, weil sowohl Preview als auch
// Live extern bereitstehen.

import { defineConfig, devices } from '@playwright/test'


const BASE_URL = process.env.PHASE9_BASE_URL || 'http://localhost:4321'


export default defineConfig( {
    testDir: './tests',
    testMatch: [ 'playwright/phase-9-smoke.spec.mjs' ],
    fullyParallel: false,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    timeout: 60_000,
    reporter: [
        [ 'list' ],
        [ 'json', { outputFile: '../../proofs/phase-9-verification-2026-05-24/playwright/results.json' } ]
    ],
    use: {
        baseURL: BASE_URL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure'
    },
    projects: [
        { name: 'chromium-desktop', use: { ...devices[ 'Desktop Chrome' ] } }
    ]
} )
