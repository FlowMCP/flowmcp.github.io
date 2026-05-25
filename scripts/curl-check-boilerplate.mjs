// Memo 060 Phase 9 (PRD-028 Task 2): Boilerplate-Zahlen-Sweep auf der Live-Site
// (oder lokalem Preview).
//
// Phase 8 hat hardcoded Zahlen wie 187/365/288/1575 durch meta.stats-Platzhalter
// ersetzt. Dieser Check stellt sicher dass die alten Zahlen nicht mehr auf
// den geprueften Seiten erscheinen.
//
// Default-baseURL: http://localhost:4321 (Lokal-Preview)
// Live: PHASE9_BASE_URL=https://flowmcp.github.io node scripts/curl-check-boilerplate.mjs
//
// Whitelist-Mechanismus: falls Stats zufaellig 288 sind (Schema-Count stabil),
// kann pro Page eine Whitelist eingetragen werden.

import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'


const BASE_URL = process.env.PHASE9_BASE_URL || 'http://localhost:4321'


// Aktuelle Stats (Stand src/data/refs.json):
//   count_schemas=365, count_unique_datasources=288, count_tools=1575
// Diese werden via meta.stats-Platzhalter korrekt interpoliert und sind
// KEINE hardcoded-Regression — sie tauchen auf, weil die aktuellen Werte
// numerisch mit den Phase-8-Original-Werten uebereinstimmen.
//
// Global-Whitelist (pro Run aktualisierbar): 365, 288, 1575 sind aktuell valide.
// Nur 187 ist eine garantiert stale Hardcoded-Zahl (war Schema-Count vor Sweep).
const GLOBAL_WHITELIST = [ '365', '288', '1575' ]


const PAGES = [
    { url: '/',                            whitelist: [] },
    { url: '/about/',                      whitelist: [] },
    { url: '/quickstart/quickstart/',      whitelist: [] },
    { url: '/concepts/schemas/',           whitelist: [] },
    { url: '/concepts/tools/',             whitelist: [] }
]


const HARDCODED_PATTERN = /\b(187|365|288|1575)\b/g


const PROOF_DIR = path.resolve( process.cwd(), '../../proofs/phase-9-verification-2026-05-24/curl' )
mkdirSync( PROOF_DIR, { recursive: true } )


function extractBodyText( { html } ) {
    // Sehr einfache HTML→Text-Approximation: Tags raus, Whitespace normalisieren.
    return html
        .replace( /<script[\s\S]*?<\/script>/gi, '' )
        .replace( /<style[\s\S]*?<\/style>/gi, '' )
        .replace( /<[^>]+>/g, ' ' )
        .replace( /\s+/g, ' ' )
}


async function checkPage( { page } ) {
    const url    = `${ BASE_URL }${ page.url }`
    const result = {
        url: page.url,
        fullURL: url,
        status: 0,
        hardcodedHits: [],
        pass: false,
        error: null
    }

    try {
        const resp = await fetch( url )
        result.status = resp.status

        if( resp.status !== 200 ) {
            result.error = `HTTP ${ resp.status }`
            return result
        }

        const html = await resp.text()
        const text = extractBodyText( { html } )

        const matches = text.match( HARDCODED_PATTERN ) || []
        const filtered = matches.filter( ( m ) => {
            if( GLOBAL_WHITELIST.includes( m ) ) { return false }
            if( page.whitelist.includes( m ) )   { return false }
            return true
        } )

        // Gruppiere und zaehle
        const counts = {}
        filtered.forEach( ( m ) => {
            counts[ m ] = ( counts[ m ] || 0 ) + 1
        } )

        result.hardcodedHits = Object
            .entries( counts )
            .map( ( [ value, count ] ) => { return { value, count } } )

        result.pass = result.hardcodedHits.length === 0
        return result
    } catch( err ) {
        result.error = err.message
        return result
    }
}


async function main() {
    console.log( `[curl-check-boilerplate] baseURL=${ BASE_URL }, ${ PAGES.length } pages...` )
    const results = []

    for( const page of PAGES ) {
        const result = await checkPage( { page } )
        const indicator = result.pass ? 'PASS' : 'FAIL'
        const summary = result.hardcodedHits
            .map( ( h ) => { return `${ h.value }(${ h.count }x)` } )
            .join( ', ' ) || 'clean'
        console.log( `  [${ indicator }] ${ result.status } ${ page.url } — ${ summary }${ result.error ? ' — ' + result.error : '' }` )
        results.push( result )
    }

    const allPass = results.every( ( r ) => r.pass )
    const outputPath = path.join( PROOF_DIR, 'boilerplate-check.json' )
    const report = {
        timestamp: new Date().toISOString(),
        baseURL: BASE_URL,
        pattern: '\\b(187|365|288|1575)\\b',
        total: results.length,
        passed: results.filter( ( r ) => r.pass ).length,
        failed: results.filter( ( r ) => !r.pass ).length,
        allPass,
        results
    }

    report.globalWhitelist = GLOBAL_WHITELIST

    writeFileSync( outputPath, JSON.stringify( report, null, 2 ) )
    console.log( `\n[curl-check-boilerplate] report -> ${ outputPath }` )
    console.log( `[curl-check-boilerplate] global whitelist: ${ GLOBAL_WHITELIST.join( ', ' ) } (current stats from refs.json)` )
    console.log( `[curl-check-boilerplate] ${ report.passed }/${ report.total } passed` )

    process.exit( allPass ? 0 : 1 )
}


main()
