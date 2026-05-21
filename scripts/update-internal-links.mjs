// Cross-Link-Updater (PRD-06)
// Sucht/Ersetzt alte URLs gegen neue in allen .mdx/.md-Dateien unter src/content/docs.
// Idempotent. Reihenfolge wichtig: spezifischste Replacements zuerst.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname( fileURLToPath( import.meta.url ) )
const ROOT = join( __dirname, '..', 'src', 'content', 'docs' )


// Reihenfolge: speziellste zuerst, damit /docs/schemas/* nicht generisch durch /docs/-Pattern uebermatcht wird
const REPLACEMENTS = [
    { from: '/docs/schemas/tags-reference', to: '/reference/tags-reference' },
    { from: '/docs/schemas/resources', to: '/concepts/schemas-resources' },
    { from: '/docs/schemas/prompts', to: '/concepts/schemas-prompts' },
    { from: '/docs/schemas/skills', to: '/concepts/schemas-skills' },
    { from: '/docs/schemas/overview', to: '/concepts/schemas-overview' },
    { from: '/docs/schemas/tools', to: '/concepts/schemas-tools' },
    { from: '/docs/agents/overview', to: '/concepts/agents-overview' },
    { from: '/docs/getting-started/', to: '/quickstart/' },
    { from: '/docs/specification/', to: '/specification/' },
    { from: '/docs/reference/', to: '/reference/' },
    { from: '/docs/usage/', to: '/reference/' },
    { from: '/docs/guides/', to: '/guides/' },
    { from: '/docs/ecosystem/', to: '/ecosystem/' },
    { from: '/basics/', to: '/concepts/' }
]


const walk = ( { dir, acc } ) => {
    readdirSync( dir ).forEach( ( e ) => {
        const full = join( dir, e )
        if( statSync( full ).isDirectory() ) {
            walk( { dir: full, acc } )
        } else if( /\.(md|mdx)$/.test( e ) ) {
            acc.push( full )
        }
    } )
    return acc
}


const run = () => {
    const files = walk( { dir: ROOT, acc: [] } )
    let changedCount = 0
    let totalReplacements = 0

    files.forEach( ( file ) => {
        let content = readFileSync( file, 'utf8' )
        let changed = false
        let fileReplacements = 0
        REPLACEMENTS.forEach( ( { from, to } ) => {
            const parts = content.split( from )
            if( parts.length > 1 ) {
                content = parts.join( to )
                changed = true
                fileReplacements += parts.length - 1
            }
        } )
        if( changed ) {
            writeFileSync( file, content )
            changedCount += 1
            totalReplacements += fileReplacements
        }
    } )

    console.log( `Updated ${changedCount}/${files.length} files, ${totalReplacements} total replacements` )
}


run()
