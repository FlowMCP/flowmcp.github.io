// PRD-36: External Link Checker (Memo 052 Phase 9)
// Liest alle .md/.mdx-Dateien in src/content/docs/, extrahiert externe Links
// via Regex und prueft jeden Link via HTTP HEAD (Timeout 10s).
// Whitelist: bekannte FlowMCP-Quellen werden ohne Request als OK markiert.
// Output: proofs/flowmcp.github.io/link-check-052.md

import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises'
import { join, extname, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'


class ExternalLinkChecker {
    static #WHITELIST = [
        'github.com/FlowMCP',
        'agentprobe.xyz',
        'x402.org',
        'modelcontextprotocol.io'
    ]

    static #LINK_REGEX = /\[.*?\]\((https?:\/\/[^\)\s]+)\)/g

    static #TIMEOUT_MS = 10000


    static async run( { contentDir, outputPath, repoRoot } ) {
        const files = await ExternalLinkChecker.#collectFiles( { dir: contentDir } )
        const links = await ExternalLinkChecker.#extractLinks( { files, repoRoot } )
        const results = await ExternalLinkChecker.#checkLinks( { links } )
        await ExternalLinkChecker.#writeReport( { results, outputPath } )

        return { results }
    }


    static async #collectFiles( { dir } ) {
        const entries = await readdir( dir, { withFileTypes: true } )
        const collected = []

        await Promise.all(
            entries.map( async ( entry ) => {
                const fullPath = join( dir, entry.name )
                if( entry.isDirectory() ) {
                    const sub = await ExternalLinkChecker.#collectFiles( { dir: fullPath } )
                    sub.forEach( ( f ) => collected.push( f ) )
                } else if( [ '.md', '.mdx' ].includes( extname( entry.name ) ) ) {
                    collected.push( fullPath )
                }
            } )
        )

        return collected
    }


    static async #extractLinks( { files, repoRoot } ) {
        const buckets = await Promise.all(
            files.map( async ( file ) => {
                const content = await readFile( file, 'utf-8' )
                const matches = [ ...content.matchAll( ExternalLinkChecker.#LINK_REGEX ) ]
                const relPath = relative( repoRoot, file )
                return matches
                    .map( ( match ) => {
                        const url = match[ 1 ].replace( /[\)\.,;]+$/, '' )
                        return { file: relPath, url }
                    } )
            } )
        )

        const flat = []
        buckets.forEach( ( bucket ) => bucket.forEach( ( link ) => flat.push( link ) ) )
        return flat
    }


    static #fetchWithTimeout( { url, method } ) {
        return new Promise( ( resolve ) => {
            const controller = new AbortController()
            const timer = setTimeout( () => controller.abort(), ExternalLinkChecker.#TIMEOUT_MS )

            fetch( url, { method, signal: controller.signal, redirect: 'follow' } )
                .then( ( response ) => {
                    clearTimeout( timer )
                    resolve( { ok: true, status: response.status } )
                } )
                .catch( ( error ) => {
                    clearTimeout( timer )
                    resolve( { ok: false, error: error.message } )
                } )
        } )
    }


    static async #checkLinks( { links } ) {
        const total = links.length
        const results = []
        let processed = 0

        await Promise.all(
            links.map( async ( link ) => {
                const { file, url } = link
                const whitelisted = ExternalLinkChecker.#WHITELIST
                    .some( ( pattern ) => url.includes( pattern ) )

                if( whitelisted ) {
                    processed += 1
                    results.push( { file, url, status: 'OK', note: 'whitelist' } )
                    return
                }

                let result = await ExternalLinkChecker.#fetchWithTimeout( { url, method: 'HEAD' } )
                if( result.ok && ( result.status === 405 || result.status === 403 ) ) {
                    result = await ExternalLinkChecker.#fetchWithTimeout( { url, method: 'GET' } )
                }

                processed += 1
                if( result.ok ) {
                    const isOk = result.status >= 200 && result.status < 400
                    const status = isOk ? 'OK' : 'BROKEN'
                    results.push( { file, url, status, httpStatus: result.status } )
                    return
                }

                results.push( { file, url, status: 'BROKEN', error: result.error } )
            } )
        )

        console.log( `Checked ${ processed }/${ total } links` )
        return results
    }


    static async #writeReport( { results, outputPath } ) {
        const total = results.length
        const broken = results.filter( ( r ) => r.status === 'BROKEN' )
        const brokenCount = broken.length
        const percent = total === 0 ? '0.0' : ( ( brokenCount / total ) * 100 ).toFixed( 1 )
        const whitelisted = results.filter( ( r ) => r.note === 'whitelist' ).length

        const header = `# Link-Check Memo 052 — Ergebnisse\n\n` +
            `**Generated**: ${ new Date().toISOString() }\n\n` +
            `## Zusammenfassung\n\n` +
            `| Metrik | Wert |\n` +
            `|--------|------|\n` +
            `| Total Links | ${ total } |\n` +
            `| Whitelisted | ${ whitelisted } |\n` +
            `| Broken | ${ brokenCount } (${ percent }%) |\n` +
            `| Threshold | < 5% |\n` +
            `| Status | ${ parseFloat( percent ) < 5 ? 'PASS' : 'FAIL' } |\n\n` +
            `## Broken Links\n\n`

        let body
        if( brokenCount === 0 ) {
            body = '_No broken links found._\n'
        } else {
            const rows = broken
                .map( ( r ) => {
                    const detail = r.httpStatus !== undefined ? `HTTP ${ r.httpStatus }` : ( r.error || 'BROKEN' )
                    return `| ${ r.file } | ${ r.url } | ${ detail } |`
                } )
                .join( '\n' )
            body = `| Datei | URL | Status |\n|-------|-----|--------|\n${ rows }\n`
        }

        await mkdir( dirname( outputPath ), { recursive: true } )
        await writeFile( outputPath, header + body )
        console.log( `Report written to ${ outputPath }` )
    }
}


const __filename = fileURLToPath( import.meta.url )
const __dirname = dirname( __filename )
const repoRoot = join( __dirname, '..' )
const contentDir = join( repoRoot, 'src', 'content', 'docs' )
const outputPath = join( repoRoot, '..', '..', 'proofs', 'flowmcp.github.io', 'link-check-052.md' )

await ExternalLinkChecker.run( { contentDir, outputPath, repoRoot } )
