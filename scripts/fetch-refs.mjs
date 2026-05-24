import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'


const SPEC_REPO_RAW = 'https://raw.githubusercontent.com/FlowMCP/flowmcp-spec/main'
const REFS_URL = `${ SPEC_REPO_RAW }/generated/refs.resolved.json`
const MINI_SKILL_URL = `${ SPEC_REPO_RAW }/data/mini-skill.template.md`
const MANIFEST_URL = `${ SPEC_REPO_RAW }/generated/docs-payload/manifest.json`

const REFS_TARGET = 'src/data/refs.json'
const MINI_SKILL_TARGET = 'src/data/mini-skill.template.md'

const EXPECTED_SCHEMA_VERSION = 'refs/1.0.0'

const STATS_NULL_BLOCK = {
    count_schemas: null,
    count_unique_datasources: null,
    count_tools: null,
    count_resources: null,
    count_skills: null,
    timestamp: null,
    schema_version: null,
    build_hash: null
}


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


// Fetch spec payload (manifest.json) to extract meta.stats — Memo 059 Phase 4 PRD-017.
// Single-Source-of-Truth is the spec-payload meta.stats block, never a direct fetch
// from flowmcp-schemas-public. Failure falls back to null block, build never crashes.
const fetchStats = async () => {
    try {
        const response = await fetch( MANIFEST_URL )
        if( !response.ok ) {
            console.warn( `[fetch-refs] manifest HTTP ${ response.status } — using null stats` )
            return STATS_NULL_BLOCK
        }
        const manifest = await response.json()
        if( !manifest?.meta?.stats ) {
            console.warn( '[fetch-refs] manifest.meta.stats missing — using null stats' )
            return STATS_NULL_BLOCK
        }
        return manifest.meta.stats
    } catch( error ) {
        console.warn( `[fetch-refs] manifest fetch failed: ${ error.message } — using null stats` )
        return STATS_NULL_BLOCK
    }
}


const main = async () => {
    const refs = await fetchRefs()
    const miniSkill = await fetchMiniSkill()
    const stats = await fetchStats()

    // Inject stats into refs payload so it flows through replace-placeholders.mjs
    const refsData = JSON.parse( refs.text )
    refsData.stats = stats
    const refsWithStatsText = JSON.stringify( refsData, null, 4 )

    await mkdir( dirname( REFS_TARGET ), { recursive: true } )

    await writeFile( REFS_TARGET, refsWithStatsText, 'utf8' )
    await writeFile( MINI_SKILL_TARGET, miniSkill.text, 'utf8' )

    console.log( `[fetch-refs] wrote ${ REFS_TARGET } (${ refsWithStatsText.length } bytes, stats.count_schemas=${ stats.count_schemas })` )
    console.log( `[fetch-refs] wrote ${ MINI_SKILL_TARGET } (${ miniSkill.bytes } bytes)` )
}


main()
    .catch( ( error ) => {
        console.error( `[fetch-refs] ERROR: ${ error.message }` )
        process.exit( 1 )
    } )
