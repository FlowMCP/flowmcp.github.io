#!/usr/bin/env node
// verify-blog-urls.mjs — Memo 057 PRD-11
// Verifies that blog URLs are stable across the docs->standalone migration.
// Usage: node scripts/verify-blog-urls.mjs [--baseline <file>] [--save-baseline]

import { readdir, stat, writeFile, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

const DIST_BLOG = 'dist/blog'
const BASELINE = 'proofs/blog-urls-baseline.txt'


async function listBlogUrls() {
    const found = []
    async function walk( dir ) {
        const entries = await readdir( dir )
        for ( const entry of entries ) {
            const full = join( dir, entry )
            const s = await stat( full )
            if ( s.isDirectory() ) {
                await walk( full )
            } else if ( entry === 'index.html' ) {
                found.push( full.replace( /^dist/, '' ).replace( /\/index\.html$/, '/' ) )
            }
        }
    }
    if ( !existsSync( DIST_BLOG ) ) {
        console.error( `${DIST_BLOG} not found — run npm run build first` )
        process.exit( 1 )
    }
    await walk( DIST_BLOG )
    return found.sort()
}


async function main() {
    const args = process.argv.slice( 2 )
    const saveBaseline = args.includes( '--save-baseline' )
    const baselineIdx = args.indexOf( '--baseline' )
    const baselineFile = baselineIdx >= 0 ? args[ baselineIdx + 1 ] : BASELINE

    const urls = await listBlogUrls()

    if ( saveBaseline ) {
        await writeFile( baselineFile, urls.join( '\n' ) + '\n' )
        console.log( `Baseline saved to ${baselineFile} — ${urls.length} URLs` )
        return
    }

    if ( !existsSync( baselineFile ) ) {
        console.log( `No baseline at ${baselineFile} — run with --save-baseline first` )
        console.log( `Current URLs (${urls.length}):` )
        urls.forEach( ( u ) => console.log( `  ${u}` ) )
        return
    }

    const baseline = ( await readFile( baselineFile, 'utf8' ) )
        .split( '\n' )
        .map( ( l ) => l.trim() )
        .filter( Boolean )
        .sort()

    const missing = baseline.filter( ( u ) => !urls.includes( u ) )
    const added = urls.filter( ( u ) => !baseline.includes( u ) )

    if ( missing.length === 0 && added.length === 0 ) {
        console.log( `PASS — ${urls.length} blog URLs match baseline` )
        process.exit( 0 )
    }

    console.log( 'FAIL — URL drift detected:' )
    if ( missing.length > 0 ) {
        console.log( `  ${missing.length} missing (baseline -> current):` )
        missing.forEach( ( u ) => console.log( `    - ${u}` ) )
    }
    if ( added.length > 0 ) {
        console.log( `  ${added.length} added (not in baseline):` )
        added.forEach( ( u ) => console.log( `    + ${u}` ) )
    }
    process.exit( 1 )
}


main().catch( ( err ) => {
    console.error( err )
    process.exit( 1 )
} )
