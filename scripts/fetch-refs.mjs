import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'


const SPEC_REPO_RAW = 'https://raw.githubusercontent.com/FlowMCP/flowmcp-spec/main'
const REFS_URL = `${ SPEC_REPO_RAW }/generated/refs.resolved.json`
const MINI_SKILL_URL = `${ SPEC_REPO_RAW }/data/mini-skill.template.md`

const REFS_TARGET = 'src/data/refs.json'
const MINI_SKILL_TARGET = 'src/data/mini-skill.template.md'

const EXPECTED_SCHEMA_VERSION = 'refs/1.0.0'


const fetchAsText = async ( { url } ) => {
    const response = await fetch( url )
    if( !response.ok ) {
        throw new Error( `HTTP ${ response.status } ${ response.statusText } for ${ url }` )
    }
    const text = await response.text()
    return { text }
}


const fetchRefs = async () => {
    const { text } = await fetchAsText( { url: REFS_URL } )
    const data = JSON.parse( text )

    if( data.schemaVersion !== EXPECTED_SCHEMA_VERSION ) {
        throw new Error( `schemaVersion mismatch: expected '${ EXPECTED_SCHEMA_VERSION }', got '${ data.schemaVersion }'` )
    }

    if( data.validation?.passed !== true ) {
        throw new Error( `refs.resolved.json validation.passed is not true (got ${ data.validation?.passed })` )
    }

    return { text, bytes: text.length }
}


const fetchMiniSkill = async () => {
    const { text } = await fetchAsText( { url: MINI_SKILL_URL } )
    if( text.trim().length === 0 ) {
        throw new Error( 'mini-skill.template.md is empty' )
    }
    return { text, bytes: text.length }
}


const main = async () => {
    const refs = await fetchRefs()
    const miniSkill = await fetchMiniSkill()

    await mkdir( dirname( REFS_TARGET ), { recursive: true } )

    await writeFile( REFS_TARGET, refs.text, 'utf8' )
    await writeFile( MINI_SKILL_TARGET, miniSkill.text, 'utf8' )

    console.log( `[fetch-refs] wrote ${ REFS_TARGET } (${ refs.bytes } bytes)` )
    console.log( `[fetch-refs] wrote ${ MINI_SKILL_TARGET } (${ miniSkill.bytes } bytes)` )
}


main()
    .catch( ( error ) => {
        console.error( `[fetch-refs] ERROR: ${ error.message }` )
        process.exit( 1 )
    } )
