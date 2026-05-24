import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'


const REFS_PATH = resolve( 'src/data/refs.json' )


const collectUrls = ( { refs } ) => {
    const urls = []

    const pushUrl = ( { url, source } ) => {
        if( typeof url === 'string' && url.startsWith( 'http' ) ) {
            urls.push( { url, source } )
        }
    }

    pushUrl( { url: refs.docs.canonical, source: 'docs.canonical' } )
    Object
        .entries( refs.docs.entryPoints )
        .forEach( ( [ key, pathSegment ] ) => {
            pushUrl( { url: `${ refs.docs.canonical }${ pathSegment }`, source: `docs.entryPoints.${ key }` } )
        } )

    Object
        .entries( refs.llmsFiles )
        .forEach( ( [ key, url ] ) => {
            pushUrl( { url, source: `llmsFiles.${ key }` } )
        } )

    pushUrl( { url: refs.github.organization, source: 'github.organization' } )
    pushUrl( { url: refs.github.specRepo, source: 'github.specRepo' } )
    pushUrl( { url: refs.github.sponsorsUrl, source: 'github.sponsorsUrl' } )

    refs.robotsTxt.publishedLlmsFiles
        .forEach( ( pathSegment ) => {
            pushUrl( { url: `${ refs.docs.canonical }${ pathSegment }`, source: `robotsTxt.publishedLlmsFiles${ pathSegment }` } )
        } )

    return urls
}


const checkUrl = async ( { url } ) => {
    try {
        const headResponse = await fetch( url, { method: 'HEAD', redirect: 'follow' } )
        if( headResponse.ok ) {
            return { status: headResponse.status, ok: true }
        }
        const getResponse = await fetch( url, { method: 'GET', redirect: 'follow' } )
        return { status: getResponse.status, ok: getResponse.ok }
    } catch( error ) {
        return { status: 0, ok: false, error: error.message }
    }
}


const main = async () => {
    const refs = JSON.parse( await readFile( REFS_PATH, 'utf-8' ) )
    const urls = collectUrls( { refs } )

    console.log( `Pruefe ${ urls.length } URLs...` )
    const results = []

    await Promise.all( urls.map( async ( item ) => {
        const { status, ok, error } = await checkUrl( { url: item.url } )
        results.push( { ...item, status, ok, error } )
    } ) )

    const failed = results.filter( ( result ) => result.ok === false )
    if( failed.length > 0 ) {
        console.error( '\nFAILED:' )
        failed.forEach( ( result ) => {
            const errorPart = result.error ? ` — ${ result.error }` : ''
            console.error( `  [${ result.status || 'ERR' }] ${ result.url }  (${ result.source })${ errorPart }` )
        } )
        process.exit( 1 )
    }

    console.log( `OK: ${ results.length } URLs alle HTTP 200` )
}


main()
    .catch( ( error ) => {
        console.error( error )
        process.exit( 1 )
    } )
