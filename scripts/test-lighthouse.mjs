// PRD-35: Lighthouse Score Wrapper (Memo 052 Phase 9)
// Wrapper um die Lighthouse-CLI. Misst Performance, A11y, Best-Practices, SEO
// fuer 5 Hauptseiten und schreibt Tabellen-Report.
//
// Voraussetzung:
//   1. npm install -g lighthouse
//   2. In separatem Terminal: npm run preview (Astro Preview Server auf :4321)
//
// Ausfuehrung:
//   node scripts/test-lighthouse.mjs           # ausfuehren
//   node scripts/test-lighthouse.mjs --help    # Hilfe anzeigen

import { spawn } from 'node:child_process'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'


class LighthouseTester {
    static #BASE_URL = 'http://localhost:4321'

    static #PAGES = [
        { id: 'landing', url: '/', label: 'Landing (`/`)' },
        { id: 'quickstart', url: '/quickstart/quickstart/', label: 'Quickstart' },
        { id: 'concepts-agents', url: '/concepts/agents/', label: 'Concepts/Agents (PNGs)' },
        { id: 'specification', url: '/specification/overview/', label: 'Specification' },
        { id: 'decision-makers', url: '/about/for-decision-makers/', label: 'Decision-Makers' }
    ]

    static #THRESHOLDS = {
        performance: 90,
        accessibility: 95,
        'best-practices': 95,
        seo: 90
    }


    static async run( { reportDir, outputPath, dryRun } ) {
        if( dryRun === true ) {
            LighthouseTester.#printHelp()
            await LighthouseTester.#writeEmptyReport( { outputPath } )
            return { results: [] }
        }

        await mkdir( reportDir, { recursive: true } )
        await LighthouseTester.#assertLighthouseInstalled()
        await LighthouseTester.#assertPreviewReachable()

        const results = await LighthouseTester.#runAll( { reportDir } )
        await LighthouseTester.#writeReport( { results, outputPath } )

        return { results }
    }


    static #printHelp() {
        const lines = [
            'Lighthouse Score Tester (Memo 052 PRD-35)',
            '',
            'Usage:',
            '  node scripts/test-lighthouse.mjs            Run audit for 5 pages',
            '  node scripts/test-lighthouse.mjs --help     Show this help',
            '',
            'Prerequisites:',
            '  1. npm install -g lighthouse',
            '  2. Start preview server in another terminal:',
            '       npm run preview',
            '  3. Confirm http://localhost:4321 is reachable',
            '',
            'Test pages:'
        ]
        lines.forEach( ( l ) => console.log( l ) )
        LighthouseTester.#PAGES.forEach( ( p ) => console.log( `  - ${ LighthouseTester.#BASE_URL }${ p.url }` ) )
        console.log( '' )
        console.log( 'Thresholds:' )
        Object
            .entries( LighthouseTester.#THRESHOLDS )
            .forEach( ( [ key, val ] ) => console.log( `  - ${ key }: > ${ val }` ) )
    }


    static async #assertLighthouseInstalled() {
        const ok = await LighthouseTester.#runShell( { cmd: 'lighthouse', args: [ '--version' ] } )
        if( !ok.success ) {
            throw new Error( 'Lighthouse CLI not found. Install with: npm install -g lighthouse' )
        }
    }


    static async #assertPreviewReachable() {
        try {
            const res = await fetch( LighthouseTester.#BASE_URL )
            if( res.status >= 200 && res.status < 500 ) { return }
            throw new Error( `Preview returned HTTP ${ res.status }` )
        } catch( error ) {
            throw new Error( `Preview server not reachable at ${ LighthouseTester.#BASE_URL }. Run 'npm run preview' first.` )
        }
    }


    static async #runAll( { reportDir } ) {
        const results = []

        await LighthouseTester.#PAGES.reduce( async ( prev, page ) => {
            await prev
            const result = await LighthouseTester.#runOne( { page, reportDir } )
            results.push( result )
        }, Promise.resolve() )

        return results
    }


    static async #runOne( { page, reportDir } ) {
        const outputJson = join( reportDir, `${ page.id }.json` )
        const args = [
            `${ LighthouseTester.#BASE_URL }${ page.url }`,
            '--output=json',
            `--output-path=${ outputJson }`,
            '--chrome-flags=--headless --no-sandbox',
            '--quiet'
        ]

        console.log( `Running lighthouse for ${ page.url } ...` )
        const exec = await LighthouseTester.#runShell( { cmd: 'lighthouse', args } )
        if( !exec.success ) {
            return { page, scores: null, error: exec.error }
        }

        const json = JSON.parse( await readFile( outputJson, 'utf-8' ) )
        const categories = json.categories
        const scores = {
            performance: Math.round( categories.performance.score * 100 ),
            accessibility: Math.round( categories.accessibility.score * 100 ),
            'best-practices': Math.round( categories[ 'best-practices' ].score * 100 ),
            seo: Math.round( categories.seo.score * 100 )
        }

        return { page, scores, error: null }
    }


    static #runShell( { cmd, args } ) {
        return new Promise( ( resolve ) => {
            const proc = spawn( cmd, args, { stdio: [ 'ignore', 'pipe', 'pipe' ] } )
            let stderr = ''
            proc.stderr.on( 'data', ( chunk ) => { stderr += chunk.toString() } )
            proc.on( 'error', ( error ) => resolve( { success: false, error: error.message } ) )
            proc.on( 'close', ( code ) => {
                if( code === 0 ) { resolve( { success: true } ); return }
                resolve( { success: false, error: stderr || `exit ${ code }` } )
            } )
        } )
    }


    static async #writeReport( { results, outputPath } ) {
        const evaluation = results
            .map( ( r ) => {
                if( r.scores === null ) {
                    return { ...r, status: 'ERROR' }
                }
                const passed = Object
                    .entries( LighthouseTester.#THRESHOLDS )
                    .every( ( [ key, threshold ] ) => r.scores[ key ] > threshold )
                return { ...r, status: passed ? 'PASS' : 'FAIL' }
            } )

        const passCount = evaluation.filter( ( e ) => e.status === 'PASS' ).length
        const total = evaluation.length

        const header = `# Lighthouse-Scores Memo 052 — Ergebnisse\n\n` +
            `**Generated**: ${ new Date().toISOString() }\n\n` +
            `## Zusammenfassung\n\n` +
            `| Metrik | Wert |\n` +
            `|--------|------|\n` +
            `| Geprueft | ${ total } |\n` +
            `| PASS | ${ passCount } |\n` +
            `| FAIL | ${ total - passCount } |\n` +
            `| Status | ${ passCount === total ? 'PASS' : 'FAIL' } |\n\n` +
            `## Schwellen\n\n` +
            `| Metrik | Schwelle |\n` +
            `|--------|----------|\n`

        const thresholdRows = Object
            .entries( LighthouseTester.#THRESHOLDS )
            .map( ( [ key, val ] ) => `| ${ key } | > ${ val } |` )
            .join( '\n' )

        const tableHeader = `\n\n## Scores\n\n` +
            `| Seite | Performance | A11y | Best-Practices | SEO | Status |\n` +
            `|-------|:-----------:|:----:|:--------------:|:---:|:------:|\n`

        const tableRows = evaluation
            .map( ( e ) => {
                if( e.scores === null ) {
                    return `| ${ e.page.label } | — | — | — | — | ERROR (${ e.error || 'unknown' }) |`
                }
                return `| ${ e.page.label } | ${ e.scores.performance } | ${ e.scores.accessibility } | ${ e.scores[ 'best-practices' ] } | ${ e.scores.seo } | ${ e.status } |`
            } )
            .join( '\n' )

        const body = header + thresholdRows + tableHeader + tableRows + '\n'
        await mkdir( dirname( outputPath ), { recursive: true } )
        await writeFile( outputPath, body )
        console.log( `Report written to ${ outputPath }` )
    }


    static async #writeEmptyReport( { outputPath } ) {
        const empty = `# Lighthouse-Scores Memo 052 — Ergebnisse\n\n` +
            `**Status**: NOT RUN (Lighthouse CLI nicht ausgefuehrt)\n\n` +
            `## Anleitung\n\n` +
            `Lighthouse benoetigt eine separate Installation und einen laufenden Preview-Server.\n\n` +
            `### 1. Lighthouse CLI installieren\n\n` +
            '```bash\nnpm install -g lighthouse\nlighthouse --version\n```\n\n' +
            `### 2. Preview-Server starten (in separatem Terminal)\n\n` +
            '```bash\ncd repos/flowmcp.github.io\nnpm run build\nnpm run preview\n```\n\n' +
            `### 3. Audit ausfuehren\n\n` +
            '```bash\nnpm run test:lighthouse\n```\n\n' +
            `### Test-Seiten\n\n` +
            `| # | URL |\n|---|-----|\n` +
            LighthouseTester.#PAGES.map( ( p, i ) => `| ${ i + 1 } | ${ LighthouseTester.#BASE_URL }${ p.url } |` ).join( '\n' ) + '\n\n' +
            `### Schwellen\n\n` +
            `| Metrik | Schwelle |\n|--------|----------|\n` +
            Object.entries( LighthouseTester.#THRESHOLDS ).map( ( [ k, v ] ) => `| ${ k } | > ${ v } |` ).join( '\n' ) + '\n\n' +
            `## Ergebnis-Tabelle (wird vom Skript gefuellt)\n\n` +
            `| Seite | Performance | A11y | Best-Practices | SEO | Status |\n` +
            `|-------|:-----------:|:----:|:--------------:|:---:|:------:|\n` +
            LighthouseTester.#PAGES.map( ( p ) => `| ${ p.label } | — | — | — | — | — |` ).join( '\n' ) + '\n'

        await mkdir( dirname( outputPath ), { recursive: true } )
        await writeFile( outputPath, empty )
        console.log( `Documentation report written to ${ outputPath }` )
    }
}


const __filename = fileURLToPath( import.meta.url )
const __dirname = dirname( __filename )
const repoRoot = join( __dirname, '..' )
const reportDir = join( repoRoot, '..', '..', 'proofs', 'flowmcp.github.io', 'lighthouse' )
const outputPath = join( repoRoot, '..', '..', 'proofs', 'flowmcp.github.io', 'lighthouse-scores-052.md' )

const args = process.argv.slice( 2 )
const isHelp = args.includes( '--help' ) || args.includes( '-h' )

await LighthouseTester.run( { reportDir, outputPath, dryRun: isHelp } )
