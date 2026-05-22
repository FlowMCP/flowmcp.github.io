class DiagramRatio {
    static evaluate( { content } ) {
        const lines = content.split( '\n' ).length
        const mermaidCount = ( content.match( /```mermaid/g ) || [] ).length
        const pngCount = ( content.match( /!\[[^\]]*\]\([^)]+\.(png|jpg|jpeg|svg|webp)\)/gi ) || [] ).length
        const diagrams = mermaidCount + pngCount
        const needed = Math.max( 1, Math.ceil( lines / 200 ) )
        const issues = []

        if( diagrams < needed ) {
            issues.push( `Nur ${diagrams} Diagramm(e) bei ${lines} Zeilen — erwartet >= ${needed}` )
        }

        const score = diagrams >= needed ? 1.0 : Math.max( 0, diagrams / needed )
        return { score, max: 1.0, issues }
    }
}


export { DiagramRatio }
