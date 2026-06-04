// generate-best-practices-txt.mjs — Memo 108 PRD-2.3
//
// Concatenates the synced best-practice payload into a single published file
// public/best-practices.txt. This is the file attached to every schema-building
// subagent prompt as a mandatory source (source-first institutionalisation).
//
// Source: public/spec-generated/docs-payload/best-practice/<NN>-<slug>.md
//         (written by sync-spec.mjs from flowmcp-spec/generated/docs-payload/best-practice/)
// Order:  src/data/manifest.json -> bestPractice.files (by .order)
//
// Strict-Mode — no silent defaults. If the manifest carries a bestPractice block
// whose referenced payload file is missing, the build fails loudly. When no
// bestPractice block exists yet, the step is a graceful no-op (mirrors grading).

import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'


const __dirname = path.dirname( fileURLToPath( import.meta.url ) )
const REPO_ROOT = path.resolve( __dirname, '..' )

const MANIFEST_PATH = path.resolve( REPO_ROOT, 'src', 'data', 'manifest.json' )
const PAYLOAD_DIR = path.resolve( REPO_ROOT, 'public', 'spec-generated', 'docs-payload', 'best-practice' )
const OUTPUT_PATH = path.resolve( REPO_ROOT, 'public', 'best-practices.txt' )


const stripFrontmatter = ( { content } ) => {
    const match = content.match( /^---\n[\s\S]*?\n---\n?/ )
    if( !match ) {
        return content.trim()
    }
    return content.slice( match[ 0 ].length ).trim()
}


const buildHeader = ( { version } ) => {
    const versionLine = version ? `bestPracticeSpec/${ version }` : 'bestPracticeSpec'
    return `# FlowMCP — Schema Best Practices (${ versionLine })

> Advisory, not normative ("you should, not you must"). Read this BEFORE building a
> schema. Every recommendation is backed by a real code reference (file:line) or a
> memo. The normative rules live in the Schemas Specification and the Grading-Spec.

Source: https://flowmcp.github.io/best-practice/overview/
`
}


const main = async () => {
    if( !existsSync( MANIFEST_PATH ) ) {
        throw new Error( `[best-practices-txt] manifest missing at ${ MANIFEST_PATH } — run "npm run sync-spec" first` )
    }
    const manifest = JSON.parse( await readFile( MANIFEST_PATH, 'utf-8' ) )

    if( !manifest.bestPractice || !Array.isArray( manifest.bestPractice.files ) || manifest.bestPractice.files.length === 0 ) {
        console.warn( '[best-practices-txt] no bestPractice block in manifest — skipping (no-op)' )
        return
    }

    const ordered = [ ...manifest.bestPractice.files ].sort( ( a, b ) => a.order - b.order )

    const sections = await Promise.all( ordered.map( async ( fileEntry ) => {
        const srcPath = path.join( PAYLOAD_DIR, fileEntry.filename )
        if( !existsSync( srcPath ) ) {
            throw new Error( `[best-practices-txt] manifest references missing payload file: best-practice/${ fileEntry.filename }` )
        }
        const content = await readFile( srcPath, 'utf-8' )
        const body = stripFrontmatter( { content } )
        return `---\n\n# ${ fileEntry.title }\n/best-practice/${ fileEntry.slug }/\n\n${ body }`
    } ) )

    const header = buildHeader( { version: manifest.bestPractice.version } )
    const output = header + '\n' + sections.join( '\n\n' ) + '\n'

    await writeFile( OUTPUT_PATH, output, 'utf-8' )
    console.log( `[best-practices-txt] wrote ${ OUTPUT_PATH } (${ ordered.length } pages, ${ output.length } chars)` )
}


main()
    .catch( ( error ) => {
        console.error( `[best-practices-txt] ERROR: ${ error.message }` )
        process.exit( 1 )
    } )
