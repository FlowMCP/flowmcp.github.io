// PRD-01 + PRD-03 (Memo 052): Sync der Doku-Payload-Schnittstelle.
// Source: ../flowmcp-spec/generated/docs-payload/ (lokales Spec-Repo)
// Targets:
//   1. public/spec-generated/docs-payload/   — Raw-Mirror fuer Build-Pruefungen
//   2. src/content/docs/specification/        — Starlight-Content-Collection
//
// Validierung (PRD-03):
//   - Hash-Match (sofern manifest.files[].hash_sha256 vorhanden)
//   - Pflicht-Frontmatter-Check (11 Felder)
//   - EditWarning-HTML-Block am Top jeder Auto-Gen-Spec-Seite

import { mkdir, writeFile, rm, readFile, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'


const __dirname = path.dirname( fileURLToPath( import.meta.url ) )
const REPO_ROOT = path.resolve( __dirname, '..' )

const SPEC_REPO_PAYLOAD = path.resolve( REPO_ROOT, '..', 'flowmcp-spec', 'generated', 'docs-payload' )
const PUBLIC_PAYLOAD_DIR = path.resolve( REPO_ROOT, 'public', 'spec-generated', 'docs-payload' )
const CONTENT_SPEC_DIR = path.resolve( REPO_ROOT, 'src', 'content', 'docs', 'specification' )

const REQUIRED_FRONTMATTER = [
    'title', 'description', 'spec_version', 'spec_file', 'order',
    'section', 'normative', 'generated_at', 'generated_from',
    'generator', 'edit_warning'
]


// Memo 055 R5 / Memo 056 PRD-17: Legacy-Files werden NICHT ins Docs-Repo synct.
// Konfiguration als Konstante — kein implizites Filtern, kein Silent-Default.
const LEGACY_FILES = [ 'route-tests.md' ]

const DATA_DIR = path.resolve( REPO_ROOT, 'src', 'data' )
const DATA_MANIFEST = path.join( DATA_DIR, 'manifest.json' )


class SpecSync {
    static async run() {
        SpecSync.#assertSource()

        const manifest = await SpecSync.#loadManifest()
        const payloadFiles = await SpecSync.#listPayloadFiles()

        const stats = {
            totalManifest: manifest.files.length,
            totalPayload: payloadFiles.length,
            syncedPublic: 0,
            syncedContent: 0,
            hashChecked: 0,
            hashSkipped: 0,
            frontmatterChecked: 0,
            legacyFiltered: 0
        }

        await SpecSync.#prepareTargetDirs()

        const tasks = manifest.files.map( async ( fileEntry ) => {
            if( LEGACY_FILES.includes( fileEntry.filename ) ) {
                stats.legacyFiltered += 1
                return
            }

            const srcPath = path.join( SPEC_REPO_PAYLOAD, fileEntry.filename )
            if( !existsSync( srcPath ) ) {
                throw new Error( `Manifest references missing payload file: ${fileEntry.filename}` )
            }

            const content = await readFile( srcPath, 'utf-8' )

            SpecSync.#validateHash( { fileEntry, content, stats } )
            SpecSync.#validateFrontmatter( { fileEntry, content, stats } )

            await writeFile(
                path.join( PUBLIC_PAYLOAD_DIR, fileEntry.filename ),
                content,
                'utf-8'
            )
            stats.syncedPublic += 1

            const contentWithWarning = SpecSync.#injectEditWarning( { content, fileEntry } )
            const contentDst = path.join( CONTENT_SPEC_DIR, `${ fileEntry.slug }.md` )
            await writeFile( contentDst, contentWithWarning, 'utf-8' )
            stats.syncedContent += 1
        } )

        await Promise.all( tasks )

        await writeFile(
            path.join( PUBLIC_PAYLOAD_DIR, 'manifest.json' ),
            JSON.stringify( manifest, null, 2 ) + '\n',
            'utf-8'
        )

        // PRD-16: Sidebar-Loader liest aus src/data/manifest.json
        await mkdir( DATA_DIR, { recursive: true } )
        await writeFile(
            DATA_MANIFEST,
            JSON.stringify( manifest, null, 2 ) + '\n',
            'utf-8'
        )

        SpecSync.#printSummary( { stats } )
        return { stats }
    }


    static #assertSource() {
        if( !existsSync( SPEC_REPO_PAYLOAD ) ) {
            throw new Error(
                `Spec-Payload source missing: ${SPEC_REPO_PAYLOAD}\n` +
                `Memo 49 Phase 4 muss abgeschlossen sein.`
            )
        }
        const manifestPath = path.join( SPEC_REPO_PAYLOAD, 'manifest.json' )
        if( !existsSync( manifestPath ) ) {
            throw new Error( `manifest.json fehlt unter ${SPEC_REPO_PAYLOAD}` )
        }
    }


    static async #loadManifest() {
        const manifestPath = path.join( SPEC_REPO_PAYLOAD, 'manifest.json' )
        const raw = await readFile( manifestPath, 'utf-8' )
        const manifest = JSON.parse( raw )
        if( !Array.isArray( manifest.files ) ) {
            throw new Error( 'manifest.files ist kein Array' )
        }
        return manifest
    }


    static async #listPayloadFiles() {
        const entries = await readdir( SPEC_REPO_PAYLOAD )
        const md = entries.filter( ( name ) => name.endsWith( '.md' ) && name !== 'README.md' )
        return md
    }


    static async #prepareTargetDirs() {
        await mkdir( PUBLIC_PAYLOAD_DIR, { recursive: true } )
        await mkdir( CONTENT_SPEC_DIR, { recursive: true } )
    }


    static #validateHash( { fileEntry, content, stats } ) {
        if( !fileEntry.hash_sha256 ) {
            stats.hashSkipped += 1
            return
        }
        const digest = createHash( 'sha256' ).update( content ).digest( 'hex' )
        if( digest !== fileEntry.hash_sha256 ) {
            throw new Error(
                `Hash mismatch for ${fileEntry.filename}: ` +
                `expected ${fileEntry.hash_sha256}, got ${digest}`
            )
        }
        stats.hashChecked += 1
    }


    static #validateFrontmatter( { fileEntry, content, stats } ) {
        const match = content.match( /^---\n([\s\S]*?)\n---/ )
        if( !match ) {
            throw new Error( `${fileEntry.filename}: no frontmatter block found` )
        }
        const lines = match[ 1 ].split( '\n' )
        const fm = {}
        lines.forEach( ( line ) => {
            const sep = line.indexOf( ':' )
            if( sep === -1 ) { return }
            const key = line.slice( 0, sep ).trim()
            fm[ key ] = true
        } )
        const missing = REQUIRED_FRONTMATTER.filter( ( key ) => !( key in fm ) )
        if( missing.length > 0 ) {
            throw new Error(
                `${fileEntry.filename}: missing required frontmatter fields: ${missing.join( ', ' )}`
            )
        }
        stats.frontmatterChecked += 1
    }


    static #injectEditWarning( { content, fileEntry } ) {
        const fmMatch = content.match( /^---\n([\s\S]*?)\n---\n?/ )
        if( !fmMatch ) {
            return content
        }
        const fmBlock = fmMatch[ 0 ]
        const body = content.slice( fmBlock.length )

        const warning = fileEntry.edit_warning
            ? fileEntry.edit_warning
            : SpecSync.#extractWarningFromBody( { fmBlockBody: fmMatch[ 1 ] } )
        const warningText = warning
            ? warning
            : `This file is auto-generated from flowmcp-spec. Do not edit directly.`

        const aside = `<aside class="edit-warning" role="note">\n` +
            `  <strong>Auto-generated:</strong> ${SpecSync.#escapeHtml( warningText )}\n` +
            `</aside>\n\n`

        return `${fmBlock}${aside}${body.replace( /^\n+/, '' )}`
    }


    static #extractWarningFromBody( { fmBlockBody } ) {
        const match = fmBlockBody.match( /^edit_warning:\s*"?([^"\n]+)"?\s*$/m )
        return match ? match[ 1 ].trim() : ''
    }


    static #escapeHtml( str ) {
        return str
            .replace( /&/g, '&amp;' )
            .replace( /</g, '&lt;' )
            .replace( />/g, '&gt;' )
            .replace( /"/g, '&quot;' )
    }


    static #printSummary( { stats } ) {
        console.log( '' )
        console.log( 'Spec-Sync abgeschlossen' )
        console.log( `  Source:            ${SPEC_REPO_PAYLOAD}` )
        console.log( `  Manifest entries:  ${stats.totalManifest}` )
        console.log( `  Payload files:     ${stats.totalPayload}` )
        console.log( `  Public mirror:     ${stats.syncedPublic} -> ${PUBLIC_PAYLOAD_DIR}` )
        console.log( `  Content collection: ${stats.syncedContent} -> ${CONTENT_SPEC_DIR}` )
        console.log( `  Frontmatter checks: ${stats.frontmatterChecked} OK` )
        if( stats.hashChecked > 0 ) {
            console.log( `  Hash matches:      ${stats.hashChecked} OK` )
        }
        if( stats.hashSkipped > 0 ) {
            console.log( `  Hash skipped:      ${stats.hashSkipped} (no hash_sha256 in manifest)` )
        }
    }
}


SpecSync
    .run()
    .then( () => process.exit( 0 ) )
    .catch( ( err ) => {
        console.error( 'Sync failed:', err.message )
        process.exit( 1 )
    } )
