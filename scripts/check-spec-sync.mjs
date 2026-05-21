// Spec-Sync-Check (PRD-09)
// Vergleicht pinned Commits in src/data/spec-refs.json gegen aktuellen Git-Stand
// in repos/flowmcp-spec. Erzeugt src/data/spec-sync.json mit Status pro Spec-Datei.
import { execSync } from 'node:child_process'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname( fileURLToPath( import.meta.url ) )
const ROOT = join( __dirname, '..' )
const SPEC_ROOT = join( ROOT, '..', 'flowmcp-spec' )
const PINNED = join( ROOT, 'src', 'data', 'spec-refs.json' )
const OUT = join( ROOT, 'src', 'data', 'spec-sync.json' )


const run = () => {
    if( !existsSync( PINNED ) ) {
        console.log( 'No spec-refs.json — writing empty spec-sync.json' )
        mkdirSync( dirname( OUT ), { recursive: true } )
        writeFileSync( OUT, JSON.stringify( {}, null, 2 ) )
        return
    }
    const specRefs = JSON.parse( readFileSync( PINNED, 'utf8' ) )
    const status = {}

    Object.keys( specRefs ).forEach( ( path ) => {
        const pinned = specRefs[ path ]
        try {
            const current = execSync(
                `git log -1 --format=%H -- "${path}"`,
                { cwd: SPEC_ROOT, encoding: 'utf8' }
            ).trim()
            status[ path ] = { pinned, current, inSync: current.startsWith( pinned ) }
        } catch( e ) {
            status[ path ] = { pinned, current: null, inSync: false, error: e.message }
        }
    } )

    mkdirSync( dirname( OUT ), { recursive: true } )
    writeFileSync( OUT, JSON.stringify( status, null, 2 ) )
    console.log( `Spec sync status: ${Object.keys( status ).length} entries -> ${OUT}` )
}


run()
