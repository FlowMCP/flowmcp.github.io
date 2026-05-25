// generate-markdown-map.test.mjs — Memo 060 Phase 7 PRD-023
// node:test runner for the build script that emits public/markdown-sources/{slug}.md
// per docs page. Validates script invocation, expected slugs, frontmatter stripping
// and DE-slug preservation.

import { describe, test, before } from 'node:test'
import { strict as assert } from 'node:assert'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'


const __dirname = dirname( fileURLToPath( import.meta.url ) )
const REPO_ROOT = join( __dirname, '..' )
const OUT_DIR = join( REPO_ROOT, 'public', 'markdown-sources' )

const REQUIRED_SLUGS = [
    'guides/hackathon-kit.md',
    'guides/agent-creation.md',
    'guides/gtfs-pilot.md',
    'quickstart/installation.md',
    'de/quickstart/installation.md'
]


describe( 'generate-markdown-map build script', () => {
    before( () => {
        execSync( 'node scripts/generate-markdown-map.mjs', { cwd: REPO_ROOT, stdio: 'pipe' } )
    } )

    test( 'script run exits without throwing', () => {
        // before() already invoked the script and would have thrown on non-zero exit
        assert.ok( true )
    } )

    test( 'output directory exists after run', () => {
        assert.equal( existsSync( OUT_DIR ), true, `expected ${ OUT_DIR } to exist` )
        const stat = statSync( OUT_DIR )
        assert.equal( stat.isDirectory(), true, `expected ${ OUT_DIR } to be a directory` )
    } )

    test( 'output contains expected tutorial slugs', () => {
        const missing = REQUIRED_SLUGS.filter( ( slug ) => !existsSync( join( OUT_DIR, slug ) ) )
        assert.deepEqual( missing, [], `missing expected output files: ${ missing.join( ', ' ) }` )
    } )

    test( 'frontmatter is stripped from generated markdown', () => {
        const sample = readFileSync( join( OUT_DIR, 'guides/hackathon-kit.md' ), 'utf8' )
        const firstLine = sample.split( '\n' )[ 0 ]
        assert.notEqual( firstLine, '---', `expected first line not to be frontmatter delimiter, got: ${ firstLine }` )
    } )

    test( 'DE slugs keep their de/ prefix', () => {
        const dePath = join( OUT_DIR, 'de/quickstart/installation.md' )
        assert.equal( existsSync( dePath ), true, `expected ${ dePath } to exist` )
    } )

    test( 'slug consistency — source mdx maps to expected output path', () => {
        const sourceMdx = join( REPO_ROOT, 'src', 'content', 'docs', 'guides', 'hackathon-kit.mdx' )
        const expectedOut = join( OUT_DIR, 'guides', 'hackathon-kit.md' )
        assert.equal( existsSync( sourceMdx ), true, `source ${ sourceMdx } missing` )
        assert.equal( existsSync( expectedOut ), true, `expected ${ expectedOut } missing` )
    } )

    test( 'generated body is non-empty for known tutorial', () => {
        const body = readFileSync( join( OUT_DIR, 'guides/hackathon-kit.md' ), 'utf8' )
        assert.ok( body.length > 100, `expected non-trivial body, got length ${ body.length }` )
    } )
} )
