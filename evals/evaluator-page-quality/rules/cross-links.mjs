import { existsSync } from 'node:fs'
import path from 'node:path'


class CrossLinks {
    static evaluate( { content, filePath } ) {
        const regex = /\]\((\.\.?\/[^)]+\.(md|mdx))\)/g
        const baseDir = path.dirname( filePath )
        const issues = []

        const matches = Array.from( content.matchAll( regex ) )
        const total = matches.length
        let broken = 0

        matches.forEach( ( m ) => {
            const target = path.resolve( baseDir, m[ 1 ] )
            if( !existsSync( target ) ) {
                broken += 1
                issues.push( `Broken link: ${m[ 1 ]}` )
            }
        } )

        if( total === 0 ) {
            return { score: 0.5, max: 0.5, issues: [] }
        }

        const score = broken === 0 ? 0.5 : 0.0
        return { score, max: 0.5, issues }
    }
}


export { CrossLinks }
