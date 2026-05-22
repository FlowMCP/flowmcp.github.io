import { readFile, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'

import { PersonaTonality }    from './rules/persona-tonality.mjs'
import { DiagramRatio }       from './rules/diagram-ratio.mjs'
import { NoEmojis }           from './rules/no-emojis.mjs'
import { GithubInstall }      from './rules/github-install.mjs'
import { DePendant }          from './rules/de-pendant.mjs'
import { CrossLinks }         from './rules/cross-links.mjs'
import { CodeExamples }       from './rules/code-examples.mjs'
import { LengthContentRatio } from './rules/length-content-ratio.mjs'


const SCRIPT_DIR = path.dirname( new URL( import.meta.url ).pathname )
const REPO_ROOT  = path.resolve( SCRIPT_DIR, '../..' )
const DOCS_ROOT  = path.join( REPO_ROOT, 'src/content/docs' )
const CRITERIA_PATH = path.join( SCRIPT_DIR, 'criteria.json' )


class PageQualityRunner {
    static async evaluateFile( { filePath, criteria, dryRun, repoRoot } ) {
        const raw = await readFile( filePath, 'utf-8' )
        const { frontmatter, body } = PageQualityRunner.parseFrontmatter( { raw } )
        const ctx = { content: body, frontmatter, filePath, repoRoot }

        const dePendantResult = await DePendant.evaluate( ctx )

        const results = [
            { name: 'persona-tonality',     ...PersonaTonality.evaluate( ctx ) },
            { name: 'diagram-ratio',        ...DiagramRatio.evaluate( ctx ) },
            { name: 'no-emojis',            ...NoEmojis.evaluate( ctx ) },
            { name: 'github-install',       ...GithubInstall.evaluate( ctx ) },
            { name: 'de-pendant',           ...dePendantResult },
            { name: 'cross-links',          ...CrossLinks.evaluate( ctx ) },
            { name: 'code-examples',        ...CodeExamples.evaluate( ctx ) },
            { name: 'length-content-ratio', ...LengthContentRatio.evaluate( ctx ) }
        ]

        const total = results.reduce( ( acc, r ) => acc + r.score, 0 )
        const grade = PageQualityRunner.scoreToGrade( { score: total, criteria } )
        const allIssues = results.flatMap( ( r ) => r.issues )

        if( !dryRun ) {
            await PageQualityRunner.writeFrontmatter( {
                filePath, raw,
                pageQuality: {
                    grade,
                    evaluated_at: new Date().toISOString(),
                    evaluator: 'evaluator-page-quality@1.0.0',
                    issues: allIssues,
                    persona_target: frontmatter?.persona_target || 'unknown'
                }
            } )
        }

        return { filePath, score: total, grade, issues: allIssues, ruleResults: results }
    }


    static scoreToGrade( { score, criteria } ) {
        const match = criteria.gradeMapping.find( ( m ) => score >= m.minScore )
        return match ? match.grade : 1
    }


    static parseFrontmatter( { raw } ) {
        const m = raw.match( /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/ )
        if( m === null ) {
            return { frontmatter: {}, body: raw }
        }

        const frontmatter = {}
        m[ 1 ].split( '\n' ).forEach( ( line ) => {
            const kv = line.match( /^([a-z_]+):\s*(.*)$/ )
            if( kv !== null ) {
                const value = kv[ 2 ].replace( /^["']|["']$/g, '' ).trim()
                frontmatter[ kv[ 1 ] ] = value
            }
        } )

        return { frontmatter, body: m[ 2 ] }
    }


    static async writeFrontmatter( { filePath, raw, pageQuality } ) {
        const blockLines = [
            'page_quality:',
            `  grade: ${pageQuality.grade}`,
            `  evaluated_at: "${pageQuality.evaluated_at}"`,
            `  evaluator: "${pageQuality.evaluator}"`,
            `  persona_target: "${pageQuality.persona_target}"`,
            '  issues:'
        ]

        if( pageQuality.issues.length === 0 ) {
            blockLines.push( '    []' )
        } else {
            pageQuality.issues.forEach( ( i ) => {
                const safe = i.replace( /"/g, "'" )
                blockLines.push( `    - "${safe}"` )
            } )
        }

        const block = blockLines.join( '\n' )
        const headerMatch = raw.match( /^---\n([\s\S]*?)\n---/ )

        if( headerMatch === null ) {
            const newRaw = `---\n${block}\n---\n${raw}`
            await writeFile( filePath, newRaw, 'utf-8' )
            return
        }

        const existingHeader = headerMatch[ 1 ]
        const withoutOldBlock = existingHeader.replace( /\n?page_quality:[\s\S]*?(?=\n[a-z_]+:|\n*$)/g, '' )
        const newHeader = `${withoutOldBlock.trimEnd()}\n${block}`
        const newRaw = raw.replace( headerMatch[ 0 ], `---\n${newHeader}\n---` )

        await writeFile( filePath, newRaw, 'utf-8' )
    }


    static async listAllMarkdown( { dir } ) {
        const entries = await readdir( dir, { withFileTypes: true } )
        const out = []

        const subTasks = entries.map( async ( e ) => {
            const full = path.join( dir, e.name )
            if( e.isDirectory() ) {
                const sub = await PageQualityRunner.listAllMarkdown( { dir: full } )
                return sub
            }
            if( e.name.endsWith( '.md' ) || e.name.endsWith( '.mdx' ) ) {
                return [ full ]
            }
            return []
        } )

        const collected = await Promise.all( subTasks )
        collected.forEach( ( arr ) => out.push( ...arr ) )

        return out.sort()
    }
}


const args = process.argv.slice( 2 )
const fileArg = args.find( ( a ) => a.startsWith( '--file=' ) )
const allFlag = args.includes( '--all' )
const dryRun  = args.includes( '--dry-run' )

const criteriaRaw = await readFile( CRITERIA_PATH, 'utf-8' )
const criteria = JSON.parse( criteriaRaw )

const targets = []
if( fileArg !== undefined ) {
    targets.push( path.resolve( REPO_ROOT, fileArg.replace( '--file=', '' ) ) )
}
if( allFlag ) {
    const all = await PageQualityRunner.listAllMarkdown( { dir: DOCS_ROOT } )
    targets.push( ...all )
}

if( targets.length === 0 ) {
    console.error( 'Usage: node runner.mjs --file=<path> | --all [--dry-run]' )
    process.exit( 1 )
}


const results = await targets.reduce( async ( prevPromise, t ) => {
    const acc = await prevPromise
    const res = await PageQualityRunner.evaluateFile( { filePath: t, criteria, dryRun, repoRoot: REPO_ROOT } )
    acc.push( res )
    console.log( `Grade ${res.grade} (score ${res.score.toFixed( 2 )}) — ${path.relative( REPO_ROOT, res.filePath )}` )
    res.issues.forEach( ( i ) => console.log( `   - ${i}` ) )
    return acc
}, Promise.resolve( [] ) )


const avg = results.length === 0 ? 0 : results.reduce( ( a, r ) => a + r.grade, 0 ) / results.length
const avgScore = results.length === 0 ? 0 : results.reduce( ( a, r ) => a + r.score, 0 ) / results.length

console.log( `\nDurchschnitt: Grade ${avg.toFixed( 2 )} (Score ${avgScore.toFixed( 2 )}) ueber ${results.length} Seiten` )

export { PageQualityRunner }
