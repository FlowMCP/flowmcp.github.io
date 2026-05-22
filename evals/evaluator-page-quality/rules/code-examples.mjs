class CodeExamples {
    static evaluate( { content } ) {
        const codeBlocks = content.match( /```[a-z]*\n[\s\S]*?\n```/g ) || []
        const issues = []

        if( codeBlocks.length === 0 ) {
            issues.push( 'Kein Code-Block gefunden' )
            return { score: 0.0, max: 0.5, issues }
        }

        const withOutput = codeBlocks.filter( ( b ) => /(\/\/|#|>)\s*(→|=>|->|Output|Result|Ausgabe)/i.test( b ) )

        if( withOutput.length === 0 ) {
            issues.push( `${codeBlocks.length} Code-Block(s) ohne Output-Annotation` )
            return { score: 0.25, max: 0.5, issues }
        }

        return { score: 0.5, max: 0.5, issues }
    }
}


export { CodeExamples }
