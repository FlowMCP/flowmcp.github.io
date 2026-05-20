import { readdir, readFile, writeFile, cp } from 'node:fs/promises'
import { join, relative } from 'node:path'
import diagramDescriptions from './diagram-descriptions.mjs'

const DOCS_DIR = 'src/content/docs'
const SPEC_SOURCE_DIR = 'public/spec-source/v4.0.0'
const OUTPUT_FULL = 'public/llms-full.txt'
const OUTPUT_DOCS = 'public/docs-llms.txt'
const OUTPUT_INDEX = 'public/llms.txt'
const OUTPUT_SEARCH = 'public/llms-search.txt'
const OUTPUT_ADD_SOURCE = 'public/llms-add-source.txt'
const OUTPUT_SCHEMA_SPEC = 'public/llms-schema-spec.txt'

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

const HEADER_INDEX = `# FlowMCP — llms.txt Index (Layer 0)

> Layered LLM context for FlowMCP. Pick the layer you need.

- Layer 1 — Search guide: /llms-search.txt
- Layer 2 — Add a new source: /llms-add-source.txt
- Layer 3 — Schema specification (v4.0.0): /llms-schema-spec.txt
- Layer 4 — Full website content: /llms-full.txt

Spec source: https://raw.githubusercontent.com/FlowMCP/flowmcp-spec/refs/heads/main/spec/v4.0.0/llms.txt
Docs: https://flowmcp.github.io/docs
GitHub: https://github.com/flowmcp
`

const HEADER_SEARCH = `# FlowMCP — Search Guide (Layer 1)

> How to discover existing schemas, tools, and resources.
> Placeholder — content provided by Memo 047 (Content Strategy).

Index: /llms.txt
`

const HEADER_ADD_SOURCE = `# FlowMCP — Add a New Source (Layer 2)

> Step-by-step guide for adding a new data source as a FlowMCP schema.
> Placeholder — content provided by Memo 047 (Content Strategy).

Index: /llms.txt
`

const buildSchemaSpec = async () => {
    const entries = await readdir(SPEC_SOURCE_DIR, { withFileTypes: true })
    const mdFiles = entries
        .filter((e) => e.isFile() && e.name.endsWith('.md'))
        .map((e) => e.name)
        .sort()

    const sections = await Promise.all(
        mdFiles.map(async (file) => {
            const content = await readFile(join(SPEC_SOURCE_DIR, file), 'utf-8')
            return `\n\n## ${file}\n\n${content.trim()}`
        })
    )

    const header = `# FlowMCP — Schema Specification v4.0.0 (Layer 3)

> Auto-generated from public/spec-source/v4.0.0/
> Source: https://raw.githubusercontent.com/FlowMCP/flowmcp-spec/refs/heads/main/spec/v4.0.0/llms.txt
> Index: /llms.txt
`

    return header + sections.join('') + '\n'
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
    await writeFile(OUTPUT_SEARCH, HEADER_SEARCH, 'utf-8')
    await writeFile(OUTPUT_ADD_SOURCE, HEADER_ADD_SOURCE, 'utf-8')

    const schemaSpec = await buildSchemaSpec()
    await writeFile(OUTPUT_SCHEMA_SPEC, schemaSpec, 'utf-8')

    console.log(`llms.txt (index) generated: ${HEADER_INDEX.length} chars`)
    console.log(`  → ${OUTPUT_INDEX}`)
    console.log(`llms-search.txt (placeholder) generated: ${HEADER_SEARCH.length} chars`)
    console.log(`  → ${OUTPUT_SEARCH}`)
    console.log(`llms-add-source.txt (placeholder) generated: ${HEADER_ADD_SOURCE.length} chars`)
    console.log(`  → ${OUTPUT_ADD_SOURCE}`)
    console.log(`llms-schema-spec.txt generated: ${schemaSpec.length} chars`)
    console.log(`  → ${OUTPUT_SCHEMA_SPEC}`)
}

run()
