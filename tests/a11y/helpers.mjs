// Shared a11y test helpers — Memo 057 PRD-07
// Wraps @axe-core/playwright with a small DSL: runAxe + assertNoViolations.

import AxeBuilder from '@axe-core/playwright'


const runAxe = async ( { page, include, exclude, tags } ) => {
    const builder = new AxeBuilder( { page } )
    if( include ) { builder.include( include ) }
    if( exclude ) { builder.exclude( exclude ) }
    if( tags ) { builder.withTags( tags ) }
    const results = await builder.analyze()
    return results
}


const formatViolations = ( violations ) => {
    return violations
        .map( ( v ) => `- [${v.id}] ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? '' : 's'})` )
        .join( '\n' )
}


const assertNoViolations = ( { results, expect, label } ) => {
    const v = results.violations
    if( v.length === 0 ) {
        expect( v ).toEqual( [] )
        return
    }
    const msg = `axe-core violations${label ? ` (${label})` : ''}:\n${formatViolations( v )}`
    expect( v, msg ).toEqual( [] )
}


export { runAxe, assertNoViolations, formatViolations }
