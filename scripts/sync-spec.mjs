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
const GRADING_PAYLOAD_SRC = path.resolve( SPEC_REPO_PAYLOAD, 'grading' )
// Memo 108: best-practice is the third Starlight nav group, own slug-root.
const BEST_PRACTICE_PAYLOAD_SRC = path.resolve( SPEC_REPO_PAYLOAD, 'best-practice' )
const PUBLIC_PAYLOAD_DIR = path.resolve( REPO_ROOT, 'public', 'spec-generated', 'docs-payload' )
const PUBLIC_GRADING_DIR = path.resolve( PUBLIC_PAYLOAD_DIR, 'grading' )
const PUBLIC_BEST_PRACTICE_DIR = path.resolve( PUBLIC_PAYLOAD_DIR, 'best-practice' )
const CONTENT_SPEC_DIR = path.resolve( REPO_ROOT, 'src', 'content', 'docs', 'specification' )
// Memo 086 PRD-07: grading is a separate Starlight nav group (point 5), own slug-root.
const CONTENT_GRADING_DIR = path.resolve( REPO_ROOT, 'src', 'content', 'docs', 'grading' )
const CONTENT_BEST_PRACTICE_DIR = path.resolve( REPO_ROOT, 'src', 'content', 'docs', 'best-practice' )

const REQUIRED_FRONTMATTER = [
    'title', 'description', 'spec_version', 'spec_file', 'order',
    'section', 'normative', 'generated_at', 'generated_from',
    'generator', 'edit_warning'
]

// Grading payload carries grading_version instead of spec_version (Memo 086 PRD-06).
const REQUIRED_FRONTMATTER_GRADING = [
    'title', 'description', 'grading_version', 'spec_file', 'order',
    'section', 'normative', 'generated_at', 'generated_from',
    'generator', 'edit_warning'
]

// Memo 108: best-practice payload carries best_practice_version instead of spec_version.
const REQUIRED_FRONTMATTER_BEST_PRACTICE = [
    'title', 'description', 'best_practice_version', 'spec_file', 'order',
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
            legacyFiltered: 0,
            syncedGradingPublic: 0,
            syncedGradingContent: 0,
            syncedBestPracticePublic: 0,
            syncedBestPracticeContent: 0
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
            SpecSync.#validateFrontmatter( { fileEntry, content, stats, required: REQUIRED_FRONTMATTER } )

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

        await SpecSync.#syncGrading( { manifest, stats } )
        await SpecSync.#syncBestPractice( { manifest, stats } )

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


    static #validateFrontmatter( { fileEntry, content, stats, required } ) {
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
        const missing = required.filter( ( key ) => !( key in fm ) )
        if( missing.length > 0 ) {
            throw new Error(
                `${fileEntry.filename}: missing required frontmatter fields: ${missing.join( ', ' )}`
            )
        }
        stats.frontmatterChecked += 1
    }


    // Memo 086 PRD-07: sync the grading payload (manifest.grading.files) into its
    // own Starlight content group. Mirrors the spec sync but reads from the
    // grading/ subdir and validates the grading frontmatter shape.
    static async #syncGrading( { manifest, stats } ) {
        if( !manifest.grading || !Array.isArray( manifest.grading.files ) ) {
            return
        }
        if( !existsSync( GRADING_PAYLOAD_SRC ) ) {
            throw new Error( `manifest.grading present but grading payload missing: ${GRADING_PAYLOAD_SRC}` )
        }
        await mkdir( PUBLIC_GRADING_DIR, { recursive: true } )
        await mkdir( CONTENT_GRADING_DIR, { recursive: true } )

        const tasks = manifest.grading.files.map( async ( fileEntry ) => {
            const srcPath = path.join( GRADING_PAYLOAD_SRC, fileEntry.filename )
            if( !existsSync( srcPath ) ) {
                throw new Error( `manifest.grading references missing payload file: grading/${fileEntry.filename}` )
            }
            const content = await readFile( srcPath, 'utf-8' )
            SpecSync.#validateFrontmatter( { fileEntry, content, stats, required: REQUIRED_FRONTMATTER_GRADING } )

            await writeFile( path.join( PUBLIC_GRADING_DIR, fileEntry.filename ), content, 'utf-8' )
            stats.syncedGradingPublic += 1

            const contentWithWarning = SpecSync.#injectEditWarning( { content, fileEntry } )
            await writeFile( path.join( CONTENT_GRADING_DIR, `${ fileEntry.slug }.md` ), contentWithWarning, 'utf-8' )
            stats.syncedGradingContent += 1
        } )

        await Promise.all( tasks )
        console.log( `  Grading group:     ${stats.syncedGradingContent} -> ${CONTENT_GRADING_DIR} (grading_version=${manifest.grading.version})` )
    }


    // Memo 108: sync the best-practice payload (manifest.bestPractice.files) into
    // its own Starlight content group. Mirrors #syncGrading but reads the
    // best-practice/ subdir and validates the best-practice frontmatter shape.
    static async #syncBestPractice( { manifest, stats } ) {
        if( !manifest.bestPractice || !Array.isArray( manifest.bestPractice.files ) ) {
            return
        }
        if( !existsSync( BEST_PRACTICE_PAYLOAD_SRC ) ) {
            throw new Error( `manifest.bestPractice present but best-practice payload missing: ${BEST_PRACTICE_PAYLOAD_SRC}` )
        }
        await mkdir( PUBLIC_BEST_PRACTICE_DIR, { recursive: true } )
        await mkdir( CONTENT_BEST_PRACTICE_DIR, { recursive: true } )

        const tasks = manifest.bestPractice.files.map( async ( fileEntry ) => {
            const srcPath = path.join( BEST_PRACTICE_PAYLOAD_SRC, fileEntry.filename )
            if( !existsSync( srcPath ) ) {
                throw new Error( `manifest.bestPractice references missing payload file: best-practice/${fileEntry.filename}` )
            }
            const content = await readFile( srcPath, 'utf-8' )
            SpecSync.#validateFrontmatter( { fileEntry, content, stats, required: REQUIRED_FRONTMATTER_BEST_PRACTICE } )

            await writeFile( path.join( PUBLIC_BEST_PRACTICE_DIR, fileEntry.filename ), content, 'utf-8' )
            stats.syncedBestPracticePublic += 1

            const contentWithWarning = SpecSync.#injectEditWarning( { content, fileEntry } )
            await writeFile( path.join( CONTENT_BEST_PRACTICE_DIR, `${ fileEntry.slug }.md` ), contentWithWarning, 'utf-8' )
            stats.syncedBestPracticeContent += 1
        } )

        await Promise.all( tasks )
        console.log( `  Best-practice group: ${stats.syncedBestPracticeContent} -> ${CONTENT_BEST_PRACTICE_DIR} (best_practice_version=${manifest.bestPractice.version})` )
    }


    static #injectEditWarning( { content, fileEntry } ) {
        // Memo 142 (AUTOGEN): drop the visible "Auto-generated" aside from every
        // synced page. The edit-warning provenance is retained in the frontmatter
        // (`edit_warning:` / `generated_from:`) and the public mirror copy; the
        // reader-facing boilerplate is removed. Returning content unchanged keeps
        // the content collection byte-identical to the public mirror.
        return content
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
