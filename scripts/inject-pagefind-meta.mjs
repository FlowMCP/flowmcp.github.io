// Pagefind-Meta-Injector (PRD-05, REV-05 Kap. 5)
// Liest Sidebar-Struktur aus astro.config.mjs (token-basiert)
// und setzt pro MDX/MD-Datei ein verstecktes span[data-pagefind-meta]
// am Anfang des Body-Contents. Idempotent — vorhandene Marker werden ersetzt.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'


const __dirname = dirname( fileURLToPath( import.meta.url ) )
const ROOT = join( __dirname, '..' )
const DOCS_DIR = join( ROOT, 'src', 'content', 'docs' )
const CONFIG = join( ROOT, 'astro.config.mjs' )
const MARKER_START_MD = '<!-- PAGEFIND-META-START -->'
const MARKER_END_MD = '<!-- PAGEFIND-META-END -->'
const MARKER_START_MDX = '{/* PAGEFIND-META-START */}'
const MARKER_END_MDX = '{/* PAGEFIND-META-END */}'


const extractSidebarText = ( raw ) => {
    const startMatch = raw.match( /sidebar:\s*\[/ )
    if( !startMatch ) { return '' }
    const startIdx = startMatch.index + startMatch[ 0 ].length - 1
    let depth = 0
    let endIdx = startIdx
    for( let i = startIdx; i < raw.length; i += 1 ) {
        const ch = raw[ i ]
        if( ch === '[' ) { depth += 1 }
        if( ch === ']' ) {
            depth -= 1
            if( depth === 0 ) { endIdx = i; break }
        }
    }
    return raw.slice( startIdx, endIdx + 1 )
}


const buildSidebarMapping = () => {
    const raw = readFileSync( CONFIG, 'utf8' )
    const text = extractSidebarText( raw )
    if( text === '' ) { return {} }

    const mapping = {}
    let depth = 0
    const labelByDepth = {}

    const tokens = text.split( /([\{\}\[\]])/ )
    tokens.forEach( ( tok ) => {
        if( tok === '{' ) { depth += 1; return }
        if( tok === '}' ) {
            delete labelByDepth[ depth ]
            depth -= 1
            return
        }
        if( tok === '[' || tok === ']' ) { return }

        const labelMatch = tok.match( /label:\s*['"]([^'"]+)['"]/ )
        if( labelMatch ) { labelByDepth[ depth ] = labelMatch[ 1 ] }
        const slugMatch = tok.match( /slug:\s*['"]([^'"]+)['"]/ )
        if( slugMatch ) {
            const parentLabels = []
            Object.keys( labelByDepth )
                .map( ( k ) => parseInt( k, 10 ) )
                .sort( ( a, b ) => a - b )
                .forEach( ( d ) => {
                    if( d < depth ) { parentLabels.push( labelByDepth[ d ] ) }
                } )
            mapping[ slugMatch[ 1 ] ] = parentLabels.join( ' > ' )
        }
    } )

    return mapping
}


const walkMdx = ( { dir, acc } ) => {
    const entries = readdirSync( dir )
    entries.forEach( ( entry ) => {
        const full = join( dir, entry )
        const stats = statSync( full )
        if( stats.isDirectory() ) {
            walkMdx( { dir: full, acc } )
        } else if( entry.endsWith( '.mdx' ) || entry.endsWith( '.md' ) ) {
            acc.push( full )
        }
    } )
    return acc
}


const escapeForRegex = ( s ) => s.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' )


const injectMeta = ( { file, section } ) => {
    const raw = readFileSync( file, 'utf8' )
    const match = raw.match( /^---\n([\s\S]*?)\n---\n([\s\S]*)$/ )
    if( !match ) { return { status: false, reason: 'no-frontmatter' } }

    const isMdx = file.endsWith( '.mdx' )
    const markerStart = isMdx ? MARKER_START_MDX : MARKER_START_MD
    const markerEnd = isMdx ? MARKER_END_MDX : MARKER_END_MD

    const [ , frontmatter, body ] = match
    // strip any previously injected meta block (both formats, for safety)
    let cleanBody = body
    const stripPatterns = [
        new RegExp( `${escapeForRegex( MARKER_START_MD )}[\\s\\S]*?${escapeForRegex( MARKER_END_MD )}\\n*`, 'g' ),
        new RegExp( `${escapeForRegex( MARKER_START_MDX )}[\\s\\S]*?${escapeForRegex( MARKER_END_MDX )}\\n*`, 'g' )
    ]
    stripPatterns.forEach( ( re ) => { cleanBody = cleanBody.replace( re, '' ) } )

    const metaBlock = `${markerStart}\n<span style="display:none" data-pagefind-meta="section">${section}</span>\n${markerEnd}\n\n`
    writeFileSync( file, `---\n${frontmatter}\n---\n${metaBlock}${cleanBody}` )
    return { status: true }
}


const cleanupExistingFrontmatterPagefind = ( file ) => {
    // Remove any leftover `pagefind:\n  customMeta: ...` frontmatter blocks from
    // earlier injection attempts (avoid schema collisions).
    const raw = readFileSync( file, 'utf8' )
    const match = raw.match( /^---\n([\s\S]*?)\n---\n([\s\S]*)$/ )
    if( !match ) { return false }
    const [ , frontmatter, body ] = match
    if( !/^pagefind:\s*\n\s+customMeta:/m.test( frontmatter ) ) { return false }
    const cleaned = frontmatter.replace( /\npagefind:\s*\n\s+customMeta:[\s\S]*?(?=\n[a-zA-Z_]|$)/, '' )
    writeFileSync( file, `---\n${cleaned}\n---\n${body}` )
    return true
}


const run = () => {
    const mapping = buildSidebarMapping()
    const files = walkMdx( { dir: DOCS_DIR, acc: [] } )

    let injected = 0
    let noMapping = 0
    let skipped = 0
    let cleaned = 0

    files.forEach( ( file ) => {
        if( cleanupExistingFrontmatterPagefind( file ) ) { cleaned += 1 }

        const rel = relative( DOCS_DIR, file )
        const noLocale = rel.replace( /^de[\\/]/, '' )
        const slug = noLocale.replace( /\.(mdx|md)$/, '' ).replace( /\\/g, '/' )
        const section = mapping[ slug ]
        if( section === undefined ) { noMapping += 1; return }
        const res = injectMeta( { file, section } )
        if( res.status ) { injected += 1 } else { skipped += 1 }
    } )

    console.log( 'Pagefind meta injection:', { injected, noMapping, skipped, cleaned, totalFiles: files.length, mappingKeys: Object.keys( mapping ).length } )
    return { status: true }
}


run()
