import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'


class DePendant {
    static async evaluate( { content, filePath, repoRoot } ) {
        const docsRoot = path.join( repoRoot, 'src/content/docs' )
        const rel = path.relative( docsRoot, filePath )
        const isEn = !rel.startsWith( 'de/' ) && !rel.startsWith( `de${path.sep}` )

        const counterpartRel = isEn
            ? path.join( 'de', rel )
            : rel.replace( /^de[\/\\]/, '' )
        const counterpartPath = path.join( docsRoot, counterpartRel )

        const issues = []

        if( !existsSync( counterpartPath ) ) {
            issues.push( `Pendant fehlt: ${counterpartRel}` )
            return { score: 0.0, max: 1.0, issues }
        }

        const counterpart = await readFile( counterpartPath, 'utf-8' )
        const linesA = content.split( '\n' ).length
        const linesB = counterpart.split( '\n' ).length
        const delta = Math.abs( linesA - linesB )

        if( delta > 30 ) {
            issues.push( `Pendant-Delta ${delta} Zeilen (> 30)` )
            return { score: 0.5, max: 1.0, issues }
        }

        return { score: 1.0, max: 1.0, issues }
    }
}


export { DePendant }
