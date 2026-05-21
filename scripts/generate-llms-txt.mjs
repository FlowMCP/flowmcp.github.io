import { readdir, readFile, writeFile, cp } from 'node:fs/promises'
import { join, relative } from 'node:path'
import diagramDescriptions from './diagram-descriptions.mjs'

// Memo 049 Phase 5 PRD-21:
// Schema-spec generation moved to flowmcp-spec/generated/llms-schema-spec.txt.
// This script now only produces site-content layers (llms.txt index, llms-full.txt,
// docs-llms.txt). Schema-spec is pulled via sync-spec.mjs into public/spec-generated/.

const DOCS_DIR = 'src/content/docs'
const OUTPUT_FULL = 'public/llms-full.txt'
const OUTPUT_DOCS = 'public/docs-llms.txt'
const OUTPUT_INDEX = 'public/llms.txt'

const HEADER_FULL = `# FlowMCP — Complete Website Content

> Normalize any data source and make it usable for AI agents.
> Open Source (MIT). Install: npm install -g github:FlowMCP/flowmcp-cli

Docs: https://flowmcp.github.io/docs
GitHub: https://github.com/flowmcp
Spec: https://raw.githubusercontent.com/FlowMCP/flowmcp-spec/refs/heads/main/spec/v4.0.0/llms.txt
`

const HEADER_DOCS = `# FlowMCP — Practical Documentation

> Normalize any data source and make it usable for AI agents.
> Open Source (MIT). Install: npm install -g github:FlowMCP/flowmcp-cli

This file contains practical documentation: getting started, schemas, agents, CLI reference.
For the formal specification, see: https://raw.githubusercontent.com/FlowMCP/flowmcp-spec/refs/heads/main/spec/v4.0.0/llms.txt
For a brief index, see: https://flowmcp.github.io/llms.txt
`

const HEADER_INDEX = `# FlowMCP — llms.txt Index

> Layered LLM context for FlowMCP. Pick the layer you need.

- Practical documentation: /docs-llms.txt
- Full website content: /llms-full.txt
- Schema specification (v4.0.0): https://raw.githubusercontent.com/FlowMCP/flowmcp-spec/main/generated/llms.txt

Spec source: https://github.com/FlowMCP/flowmcp-spec
Docs: https://flowmcp.github.io/docs
GitHub: https://github.com/flowmcp
`

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
