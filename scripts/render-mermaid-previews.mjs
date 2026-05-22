import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'
import path from 'node:path'

const execFileAsync = promisify( execFile )


class MermaidPreviewRenderer {
    static async run( { proposedDir, mmdcBin } ) {
        const files = await readdir( proposedDir )
        const mdFiles = files.filter( ( f ) => f.endsWith( '.md' ) && f !== 'README.md' )

        const renderTasks = mdFiles.map( async ( mdFile ) => {
            const mdPath = path.join( proposedDir, mdFile )
            const content = await readFile( mdPath, 'utf-8' )
            const blocks = MermaidPreviewRenderer.extractMermaidBlocks( { content } )

            if( blocks.length === 0 ) {
                return { file: mdFile, status: 'no-mermaid', blockCount: 0 }
            }

            const slug = mdFile.replace( /\.md$/, '' )
            const tmpPath = `/tmp/mermaid-${slug}.mmd`
            const outPath = path.join( proposedDir, `${slug}.png` )

            await writeFile( tmpPath, blocks[ 0 ], 'utf-8' )

            try {
                await execFileAsync( mmdcBin, [ '-i', tmpPath, '-o', outPath, '-b', 'white' ] )
                return { file: mdFile, status: 'rendered', outPath, blockCount: blocks.length }
            } catch( err ) {
                return { file: mdFile, status: 'render-error', error: err.message, blockCount: blocks.length }
            }
        } )

        const results = await Promise.all( renderTasks )
        return { results }
    }


    static extractMermaidBlocks( { content } ) {
        const regex = /```mermaid\n([\s\S]*?)\n```/g
        const matches = []
        const found = content.matchAll( regex )
        Array.from( found ).forEach( ( m ) => matches.push( m[ 1 ] ) )
        return matches
    }
}


const repoRoot = path.resolve( path.dirname( new URL( import.meta.url ).pathname ), '..' )
const proposedDir = path.resolve( repoRoot, '../../.memo/052-webseite-content-audit/proposed-mermaids' )
const mmdcBin = path.join( repoRoot, 'node_modules/.bin/mmdc' )

if( !existsSync( proposedDir ) ) {
    await mkdir( proposedDir, { recursive: true } )
}
const acceptedDir = path.join( proposedDir, 'accepted' )
if( !existsSync( acceptedDir ) ) {
    await mkdir( acceptedDir, { recursive: true } )
}

if( !existsSync( mmdcBin ) ) {
    console.error( `mmdc binary not found at ${mmdcBin}` )
    console.error( 'Run: npm install --save-dev @mermaid-js/mermaid-cli' )
    process.exit( 1 )
}

const { results } = await MermaidPreviewRenderer.run( { proposedDir, mmdcBin } )

results.forEach( ( r ) => {
    if( r.status === 'rendered' ) {
        console.log( `OK    ${r.file} -> ${path.basename( r.outPath )} (${r.blockCount} block(s), first rendered)` )
    } else if( r.status === 'no-mermaid' ) {
        console.log( `SKIP  ${r.file} (no mermaid block found)` )
    } else {
        console.log( `FAIL  ${r.file} (${r.error})` )
    }
} )

const renderedCount = results.filter( ( r ) => r.status === 'rendered' ).length
const skipCount = results.filter( ( r ) => r.status === 'no-mermaid' ).length
const failCount = results.filter( ( r ) => r.status === 'render-error' ).length

console.log( `\nSummary: ${renderedCount} rendered, ${skipCount} skipped, ${failCount} failed` )
