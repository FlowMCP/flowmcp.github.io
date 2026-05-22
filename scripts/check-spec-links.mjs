// PRD-02 (Memo 052): Cross-Link-Validierung fuer Doku-Payload.
// Parsed alle Markdown-Files in public/spec-generated/docs-payload/,
// extrahiert relative Markdown-Links (./xxx.md) und prueft Existenz
// der Ziel-Files. Bei BROKEN-Link: Exit-Code 1 inkl. Datei + Zeile.
//
// CI ruft check:spec-links vor astro build auf (siehe package.json).

import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'


const __dirname = path.dirname( fileURLToPath( import.meta.url ) )
const PAYLOAD_DIR = path.resolve( __dirname, '..', 'public', 'spec-generated', 'docs-payload' )
const LINK_REGEX = /\[([^\]]+)\]\((\.\/[^)\s#]+\.md)(?:#[^)]*)?\)/g


class SpecLinkChecker {
    static async run() {
        const files = await SpecLinkChecker.#collectFiles()
        console.log( `Checking ${files.length} payload files for broken cross-links...` )

        const results = await Promise.all( files.map( async ( filename ) => {
            const broken = await SpecLinkChecker.#checkFile( { filename, knownFiles: files } )
            return { filename, broken }
        } ) )

        const withBroken = results.filter( ( r ) => r.broken.length > 0 )

        if( withBroken.length === 0 ) {
            console.log( 'All cross-links resolve correctly.' )
            process.exit( 0 )
        }

        console.error( 'BROKEN cross-links detected:' )
        withBroken.forEach( ( r ) => {
            r.broken.forEach( ( b ) => {
                console.error( `  ${r.filename}:${b.line}  [${b.text}] -> ${b.target}` )
            } )
        } )
        process.exit( 1 )
    }


    static async #collectFiles() {
        const entries = await readdir( PAYLOAD_DIR )
        const filtered = entries
            .filter( ( name ) => name.endsWith( '.md' ) )
            .filter( ( name ) => name !== 'README.md' )
        return filtered
    }


    static async #checkFile( { filename, knownFiles } ) {
        const filePath = path.join( PAYLOAD_DIR, filename )
        const content = await readFile( filePath, 'utf-8' )
        const lines = content.split( '\n' )
        const broken = []

        lines.forEach( ( line, idx ) => {
            const matches = [ ...line.matchAll( LINK_REGEX ) ]
            matches.forEach( ( match ) => {
                const linkText = match[ 1 ]
                const linkTarget = match[ 2 ].replace( /^\.\//, '' )
                const exists = knownFiles.includes( linkTarget )
                if( !exists ) {
                    broken.push( {
                        line: idx + 1,
                        text: linkText,
                        target: linkTarget
                    } )
                }
            } )
        } )

        return broken
    }
}


SpecLinkChecker
    .run()
    .catch( ( err ) => {
        console.error( 'check-spec-links failed:', err.message )
        process.exit( 1 )
    } )
