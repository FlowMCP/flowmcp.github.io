import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'


const TEMPLATES_DIR = 'src/templates'
const OUTPUT_DIR = 'src/content/docs'
const REFS_PATH = 'src/data/refs.json'
const MINI_SKILL_PATH = 'src/data/mini-skill.template.md'

const PLACEHOLDER_REGEX = /\{\{([a-zA-Z0-9_.:-]+)\}\}/g
const INCLUDE_MINI_SKILL_TOKEN = '{{include:mini-skill}}'


// A token is a refs-placeholder if it contains a dot (e.g. spec.currentVersion)
// or starts with "include:" (e.g. include:mini-skill). Plain identifiers like
// {{API_KEY}} or {{CHAIN}} are documentation/code-example markers and are left
// untouched by both reverseCheck and applyPlaceholders.
const isRefsPlaceholder = ( { key } ) => {
    if( key.startsWith( 'include:' ) ) return true
    return key.includes( '.' )
}


export const resolveDotPath = ( { obj, dotPath } ) => {
    const segments = dotPath.split( '.' )
    const value = segments.reduce( ( acc, key ) => {
        if( acc === undefined || acc === null ) return undefined
        return acc[ key ]
    }, obj )
    return { value }
}


export const extractPlaceholders = ( { content } ) => {
    const matches = [ ...content.matchAll( PLACEHOLDER_REGEX ) ]
    const keys = matches
        .map( ( m ) => m[ 1 ] )
        .filter( ( key ) => !key.startsWith( 'include:' ) )
        .filter( ( key ) => key.includes( '.' ) )
    const unique = [ ...new Set( keys ) ]
    return { keys: unique }
}


export const reverseCheck = ( { templatePath, content, refs } ) => {
    const { keys } = extractPlaceholders( { content } )
    const missing = keys.filter( ( key ) => {
        const { value } = resolveDotPath( { obj: refs, dotPath: key } )
        return value === undefined
    } )
    if( missing.length > 0 ) {
        throw new Error( `[reverse-check] ${ templatePath }: unknown placeholders -> ${ missing.join( ', ' ) }` )
    }
}


export const forwardCheck = ( { outputPath, content } ) => {
    const remaining = [ ...content.matchAll( PLACEHOLDER_REGEX ) ]
        .filter( ( m ) => isRefsPlaceholder( { key: m[ 1 ] } ) )
    if( remaining.length > 0 ) {
        const tokens = remaining
            .map( ( m ) => m[ 0 ] )
            .join( ', ' )
        throw new Error( `[forward-check] ${ outputPath }: unresolved placeholders remain -> ${ tokens }` )
    }
}


export const applyMiniSkillInclude = ( { content, miniSkill } ) => {
    if( !content.includes( INCLUDE_MINI_SKILL_TOKEN ) ) {
        return { content, replaced: 0 }
    }
    const replacedContent = content.split( INCLUDE_MINI_SKILL_TOKEN ).join( miniSkill )
    const occurrences = content.split( INCLUDE_MINI_SKILL_TOKEN ).length - 1
    return { content: replacedContent, replaced: occurrences }
}


export const applyPlaceholders = ( { content, refs } ) => {
    let count = 0
    const replaced = content.replace( PLACEHOLDER_REGEX, ( match, key ) => {
        if( key.startsWith( 'include:' ) ) return match
        if( !key.includes( '.' ) ) return match
        const { value } = resolveDotPath( { obj: refs, dotPath: key } )
        if( value === undefined ) return match
        // Memo 059 PRD-017: null stats (spec-payload fallback or first build)
        // render as em-dash, not the literal string "null".
        if( value === null && key.startsWith( 'stats.' ) ) {
            count += 1
            return '—'
        }
        count += 1
        return String( value )
    } )
    return { content: replaced, replaced: count }
}


const findTemplates = async ( { dir } ) => {
    let entries
    try {
        entries = await readdir( dir, { withFileTypes: true } )
    } catch( err ) {
        if( err.code === 'ENOENT' ) return []
        throw err
    }
    const result = await Promise.all( entries.map( async ( entry ) => {
        const full = join( dir, entry.name )
        if( entry.isDirectory() ) {
            const nested = await findTemplates( { dir: full } )
            return nested
        }
        const isTemplate = /\.template\.(md|mdx|txt)$/.test( entry.name )
        return isTemplate ? [ full ] : []
    } ) )
    return result.flat()
}


const computeOutputPath = ( { templatePath } ) => {
    const output = templatePath
        .replace( /^src\/templates\//, `${ OUTPUT_DIR }/` )
        .replace( /\.template\.(md|mdx|txt)$/, '.$1' )
    return { outputPath: output }
}


const processTemplate = async ( { templatePath, refs, miniSkill } ) => {
    const raw = await readFile( templatePath, 'utf8' )

    const includeResult = applyMiniSkillInclude( { content: raw, miniSkill } )

    reverseCheck( { templatePath, content: includeResult.content, refs } )

    const replaceResult = applyPlaceholders( { content: includeResult.content, refs } )

    const { outputPath } = computeOutputPath( { templatePath } )

    forwardCheck( { outputPath, content: replaceResult.content } )

    await mkdir( dirname( outputPath ), { recursive: true } )
    await writeFile( outputPath, replaceResult.content, 'utf8' )

    const totalReplaced = replaceResult.replaced + includeResult.replaced
    console.log( `[replace-placeholders] ${ templatePath } -> ${ outputPath } (${ totalReplaced } placeholders resolved)` )
}


const main = async () => {
    const refsRaw = await readFile( REFS_PATH, 'utf8' )
    const refs = JSON.parse( refsRaw )

    const miniSkill = await readFile( MINI_SKILL_PATH, 'utf8' )

    const templates = await findTemplates( { dir: TEMPLATES_DIR } )

    if( templates.length === 0 ) {
        console.log( `[replace-placeholders] no templates found in ${ TEMPLATES_DIR }` )
        return
    }

    await Promise.all( templates.map( ( templatePath ) => {
        return processTemplate( { templatePath, refs, miniSkill } )
    } ) )

    console.log( `[replace-placeholders] processed ${ templates.length } templates` )
}


const isCli = import.meta.url === `file://${ process.argv[ 1 ] }`
if( isCli ) {
    main()
        .catch( ( error ) => {
            console.error( `[replace-placeholders] ERROR: ${ error.message }` )
            process.exit( 1 )
        } )
}
