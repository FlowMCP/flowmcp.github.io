import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'


const SPEC_REPO_RAW = 'https://raw.githubusercontent.com/FlowMCP/flowmcp-spec/main/spec/v4.0.0'
const SPEC_API_LIST = 'https://api.github.com/repos/FlowMCP/flowmcp-spec/contents/spec/v4.0.0?ref=main'
const TARGET_DIR = 'public/spec-source/v4.0.0'


const fetchJson = async ( { url } ) => {
    const response = await fetch( url, {
        headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'flowmcp-sync-spec' }
    } )
    if( !response.ok ) {
        throw new Error( `Fetch failed for ${url}: ${response.status}` )
    }
    return response.json()
}


const fetchText = async ( { url } ) => {
    const response = await fetch( url )
    if( !response.ok ) {
        throw new Error( `Fetch failed for ${url}: ${response.status}` )
    }
    return response.text()
}


const main = async () => {
    console.log( `Syncing spec v4.0.0 from FlowMCP/flowmcp-spec...` )

    if( existsSync( TARGET_DIR ) ) {
        console.log( `Cleaning ${TARGET_DIR}` )
        await rm( TARGET_DIR, { recursive: true, force: true } )
    }
    await mkdir( TARGET_DIR, { recursive: true } )

    const files = await fetchJson( { url: SPEC_API_LIST } )
    const mdFiles = files.filter( ( f ) => f.name.endsWith( '.md' ) )

    console.log( `Found ${mdFiles.length} spec documents.` )

    let syncedCount = 0
    for( const file of mdFiles ) {
        const url = `${SPEC_REPO_RAW}/${file.name}`
        const content = await fetchText( { url } )
        const targetPath = join( TARGET_DIR, file.name )
        await writeFile( targetPath, content, 'utf-8' )
        console.log( `  ✓ ${file.name}` )
        syncedCount++
    }

    console.log( `\nSynced ${syncedCount} files to ${TARGET_DIR}` )
}


main()
    .then( () => process.exit( 0 ) )
    .catch( ( err ) => {
        console.error( 'Sync failed:', err.message )
        process.exit( 1 )
    } )
