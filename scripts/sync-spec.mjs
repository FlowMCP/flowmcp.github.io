import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'


const SPEC_REPO_RAW = 'https://raw.githubusercontent.com/FlowMCP/flowmcp-spec/main'

const SOURCES = [
    {
        apiUrl: 'https://api.github.com/repos/FlowMCP/flowmcp-spec/contents/spec/v4.0.0?ref=main',
        rawBase: `${ SPEC_REPO_RAW }/spec/v4.0.0`,
        targetDir: 'public/spec-source/v4.0.0',
        label: 'spec/v4.0.0/'
    },
    {
        apiUrl: 'https://api.github.com/repos/FlowMCP/flowmcp-spec/contents/generated/docs-payload?ref=main',
        rawBase: `${ SPEC_REPO_RAW }/generated/docs-payload`,
        targetDir: 'public/spec-generated/docs-payload',
        label: 'generated/docs-payload/'
    }
]


const fetchJson = async ( { url } ) => {
    const response = await fetch( url, {
        headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'flowmcp-sync-spec' }
    } )
    if( !response.ok ) {
        throw new Error( `Fetch failed for ${ url }: ${ response.status }` )
    }
    return response.json()
}


const fetchText = async ( { url } ) => {
    const response = await fetch( url )
    if( !response.ok ) {
        throw new Error( `Fetch failed for ${ url }: ${ response.status }` )
    }
    return response.text()
}


const syncSource = async ( { apiUrl, rawBase, targetDir, label } ) => {
    console.log( `\nSyncing ${ label } from FlowMCP/flowmcp-spec...` )

    if( existsSync( targetDir ) ) {
        console.log( `  Cleaning ${ targetDir }` )
        await rm( targetDir, { recursive: true, force: true } )
    }
    await mkdir( targetDir, { recursive: true } )

    const files = await fetchJson( { url: apiUrl } )
    const targetFiles = files.filter( ( f ) => f.name.endsWith( '.md' ) || f.name.endsWith( '.json' ) )

    console.log( `  Found ${ targetFiles.length } files.` )

    let syncedCount = 0
    for( const file of targetFiles ) {
        const url = `${ rawBase }/${ file.name }`
        const content = await fetchText( { url } )
        const targetPath = join( targetDir, file.name )
        await writeFile( targetPath, content, 'utf-8' )
        console.log( `    ✓ ${ file.name }` )
        syncedCount++
    }

    console.log( `  Synced ${ syncedCount } files to ${ targetDir }` )
    return syncedCount
}


const main = async () => {
    let total = 0
    for( const source of SOURCES ) {
        total += await syncSource( source )
    }
    console.log( `\nTotal synced: ${ total } files across ${ SOURCES.length } sources` )
}


main()
    .then( () => process.exit( 0 ) )
    .catch( ( err ) => {
        console.error( 'Sync failed:', err.message )
        process.exit( 1 )
    } )
