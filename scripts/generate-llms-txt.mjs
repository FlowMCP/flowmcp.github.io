import { readdir, readFile, writeFile, cp } from 'node:fs/promises'
import { join, relative } from 'node:path'
import diagramDescriptions from './diagram-descriptions.mjs'

const DOCS_DIR = 'src/content/docs'
const OUTPUT_PATH = 'public/llm/llms.txt'
const OUTPUT_ROOT = 'public/llms.txt'

const HEADER = `# FlowMCP — llms.txt

> Normalize any data source and make it usable for AI agents.
> Build your own agent in 5 minutes.

Docs: https://flowmcp.github.io/
GitHub: https://github.com/flowmcp
License: MIT — Open Source, free for everyone.

FlowMCP Docs: https://docs.flowmcp.org/llms.txt
FlowMCP Spec: https://github.com/FlowMCP/flowmcp-spec/blob/main/spec/v3.0.0/llms.txt
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

    const output = HEADER + '\n' + sections.join('\n\n') + '\n'

    await writeFile(OUTPUT_PATH, output, 'utf-8')
    await writeFile(OUTPUT_ROOT, output, 'utf-8')

    console.log(`llms.txt generated: ${allPages.length} pages, ${output.length} chars`)
    console.log(`  → ${OUTPUT_PATH}`)
    console.log(`  → ${OUTPUT_ROOT}`)
}

run()
