class GithubInstall {
    static evaluate( { content } ) {
        const npmInstallRegex = /npm\s+install\s+flowmcp(?!\S)/g
        const githubInstallRegex = /npm\s+install\s+github:/g

        const npmHits = content.match( npmInstallRegex ) || []
        const githubHits = content.match( githubInstallRegex ) || []
        const issues = []

        if( npmHits.length > 0 && githubHits.length === 0 ) {
            issues.push( `npm install flowmcp ohne github:-Prefix gefunden (${npmHits.length}x)` )
        }

        const score = ( npmHits.length === 0 || githubHits.length > 0 ) ? 0.5 : 0.0
        return { score, max: 0.5, issues }
    }
}


export { GithubInstall }
