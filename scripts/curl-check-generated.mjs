// Memo 060 Phase 9 (PRD-028 Task 1): curl-Check fuer generated/-Artefakte
// auf raw.githubusercontent.com/FlowMCP/flowmcp-spec/main/generated/.
//
// Verifiziert:
// - HTTP 200 + Content-Length > 0 pro Artefakt
// - llms.txt + llms-schema-spec.txt: erste Zeile == "# FlowMCP Specification v4.1.0"
// - refs.resolved.json: JSON.parse() ohne Fehler
//
// Output: proofs/phase-9-verification-2026-05-24/curl/generated-artifacts.json
// Exit-Code: 0 wenn alle pass, sonst 1
// Verwendet Node 22+ fetch(), kein curl-CLI Dependency.

import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'


const ARTIFACTS = [
    { url: 'https://raw.githubusercontent.com/FlowMCP/flowmcp-spec/main/generated/llms.txt', expectFirstLine: '# FlowMCP Specification v4.1.0' },
    { url: 'https://raw.githubusercontent.com/FlowMCP/flowmcp-spec/main/generated/llms-schema-spec.txt', expectFirstLine: '# FlowMCP Specification v4.1.0' },
    { url: 'https://raw.githubusercontent.com/FlowMCP/flowmcp-spec/main/generated/refs.resolved.json', expectJsonValid: true },
    { url: 'https://raw.githubusercontent.com/FlowMCP/flowmcp-spec/main/generated/README.md' },
    { url: 'https://raw.githubusercontent.com/FlowMCP/flowmcp-spec/main/generated/docs-payload/00-overview.md' },
    { url: 'https://raw.githubusercontent.com/FlowMCP/flowmcp-spec/main/generated/docs-payload/01-schema-format.md' },
    { url: 'https://raw.githubusercontent.com/FlowMCP/flowmcp-spec/main/generated/docs-payload/02-parameters.md' },
    { url: 'https://raw.githubusercontent.com/FlowMCP/flowmcp-spec/main/generated/docs-payload/03-shared-lists.md' },
    { url: 'https://raw.githubusercontent.com/FlowMCP/flowmcp-spec/main/generated/docs-payload/04-output-schema.md' },
    { url: 'https://raw.githubusercontent.com/FlowMCP/flowmcp-spec/main/generated/custom-gpt/README.md' }
]


const PROOF_DIR = path.resolve( process.cwd(), '../../proofs/phase-9-verification-2026-05-24/curl' )
mkdirSync( PROOF_DIR, { recursive: true } )


async function checkArtifact( { artifact } ) {
    const result = {
        url: artifact.url,
        status: 0,
        contentLength: 0,
        firstLine: null,
        jsonValid: null,
        pass: false,
        error: null
    }

    try {
        const resp = await fetch( artifact.url )
        result.status = resp.status

        if( resp.status !== 200 ) {
            result.error = `HTTP ${ resp.status }`
            return result
        }

        const text = await resp.text()
        result.contentLength = text.length

        if( text.length === 0 ) {
            result.error = 'empty content'
            return result
        }

        if( artifact.expectFirstLine ) {
            const firstLine = text.split( /\r?\n/ )[ 0 ]
            result.firstLine = firstLine
            if( firstLine !== artifact.expectFirstLine ) {
                result.error = `firstLine mismatch — expected "${ artifact.expectFirstLine }" got "${ firstLine }"`
                return result
            }
        } else {
            result.firstLine = text.split( /\r?\n/ )[ 0 ].slice( 0, 80 )
        }

        if( artifact.expectJsonValid ) {
            try {
                JSON.parse( text )
                result.jsonValid = true
            } catch( err ) {
                result.jsonValid = false
                result.error = `JSON parse error: ${ err.message }`
                return result
            }
        }

        result.pass = true
        return result
    } catch( err ) {
        result.error = err.message
        return result
    }
}


async function main() {
    console.log( '[curl-check-generated] checking', ARTIFACTS.length, 'artifacts...' )
    const results = []

    for( const artifact of ARTIFACTS ) {
        const result = await checkArtifact( { artifact } )
        const indicator = result.pass ? 'PASS' : 'FAIL'
        console.log( `  [${ indicator }] ${ result.status } ${ artifact.url.split( '/main/' )[ 1 ] }${ result.error ? ' — ' + result.error : '' }` )
        results.push( result )
    }

    const allPass = results.every( ( r ) => r.pass )
    const outputPath = path.join( PROOF_DIR, 'generated-artifacts.json' )
    const report = {
        timestamp: new Date().toISOString(),
        baseURL: 'https://raw.githubusercontent.com/FlowMCP/flowmcp-spec/main/generated/',
        total: results.length,
        passed: results.filter( ( r ) => r.pass ).length,
        failed: results.filter( ( r ) => !r.pass ).length,
        allPass,
        results
    }

    writeFileSync( outputPath, JSON.stringify( report, null, 2 ) )
    console.log( `\n[curl-check-generated] report -> ${ outputPath }` )
    console.log( `[curl-check-generated] ${ report.passed }/${ report.total } passed` )

    process.exit( allPass ? 0 : 1 )
}


main()
