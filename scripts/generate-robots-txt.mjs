import { readFile, writeFile } from 'node:fs/promises'


// Memo 056 PRD-26: generate robots.txt from src/data/refs.json (R8 Placeholder-First).
// Replaces the manually maintained public/robots.txt (Memo Kap. 7.1 — 3 of 5 broken).

const REFS_PATH = 'src/data/refs.json'
const OUTPUT = 'public/robots.txt'
const SITE_BASE = 'https://flowmcp.github.io'


const loadRefs = async () => {
    const raw = await readFile( REFS_PATH, 'utf8' )
    const refs = JSON.parse( raw )

    const checks = [
        [ 'robotsTxt.publishedLlmsFiles', refs.robotsTxt?.publishedLlmsFiles ],
        [ 'llmsFiles.specUrl', refs.llmsFiles?.specUrl ]
    ]

    const missing = checks
        .filter( ( [ , value ] ) => value === undefined )
        .map( ( [ field ] ) => field )

    if( missing.length > 0 ) {
        throw new Error( `[generate-robots-txt] missing required fields in ${ REFS_PATH }: ${ missing.join( ', ' ) }` )
    }

    if( !Array.isArray( refs.robotsTxt.publishedLlmsFiles ) || refs.robotsTxt.publishedLlmsFiles.length === 0 ) {
        throw new Error( '[generate-robots-txt] refs.robotsTxt.publishedLlmsFiles must be a non-empty array' )
    }

    return { refs }
}


const buildRobotsTxt = ( { refs } ) => {
    const published = refs.robotsTxt.publishedLlmsFiles
    const specUrl = refs.llmsFiles.specUrl

    const llmsLines = []
    llmsLines.push( '' )
    llmsLines.push( '# llms.txt — layered LLM context' )

    const labelByPath = {
        '/llms.txt':       'Index:       ',
        '/docs-llms.txt':  'Docs:        ',
        '/llms-full.txt':  'Full content:'
    }

    published.forEach( ( pathLike ) => {
        const label = labelByPath[ pathLike ] ?? `${ pathLike }: `
        llmsLines.push( `# ${ label } ${ SITE_BASE }${ pathLike }` )
    } )

    llmsLines.push( `# Spec:         ${ specUrl }` )

    const header = [
        'User-agent: *',
        'Allow: /',
        '',
        '# Sitemap',
        `Sitemap: ${ SITE_BASE }/sitemap-index.xml`
    ].join( '\n' )

    return `${ header }\n${ llmsLines.join( '\n' ) }\n`
}


const main = async () => {
    const { refs } = await loadRefs()
    const body = buildRobotsTxt( { refs } )
    await writeFile( OUTPUT, body, 'utf8' )
    console.log( `[generate-robots-txt] wrote ${ OUTPUT } (${ body.length } bytes)` )
}


main()
    .catch( ( error ) => {
        console.error( `[generate-robots-txt] ERROR: ${ error.message }` )
        process.exit( 1 )
    } )
