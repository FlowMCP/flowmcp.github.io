class NoEmojis {
    static evaluate( { content, frontmatter } ) {
        const allowed = frontmatter?.allow_emojis === 'true' || frontmatter?.allow_emojis === true
        const regex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
        const found = content.match( regex )
        const issues = []

        if( found !== null && !allowed ) {
            issues.push( `Emoji gefunden: ${found[ 0 ]} (frontmatter.allow_emojis nicht gesetzt)` )
        }

        const score = ( found === null || allowed ) ? 0.5 : 0.0
        return { score, max: 0.5, issues }
    }
}


export { NoEmojis }
