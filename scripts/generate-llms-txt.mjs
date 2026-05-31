import { readdir, readFile, writeFile, cp } from 'node:fs/promises'
import { join, relative } from 'node:path'
import diagramDescriptions from './diagram-descriptions.mjs'

// Memo 049 Phase 5 PRD-21:
// Schema-spec generation moved to flowmcp-spec/generated/llms-schema-spec.txt.
// This script now only produces site-content layers (llms.txt index, llms-full.txt,
// docs-llms.txt). Schema-spec is pulled via sync-spec.mjs into public/spec-generated/.
//
// Memo 056 PRD-25: Header strings now read from src/data/refs.json (R8 Placeholder-First).

const DOCS_DIR = 'src/content/docs'
const OUTPUT_FULL = 'public/llms-full.txt'
const OUTPUT_DOCS = 'public/docs-llms.txt'
const OUTPUT_INDEX = 'public/llms.txt'
const REFS_PATH = 'src/data/refs.json'


// Memo 056 PRD-25: Strict-Mode refs loading — no silent defaults.
const loadRefs = async () => {
    const raw = await readFile( REFS_PATH, 'utf8' )
    const refs = JSON.parse( raw )
    const checks = [
        [ 'spec.currentVersion', refs.spec?.currentVersion ],
        [ 'llmsFiles.specUrl', refs.llmsFiles?.specUrl ],
        [ 'imports.cli.npmInstallCommand', refs.imports?.cli?.npmInstallCommand ]
    ]
    const missing = checks
        .filter( ( [ , value ] ) => typeof value !== 'string' )
        .map( ( [ field ] ) => field )
    if( missing.length > 0 ) {
        throw new Error( `[generate-llms-txt] missing required fields in ${ REFS_PATH }: ${ missing.join( ', ' ) }` )
    }
    return { refs }
}


const buildHeaders = ( { refs } ) => {
    const specVersion = refs.spec.currentVersion
    const specUrl = refs.llmsFiles.specUrl
    const installCommand = refs.imports.cli.npmInstallCommand

    const HEADER_FULL = `# FlowMCP — Complete Website Content

> Normalize any data source and make it usable for AI agents.
> Open Source (MIT). Install: ${ installCommand }

Docs: https://flowmcp.github.io/docs
GitHub: https://github.com/flowmcp
Spec: ${ specUrl }
`

    const HEADER_DOCS = `# FlowMCP — Practical Documentation

> Normalize any data source and make it usable for AI agents.
> Open Source (MIT). Install: ${ installCommand }

This file contains practical documentation: getting started, schemas, agents, CLI reference.
For the formal specification, see: ${ specUrl }
For a brief index, see: https://flowmcp.github.io/llms.txt
`

    // Memo 086 PRD-08: name the Grading standard in the index. Uses refs.grading
    // when present (post-fetch), else the stable docs URL — no hardcoded version.
    const gradingLine = refs.grading?.url
        ? `- Grading standard (gradingSpec v${ refs.grading.currentVersion }): ${ refs.grading.url }`
        : '- Grading standard (gradingSpec): https://flowmcp.github.io/grading/overview/'

    const HEADER_INDEX = `# FlowMCP — llms.txt Index

> Layered LLM context for FlowMCP. Pick the layer you need.

- Practical documentation: /docs-llms.txt
- Full website content (includes the Grading standard inline): /llms-full.txt
- Schema specification (v${ specVersion }): ${ specUrl }
${ gradingLine }

Spec source: https://github.com/FlowMCP/flowmcp-spec
Docs: https://flowmcp.github.io/docs
GitHub: https://github.com/flowmcp
`

    return { HEADER_FULL, HEADER_DOCS, HEADER_INDEX }
}

const SIDEBAR_ORDER = [
    'introduction/about',
    'introduction/why',
    'introduction/for-llms',
    'basics/schemas-and-tools',
    'basics/agents',
    'basics/clients',
    'roadmap/overview',
    'roadmap/community',
    'roadmap/integration',
    'roadmap/team',
]

const stripFrontmatter = (content) => {
    const match = content.match(/^---\n[\s\S]*?\n---\n/)
    return match ? content.slice(match[0].length).trim() : content.trim()
}

const replaceImages = (content) =>
    content.replace(/!\[.*?\]\((.*?)\)/g, (match, url) => {
        const filename = url.split('/').pop().replace(/\.\w+$/, '')
        const mermaid = diagramDescriptions[filename]
        if (mermaid) return '\n```mermaid\n' + mermaid + '\n```\n'
        return ''
    })

const stripLinks = (content) =>
    content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
        if (url.startsWith('http')) return `${text} (${url})`
        if (url.startsWith('/')) return text
        return text
    })

const extractTitle = (content) => {
    const match = content.match(/^title:\s*(.+)$/m)
    return match ? match[1].trim() : null
}

const collectMdFiles = async (dir, baseDir) => {
    const entries = await readdir(dir, { withFileTypes: true })
    const results = await Promise.all(
        entries.map(async (entry) => {
            const fullPath = join(dir, entry.name)
            if (entry.isDirectory() && entry.name !== 'de') {
                return collectMdFiles(fullPath, baseDir)
            }
            if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'index.mdx') {
                const rel = relative(baseDir, fullPath)
                const slug = rel.replace(/\.(md|mdx)$/, '')
                return [{ path: fullPath, slug }]
            }
            return []
        })
    )
    return results.flat()
}

const run = async () => {
    const { refs } = await loadRefs()
    const { HEADER_FULL, HEADER_DOCS, HEADER_INDEX } = buildHeaders( { refs } )

    const mdFiles = await collectMdFiles(DOCS_DIR, DOCS_DIR)

    const pages = await Promise.all(
        mdFiles.map(async ({ path: filePath, slug }) => {
            const raw = await readFile(filePath, 'utf-8')
            const title = extractTitle(raw)
            const body = stripLinks(replaceImages(stripFrontmatter(raw)))
            return { slug, title, body }
        })
    )

    const ordered = SIDEBAR_ORDER
        .map(slug => pages.find(p => p.slug === slug))
        .filter(Boolean)

    const unordered = pages.filter(p => !SIDEBAR_ORDER.includes(p.slug))
    const allPages = [...ordered, ...unordered]

    const sections = allPages.map(({ slug, title, body }) =>
        `---\n\n# ${title || slug}\n/${slug}\n\n${body}`
    )

    const docsPages = allPages.filter(p => p.slug.startsWith('docs/'))
    const docsSections = docsPages.map(({ slug, title, body }) =>
        `---\n\n# ${title || slug}\n/${slug}\n\n${body}`
    )

    const outputFull = HEADER_FULL + '\n' + sections.join('\n\n') + '\n'
    const outputDocs = HEADER_DOCS + '\n' + docsSections.join('\n\n') + '\n'

    await writeFile(OUTPUT_FULL, outputFull, 'utf-8')
    await writeFile(OUTPUT_DOCS, outputDocs, 'utf-8')

    console.log(`llms-full.txt generated: ${allPages.length} pages, ${outputFull.length} chars`)
    console.log(`  → ${OUTPUT_FULL}`)
    console.log(`docs-llms.txt generated: ${docsPages.length} pages, ${outputDocs.length} chars`)
    console.log(`  → ${OUTPUT_DOCS}`)

    await writeFile(OUTPUT_INDEX, HEADER_INDEX, 'utf-8')

    console.log(`llms.txt (index) generated: ${HEADER_INDEX.length} chars`)
    console.log(`  → ${OUTPUT_INDEX}`)
}

run()
