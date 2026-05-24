import { describe, test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
    resolveDotPath,
    extractPlaceholders,
    reverseCheck,
    forwardCheck,
    applyMiniSkillInclude,
    applyPlaceholders
} from '../scripts/replace-placeholders.mjs'


const REFS = {
    spec: { currentVersion: '4.1.0', recommendedRelease: 'v4.1.0' },
    imports: { cli: { github: 'github:FlowMCP/flowmcp-cli#v4.1.0' } }
}


describe( 'replace-placeholders helpers', () => {
    test( 'resolveDotPath resolves nested keys', () => {
        const { value } = resolveDotPath( { obj: REFS, dotPath: 'imports.cli.github' } )
        assert.equal( value, 'github:FlowMCP/flowmcp-cli#v4.1.0' )
    } )

    test( 'resolveDotPath returns undefined for missing key', () => {
        const { value } = resolveDotPath( { obj: REFS, dotPath: 'spec.unknown' } )
        assert.equal( value, undefined )
    } )

    test( 'extractPlaceholders ignores include tokens', () => {
        const content = '{{spec.currentVersion}} {{include:mini-skill}} {{imports.cli.github}}'
        const { keys } = extractPlaceholders( { content } )
        assert.deepEqual( keys.sort(), [ 'imports.cli.github', 'spec.currentVersion' ] )
    } )

    test( 'applyPlaceholders resolves simple placeholder', () => {
        const { content, replaced } = applyPlaceholders( {
            content: 'Version: {{spec.currentVersion}}',
            refs: REFS
        } )
        assert.equal( content, 'Version: 4.1.0' )
        assert.equal( replaced, 1 )
    } )

    test( 'applyPlaceholders resolves nested placeholder', () => {
        const { content } = applyPlaceholders( {
            content: 'Install: {{imports.cli.github}}',
            refs: REFS
        } )
        assert.equal( content, 'Install: github:FlowMCP/flowmcp-cli#v4.1.0' )
    } )

    test( 'forwardCheck throws on unresolved placeholder', () => {
        assert.throws( () => {
            forwardCheck( { outputPath: 'test.md', content: 'Unknown: {{spec.unknownField}}' } )
        }, /forward-check/ )
    } )

    test( 'reverseCheck throws on missing key in refs', () => {
        assert.throws( () => {
            reverseCheck( { templatePath: 't.md', content: 'Bad: {{spec.bogus}}', refs: REFS } )
        }, /reverse-check/ )
    } )

    test( 'applyMiniSkillInclude replaces token with mini-skill content', () => {
        const { content, replaced } = applyMiniSkillInclude( {
            content: 'Before\n{{include:mini-skill}}\nAfter',
            miniSkill: 'MINI SKILL BODY'
        } )
        assert.equal( content, 'Before\nMINI SKILL BODY\nAfter' )
        assert.equal( replaced, 1 )
    } )

    test( 'applyMiniSkillInclude leaves content untouched if token absent', () => {
        const { content, replaced } = applyMiniSkillInclude( {
            content: 'No token here',
            miniSkill: 'X'
        } )
        assert.equal( content, 'No token here' )
        assert.equal( replaced, 0 )
    } )
} )
