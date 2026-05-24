import { readdir, readFile, stat } from 'node:fs/promises'
import { resolve, join, relative } from 'node:path'


const DIST_DIR = resolve( 'dist' )
const REFS_PLACEHOLDER_REGEX = /\{\{(spec|imports|docs|github|llmsFiles|robotsTxt|generated|include)[.:][\w.:-]+\}\}/g
const SCAN_EXTENSIONS = [ '.html', '.txt', '.md', '.mdx', '.json', '.xml' ]


const walkDir = async ( { dir } ) => {
    let entries
    try {
        entries = await readdir( dir )
    } catch( err ) {
        if( err.code === 'ENOENT' ) return []
        throw err
    }
    const files = []
    await Promise.all( entries.map( async ( entry ) => {
        const fullPath = join( dir, entry )
        const stats = await stat( fullPath )
        if( stats.isDirectory() ) {
            const nested = await walkDir( { dir: fullPath } )
            files.push( ...nested )
            return
        }
        if( SCAN_EXTENSIONS.some( ( ext ) => fullPath.endsWith( ext ) ) ) {
            files.push( fullPath )
        }
    } ) )
    return files
}


const scanFile = async ( { file } ) => {
    const content = await readFile( file, 'utf-8' )
    const lines = content.split( '\n' )
    const hits = []
    lines.forEach( ( line, index ) => {
        const matches = line.match( REFS_PLACEHOLDER_REGEX )
        if( matches !== null ) {
            matches.forEach( ( match ) => {
                hits.push( {
                    file: relative( process.cwd(), file ),
                    line: index + 1,
                    placeholder: match
                } )
            } )
        }
    } )
    return hits
}


const main = async () => {
    console.log( `Scanne ${ DIST_DIR } nach unaufgeloesten Placeholdern...` )
    const files = await walkDir( { dir: DIST_DIR } )

    if( files.length === 0 ) {
        console.log( '[check-placeholder-coverage] dist/ ist leer oder existiert nicht — Build vorher ausfuehren.' )
        return
    }

    console.log( `${ files.length } Dateien zu pruefen` )

    const allHits = []
    await Promise.all( files.map( async ( file ) => {
        const hits = await scanFile( { file } )
        allHits.push( ...hits )
    } ) )

    if( allHits.length > 0 ) {
        console.error( `\nFAIL: ${ allHits.length } unaufgeloeste Placeholders gefunden:` )
        allHits.forEach( ( hit ) => {
            console.error( `  ${ hit.file }:${ hit.line }  ${ hit.placeholder }` )
        } )
        process.exit( 1 )
    }

    console.log( 'OK: keine unaufgeloesten Refs-Placeholders im dist/' )
}


main()
    .catch( ( error ) => {
        console.error( error )
        process.exit( 1 )
    } )
