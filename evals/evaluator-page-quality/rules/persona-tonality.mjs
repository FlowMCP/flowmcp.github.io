class PersonaTonality {
    static evaluate( { content, frontmatter } ) {
        const persona = frontmatter?.persona_target || 'unknown'

        const personaSignals = {
            'Daniel': [ 'install', 'CLI', 'npm', 'schema', 'tool' ],
            'Sarah':  [ 'audit', 'compliance', 'governance', 'review' ],
            'Marko':  [ 'agent', 'use case', 'workflow', 'demo' ],
            'Mira':   [ 'quickstart', 'getting started', 'first', 'try' ]
        }

        const hypeWords = [ 'revolutionary', 'ai-native', 'cutting-edge', 'game-changer', 'next-gen' ]
        const lowered = content.toLowerCase()
        const hypeHits = hypeWords.filter( ( w ) => lowered.includes( w ) )
        const issues = []

        if( hypeHits.length > 0 ) {
            issues.push( `Marketing-Hype gefunden: ${hypeHits.join( ', ' )}` )
        }

        if( persona === 'unknown' ) {
            issues.push( 'frontmatter.persona_target nicht gesetzt' )
            const baseScore = hypeHits.length === 0 ? 0.5 : 0.25
            return { score: baseScore, max: 1.0, issues }
        }

        const signals = personaSignals[ persona ] || []
        const hits = signals.filter( ( s ) => lowered.includes( s.toLowerCase() ) ).length
        const ratio = signals.length === 0 ? 0 : hits / signals.length

        if( ratio < 0.4 ) {
            issues.push( `Persona-Signals "${persona}" zu schwach (${hits}/${signals.length})` )
            const score = hypeHits.length === 0 ? 0.5 : 0.25
            return { score, max: 1.0, issues }
        }

        const score = hypeHits.length === 0 ? 1.0 : 0.75
        return { score, max: 1.0, issues }
    }
}


export { PersonaTonality }
