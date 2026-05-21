// Schema-Snapshot Sync (PRD-07, REV-05 Kap. 7)
// Holt registry.json von flowmcp-schemas-public, transformiert in provider-gruppiertes
// Format und legt es als lokales JSON ab.
// So bleibt der Build deterministisch und unabhaengig vom Netz.
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'


const __dirname = dirname( fileURLToPath( import.meta.url ) )
const OUT = join( __dirname, '..', 'src', 'data', 'schemas-snapshot.json' )
const REGISTRY_URL = 'https://raw.githubusercontent.com/FlowMCP/flowmcp-schemas-public/main/registry.json'


// Transform registry.json schemas[] -> { providers: [ { folder, toolCount, schemas: [ { name, description, requiresApiKey, tools: [] } ] } ] }
const buildSnapshot = ( registry ) => {
    const byProvider = {}
    const schemas = registry.schemas || []
    schemas.forEach( ( s ) => {
        // schemaId format: "provider/schemaName"
        const parts = s.schemaId.split( '/' )
        const folder = parts[ 0 ]
        const name = parts.slice( 1 ).join( '/' ) || folder
        if( !byProvider[ folder ] ) {
            byProvider[ folder ] = { folder, toolCount: 0, schemas: [] }
        }
        // registry.json doesn't include tool details, so we estimate 1 tool per schema
        // (real tool counts would require fetching each .mjs schema file — too heavy).
        byProvider[ folder ].schemas.push( {
            name,
            file: s.schemaPath || '',
            description: ( s.dimensions && s.dimensions[ 0 ]?.reasoning ) || '',
            requiresApiKey: false,
            tools: []
        } )
        byProvider[ folder ].toolCount += 1
    } )

    const providers = Object.values( byProvider ).sort( ( a, b ) => a.folder.localeCompare( b.folder ) )
    return {
        providers,
        totalProviders: providers.length,
        totalTools: providers.reduce( ( s, p ) => s + p.toolCount, 0 ),
        totalSchemas: providers.reduce( ( s, p ) => s + p.schemas.length, 0 ),
        generatedAt: registry.generatedAt
    }
}


const run = async () => {
    const res = await fetch( REGISTRY_URL )
    if( !res.ok ) {
        throw new Error( `HTTP ${res.status}: ${res.statusText}` )
    }
    const registry = await res.json()
    const snapshot = buildSnapshot( registry )
    mkdirSync( dirname( OUT ), { recursive: true } )
    writeFileSync( OUT, JSON.stringify( snapshot, null, 2 ) )
    console.log( `Saved snapshot: ${snapshot.totalProviders} providers, ${snapshot.totalSchemas} schemas to ${OUT}` )
    return { status: true }
}


run().catch( ( err ) => {
    console.error( err )
    process.exit( 1 )
} )
