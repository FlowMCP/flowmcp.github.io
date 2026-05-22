import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'
import path from 'node:path'

const execFileAsync = promisify( execFile )


class AutogenSyncTest {
    static async run( { repoRoot, manifestPath, reportPath, syncPayloadDir } ) {
        const manifestRaw = await readFile( manifestPath, 'utf-8' )
        const manifest = JSON.parse( manifestRaw )

        const syncAvailable = existsSync( syncPayloadDir )
        const pre = await AutogenSyncTest.snapshot( { repoRoot, manifest } )

        if( !syncAvailable ) {
            const verdict = {
                pass: true,
                deferred: true,
                issues: [],
                note: `Memo 49 Phase 4 noch nicht abgeschlossen — ${syncPayloadDir} fehlt. Test deferred.`
            }
            await AutogenSyncTest.writeReport( { reportPath, pre, post: null, verdict } )
            console.log( `Auto-Gen-Sync-Test DEFERRED — ${verdict.note}` )
            return { verdict }
        }

        await AutogenSyncTest.runSync( { repoRoot } )
        const post = await AutogenSyncTest.snapshot( { repoRoot, manifest } )
        const verdict = AutogenSyncTest.compare( { pre, post } )
        await AutogenSyncTest.writeReport( { reportPath, pre, post, verdict } )

        if( verdict.pass ) {
            console.log( 'Auto-Gen-Sync-Test PASSED' )
        } else {
            console.error( 'Auto-Gen-Sync-Test FAILED' )
            verdict.issues.forEach( ( i ) => console.error( ` - ${i}` ) )
        }
        return { verdict }
    }


    static async snapshot( { repoRoot, manifest } ) {
        const pageTasks = manifest.protectedPages.map( async ( entry ) => {
            const mdPath = path.join( repoRoot, entry.markdown )
            const mdContent = await readFile( mdPath, 'utf-8' )

            const references = entry.pngs.map( ( png ) => {
                const foundInMarkdown = mdContent.includes( png.ref )
                return { png: png.file, ref: png.ref, foundInMarkdown }
            } )

            const hashTasks = entry.pngs.map( async ( png ) => {
                const pngPath = path.join( repoRoot, png.file )
                if( !existsSync( pngPath ) ) {
                    return { png: png.file, sha256: null, missing: true }
                }
                const buf = await readFile( pngPath )
                const hash = createHash( 'sha256' ).update( buf ).digest( 'hex' )
                return { png: png.file, sha256: hash, missing: false }
            } )
            const hashes = await Promise.all( hashTasks )

            return { markdown: entry.markdown, references, hashes }
        } )

        const pages = await Promise.all( pageTasks )
        return { takenAt: new Date().toISOString(), pages }
    }


    static async runSync( { repoRoot } ) {
        await execFileAsync( 'npm', [ 'run', 'sync-spec' ], { cwd: repoRoot } )
    }


    static compare( { pre, post } ) {
        const issues = []

        pre.pages.forEach( ( prePage, idx ) => {
            const postPage = post.pages[ idx ]

            prePage.hashes.forEach( ( preHash, hIdx ) => {
                const postHash = postPage.hashes[ hIdx ]
                if( preHash.missing || postHash.missing ) {
                    issues.push( `PNG fehlt: ${preHash.png} (pre.missing=${preHash.missing}, post.missing=${postHash.missing})` )
                    return
                }
                if( preHash.sha256 !== postHash.sha256 ) {
                    const a = preHash.sha256.slice( 0, 12 )
                    const b = postHash.sha256.slice( 0, 12 )
                    issues.push( `PNG geaendert: ${preHash.png} (pre=${a} / post=${b})` )
                }
            } )

            prePage.references.forEach( ( preRef, rIdx ) => {
                const postRef = postPage.references[ rIdx ]
                if( preRef.foundInMarkdown !== postRef.foundInMarkdown ) {
                    issues.push( `Markdown-Referenz veraendert: ${prePage.markdown} -> ${preRef.ref} (pre=${preRef.foundInMarkdown}, post=${postRef.foundInMarkdown})` )
                }
            } )
        } )

        return { pass: issues.length === 0, deferred: false, issues }
    }


    static async writeReport( { reportPath, pre, post, verdict } ) {
        await mkdir( path.dirname( reportPath ), { recursive: true } )

        const lines = [
            '# Auto-Gen-Sync-Test 052',
            '',
            `Status: ${verdict.deferred ? 'DEFERRED' : ( verdict.pass ? 'PASS' : 'FAIL' )}`,
            `Pre-Snapshot: ${pre.takenAt}`,
            `Post-Snapshot: ${post === null ? 'n/a (deferred)' : post.takenAt}`,
            ''
        ]

        if( verdict.deferred ) {
            lines.push( '## Hinweis', '', verdict.note, '' )
            lines.push( '## Pre-Snapshot (Hash-Inventar)', '' )
            lines.push( '| PNG | SHA-256 | Markdown-Ref Found |' )
            lines.push( '|-----|---------|--------------------|' )
            pre.pages.forEach( ( page ) => {
                page.hashes.forEach( ( h, idx ) => {
                    const ref = page.references[ idx ]
                    const hashStr = h.missing ? 'MISSING' : h.sha256.slice( 0, 16 )
                    lines.push( `| ${h.png} | ${hashStr} | ${ref.foundInMarkdown ? 'yes' : 'NO'} |` )
                } )
            } )
            await writeFile( reportPath, lines.join( '\n' ) + '\n', 'utf-8' )
            return
        }

        lines.push( '## Hash-Vergleich', '' )
        lines.push( '| PNG | SHA-256 (pre) | SHA-256 (post) | Status |' )
        lines.push( '|-----|---------------|----------------|--------|' )
        pre.pages.forEach( ( prePage, idx ) => {
            const postPage = post.pages[ idx ]
            prePage.hashes.forEach( ( preHash, hIdx ) => {
                const postHash = postPage.hashes[ hIdx ]
                const preStr = preHash.missing ? 'MISSING' : preHash.sha256.slice( 0, 16 )
                const postStr = postHash.missing ? 'MISSING' : postHash.sha256.slice( 0, 16 )
                const same = preStr === postStr && !preHash.missing
                lines.push( `| ${preHash.png} | ${preStr} | ${postStr} | ${same ? 'OK' : 'CHANGED'} |` )
            } )
        } )

        lines.push( '', '## Markdown-Referenzen', '' )
        lines.push( '| Markdown | Ref | Found (pre) | Found (post) |' )
        lines.push( '|----------|-----|-------------|--------------|' )
        pre.pages.forEach( ( prePage, idx ) => {
            const postPage = post.pages[ idx ]
            prePage.references.forEach( ( preRef, rIdx ) => {
                const postRef = postPage.references[ rIdx ]
                lines.push( `| ${prePage.markdown} | ${preRef.ref} | ${preRef.foundInMarkdown ? 'yes' : 'NO'} | ${postRef.foundInMarkdown ? 'yes' : 'NO'} |` )
            } )
        } )

        if( verdict.issues.length > 0 ) {
            lines.push( '', '## Issues', '' )
            verdict.issues.forEach( ( issue ) => lines.push( `- ${issue}` ) )
        }

        await writeFile( reportPath, lines.join( '\n' ) + '\n', 'utf-8' )
    }
}


const repoRoot = path.resolve( path.dirname( new URL( import.meta.url ).pathname ), '..' )
const manifestPath = path.join( repoRoot, 'scripts/data/protected-assets.json' )
const reportPath = path.resolve( repoRoot, '../../proofs/flowmcp.github.io/autogen-sync-test-052.md' )
const syncPayloadDir = path.resolve( repoRoot, '../flowmcp-spec/generated/docs-payload' )

const { verdict } = await AutogenSyncTest.run( { repoRoot, manifestPath, reportPath, syncPayloadDir } )

if( verdict.deferred ) {
    process.exit( 0 )
}
if( !verdict.pass ) {
    process.exit( 1 )
}
process.exit( 0 )
