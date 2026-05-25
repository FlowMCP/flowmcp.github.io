// Memo 060 Phase 9 (PRD-028 Task 3): Lighthouse-Smoke-Test fuer Live-URL.
//
// Eigenstaendiges Script, KEINE Aenderung an scripts/test-lighthouse.mjs.
// Default: gegen lokales Preview (http://localhost:4321). Live via
// PHASE9_BASE_URL=https://flowmcp.github.io.
//
// Voraussetzung: lighthouse CLI global installiert (npm install -g lighthouse).
// Help: node scripts/lighthouse-smoke.mjs --help

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { execSync, spawnSync } from 'node:child_process'


class LighthouseSmokeRunner {
    static #BASE_URL = process.env.PHASE9_BASE_URL || 'http://localhost:4321'

    static #PAGES = [
        { id: 'landing',          url: '/',                       label: 'Landing' },
        { id: 'about',            url: '/about/',                 label: 'About' },
        { id: 'cli-setup',        url: '/quickstart/quickstart/', label: 'CLI Setup' },
        { id: 'concepts-schemas', url: '/concepts/schemas/',      label: 'Concepts/Schemas' },
        { id: 'blog',             url: '/blog/',                  label: 'Blog' }
    ]

    static #THRESHOLDS = {
        'performance':     80,
        'accessibility':   90,
        'best-practices':  85,
        'seo':             85
    }


    static async run( { reportDir, outputPath } ) {
        const baseURL = LighthouseSmokeRunner.#BASE_URL
        console.log( `[lighthouse-smoke] baseURL=${ baseURL }, ${ LighthouseSmokeRunner.#PAGES.length } pages` )

        // CLI-Check via local devDependency. Globale lighthouse 5.x ist auf macOS 12
        // mit Chrome 148 inkompatibel ("unable to reliably load the page"), daher
        // strikt lokales lighthouse@^13 verwenden.
        const localCli = path.resolve( process.cwd(), 'node_modules/.bin/lighthouse' )
        try {
            const versionOut = execSync( `${ localCli } --version`, { encoding: 'utf-8' } ).trim()
            console.log( `[lighthouse-smoke] lighthouse (local devDep) version: ${ versionOut }` )
        } catch( err ) {
            console.error( '[lighthouse-smoke] ERROR: local lighthouse not installed. Run: npm install --save-dev lighthouse@^13' )
            process.exit( 1 )
        }

        mkdirSync( reportDir, { recursive: true } )

        const results = []

        for( const page of LighthouseSmokeRunner.#PAGES ) {
            const fullURL    = `${ baseURL }${ page.url }`
            const reportPath = path.join( reportDir, `${ page.id }.json` )

            console.log( `\n[lighthouse-smoke] ${ page.id } -> ${ fullURL }` )

            // Lighthouse direkt aufrufen (nicht via shell um Injection zu vermeiden)
            const proc = spawnSync( localCli, [
                fullURL,
                '--output=json',
                `--output-path=${ reportPath }`,
                '--chrome-flags=--headless=new',
                '--quiet',
                '--only-categories=performance,accessibility,best-practices,seo'
            ], {
                encoding: 'utf-8',
                stdio: [ 'inherit', 'pipe', 'pipe' ],
                timeout: 180_000
            } )

            const result = {
                id: page.id,
                label: page.label,
                url: page.url,
                fullURL,
                reportPath: path.relative( process.cwd(), reportPath ),
                scores: {},
                pass: false,
                error: null
            }

            if( proc.status !== 0 ) {
                result.error = `lighthouse exit ${ proc.status }: ${ ( proc.stderr || '' ).slice( 0, 300 ) }`
                console.error( `  ERROR: ${ result.error }` )
                results.push( result )
                continue
            }

            try {
                const report = JSON.parse( readFileSync( reportPath, 'utf-8' ) )
                const categories = report.categories || {}

                Object
                    .entries( LighthouseSmokeRunner.#THRESHOLDS )
                    .forEach( ( [ key, threshold ] ) => {
                        const raw = categories[ key ]?.score
                        const score = raw == null ? 0 : Math.round( raw * 100 )
                        result.scores[ key ] = { score, threshold, pass: score >= threshold }
                    } )

                result.pass = Object.values( result.scores ).every( ( s ) => s.pass )

                const summary = Object
                    .entries( result.scores )
                    .map( ( [ k, v ] ) => { return `${ k }=${ v.score }${ v.pass ? '' : '!' }` } )
                    .join( ' ' )
                console.log( `  ${ result.pass ? 'PASS' : 'FAIL' } — ${ summary }` )
            } catch( err ) {
                result.error = `Report parse error: ${ err.message }`
                console.error( `  ERROR: ${ result.error }` )
            }

            results.push( result )
        }

        // Aggregat
        const allPass = results.every( ( r ) => r.pass )
        const aggregate = {
            timestamp: new Date().toISOString(),
            baseURL,
            thresholds: LighthouseSmokeRunner.#THRESHOLDS,
            total: results.length,
            passed: results.filter( ( r ) => r.pass ).length,
            failed: results.filter( ( r ) => !r.pass ).length,
            allPass,
            results
        }

        writeFileSync( outputPath, JSON.stringify( aggregate, null, 2 ) )

        // Markdown-Tabelle daneben schreiben
        const mdPath = outputPath.replace( /\.json$/, '.md' )
        const mdLines = []
        mdLines.push( '# Phase 9 — Lighthouse Smoke Report' )
        mdLines.push( '' )
        mdLines.push( `Base URL: \`${ baseURL }\`` )
        mdLines.push( `Timestamp: ${ aggregate.timestamp }` )
        mdLines.push( `Result: **${ allPass ? 'PASS' : 'FAIL' }** (${ aggregate.passed }/${ aggregate.total })` )
        mdLines.push( '' )
        mdLines.push( '| Page | Performance | Accessibility | Best-Practices | SEO | Status |' )
        mdLines.push( '|------|-------------|---------------|----------------|-----|--------|' )

        results.forEach( ( r ) => {
            const p   = r.scores.performance?.score ?? '—'
            const a   = r.scores.accessibility?.score ?? '—'
            const bp  = r.scores[ 'best-practices' ]?.score ?? '—'
            const seo = r.scores.seo?.score ?? '—'
            const st  = r.pass ? 'PASS' : ( r.error ? `ERROR (${ r.error.slice( 0, 40 ) })` : 'FAIL' )
            mdLines.push( `| ${ r.label } (\`${ r.url }\`) | ${ p } | ${ a } | ${ bp } | ${ seo } | ${ st } |` )
        } )

        mdLines.push( '' )
        mdLines.push( `Thresholds: Performance >= ${ LighthouseSmokeRunner.#THRESHOLDS.performance }, Accessibility >= ${ LighthouseSmokeRunner.#THRESHOLDS.accessibility }, Best-Practices >= ${ LighthouseSmokeRunner.#THRESHOLDS[ 'best-practices' ] }, SEO >= ${ LighthouseSmokeRunner.#THRESHOLDS.seo }` )

        writeFileSync( mdPath, mdLines.join( '\n' ) + '\n' )

        console.log( `\n[lighthouse-smoke] aggregate -> ${ outputPath }` )
        console.log( `[lighthouse-smoke] markdown -> ${ mdPath }` )
        console.log( `[lighthouse-smoke] ${ aggregate.passed }/${ aggregate.total } pages pass thresholds` )

        return { allPass, aggregate }
    }
}


function printHelp() {
    console.log( `
Phase 9 Lighthouse Smoke Runner

Usage:
    node scripts/lighthouse-smoke.mjs            # gegen Default-BaseURL
    PHASE9_BASE_URL=https://flowmcp.github.io node scripts/lighthouse-smoke.mjs

Voraussetzungen:
    - npm install -g lighthouse  (CLI muss im PATH sein)
    - Internet (Lighthouse laedt Chrome-Driver einmalig)
    - Fuer Lokal-Modus: npm run build && npx astro preview --port 4321 aktiv

Output:
    proofs/phase-9-verification-2026-05-24/lighthouse/scores.json
    proofs/phase-9-verification-2026-05-24/lighthouse/scores.md
    proofs/phase-9-verification-2026-05-24/lighthouse/<id>.json   (Raw reports)
` )
}


async function main() {
    if( process.argv.includes( '--help' ) || process.argv.includes( '-h' ) ) {
        printHelp()
        process.exit( 0 )
    }

    const reportDir  = path.resolve( process.cwd(), '../../proofs/phase-9-verification-2026-05-24/lighthouse' )
    const outputPath = path.join( reportDir, 'scores.json' )

    const { allPass } = await LighthouseSmokeRunner.run( { reportDir, outputPath } )
    process.exit( allPass ? 0 : 1 )
}


main()
