class LengthContentRatio {
    static evaluate( { content } ) {
        const allLines = content.split( '\n' )
        const lines = allLines.filter( ( l ) => l.trim().length > 0 )
        const words = content.split( /\s+/ ).filter( ( w ) => w.length > 0 ).length
        const ratio = lines.length === 0 ? 0 : words / lines.length
        const issues = []

        const headingCount = ( content.match( /^#{1,6}\s/gm ) || [] ).length
        const hasStructure = headingCount >= 2

        if( allLines.length > 400 && !hasStructure ) {
            issues.push( `${allLines.length} Zeilen ohne ausreichende Struktur (${headingCount} Headings)` )
            return { score: 0.5, max: 1.0, issues }
        }

        if( ratio < 4 ) {
            issues.push( `Wort/Zeilen-Ratio ${ratio.toFixed( 1 )} zu niedrig (< 4) — viele Leerzeilen oder Stub` )
            return { score: 0.5, max: 1.0, issues }
        }

        if( ratio > 25 ) {
            issues.push( `Wort/Zeilen-Ratio ${ratio.toFixed( 1 )} zu hoch (> 25) — kein Whitespace, schwer lesbar` )
            return { score: 0.5, max: 1.0, issues }
        }

        return { score: 1.0, max: 1.0, issues }
    }
}


export { LengthContentRatio }
