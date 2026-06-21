// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeMermaid from 'rehype-mermaid';
import { SidebarLoader } from './src/data/sidebar.mjs';


// Memo 056 PRD-16: Sidebar Specification-Section wird aus dem Manifest geladen.
// Memo 059 PRD-007: specVersion from manifest.spec_version (single source of truth)
// surfaced as a single badge on the top-level Specification group label.
const specSidebar = SidebarLoader.buildSidebar();
const specVersionShort = specSidebar.specVersion.replace( /\.0$/, '' );
const specBadge = { text: `v${ specVersionShort }`, variant: 'note' };

// Memo 086 PRD-07: separate Grading nav group (point 5) + second badge,
// built from manifest.grading. Empty when no grading block is synced yet.
const gradingSidebar = SidebarLoader.buildGradingSidebar();
const gradingGroup = gradingSidebar
    ? [ {
        label: 'Grading',
        translations: { de: 'Grading' },
        collapsed: true,
        badge: { text: `v${ gradingSidebar.gradingVersion.replace( /\.0$/, '' ) }`, variant: 'note' },
        items: gradingSidebar.items,
    } ]
    : [];

// Memo 108: third nav group — Best Practice (advisory track) + own badge,
// built from manifest.bestPractice. Empty when no best-practice block is synced.
const bestPracticeSidebar = SidebarLoader.buildBestPracticeSidebar();
const bestPracticeGroup = bestPracticeSidebar
    ? [ {
        label: 'Best Practice',
        translations: { de: 'Best Practice' },
        collapsed: true,
        badge: { text: `v${ bestPracticeSidebar.bestPracticeVersion.replace( /\.0$/, '' ) }`, variant: 'note' },
        items: bestPracticeSidebar.items,
    } ]
    : [];


// Memo 069: open external links in a new tab. Self-contained rehype plugin
// (no extra dependency) that adds target="_blank" + rel to every <a> whose
// href is an absolute http(s) URL outside flowmcp.github.io / flowmcp.org.
// Internal links (relative or own-domain) are left untouched.
const rehypeExternalLinksNewTab = () => {
    const isExternal = ( href ) => {
        if( typeof href !== 'string' ) { return false }
        if( !/^https?:\/\//i.test( href ) ) { return false }
        return !/^https?:\/\/(www\.)?(flowmcp\.github\.io|flowmcp\.org)(\/|$)/i.test( href )
    }

    const walk = ( node ) => {
        if( node.type === 'element' && node.tagName === 'a' && isExternal( node.properties?.href ) ) {
            node.properties.target = '_blank'
            node.properties.rel = [ 'noopener', 'noreferrer' ]
        }
        if( Array.isArray( node.children ) ) {
            node.children.forEach( ( child ) => walk( child ) )
        }
    }

    return ( tree ) => { walk( tree ) }
}


export default defineConfig({
    site: 'https://flowmcp.github.io',
    markdown: {
        rehypePlugins: [
            [ rehypeMermaid, { strategy: 'inline-svg', mermaidConfig: { theme: 'neutral' } } ],
            rehypeExternalLinksNewTab,
        ],
    },
    redirects: {
        // Memo 096: geojson/csv add-on posts renamed from "-sealed-sqlite"
        // to "-url-in-memory" (the add-on is now URL + in-memory, not a converter).
        '/blog/2026-06-geojson-sealed-sqlite/':     '/blog/2026-06-geojson-url-in-memory/',
        '/de/blog/2026-06-geojson-sealed-sqlite/':  '/de/blog/2026-06-geojson-url-in-memory/',
        '/blog/2026-06-csv-tsv-sealed-sqlite/':     '/blog/2026-06-csv-tsv-url-in-memory/',
        '/de/blog/2026-06-csv-tsv-sealed-sqlite/':  '/de/blog/2026-06-csv-tsv-url-in-memory/',

        '/docs': '/quickstart/what-is-flowmcp/',
        '/specification': '/specification/overview/',

        // PRD-06: IA-Refactor URL-Mappings (REV-05 Kap. 6.3)
        // Memo 060 PRD-007 (Phase 2): Concepts auf 4 Eintraege konsolidiert,
        // alte URLs zeigen jetzt auf die neuen Ziele (schemas, tools, primitives, clients).
        '/basics/schemas-and-tools/':         '/concepts/schemas/',
        '/basics/schema-catalog/':            '/concepts/schemas/',
        '/basics/agents/':                    '/concepts/primitives/',
        '/basics/clients/':                   '/concepts/clients/',

        '/docs/getting-started/what-is-flowmcp/': '/quickstart/what-is-flowmcp/',
        '/docs/getting-started/installation/':    '/quickstart/installation/',
        '/docs/getting-started/quickstart/':      '/quickstart/quickstart/',
        '/docs/getting-started/how-it-works/':    '/quickstart/how-it-works/',

        // Memo 060 PRD-007: alte Concepts-Sub-Pages -> neue 4-Eintrag-Struktur
        '/docs/schemas/overview/':       '/concepts/schemas/',
        '/docs/schemas/tools/':          '/concepts/primitives/',
        '/docs/schemas/resources/':      '/concepts/primitives/',
        '/docs/schemas/prompts/':        '/concepts/primitives/',
        '/docs/schemas/skills/':         '/concepts/primitives/',
        '/docs/schemas/tags-reference/': '/concepts/schemas/',
        '/reference/tags-reference/':    '/concepts/schemas/',
        '/de/reference/tags-reference/': '/de/concepts/schemas/',

        // Memo 064 Phase 3 PRD-006: Tools-Konzept in Primitives gemergt.
        // Tools ist ein Primitive -> Concept-Seite entfernt, Redirect auf Primitives.
        '/concepts/tools/':                '/concepts/primitives/',
        '/de/concepts/tools/':             '/de/concepts/primitives/',

        // Memo 060 PRD-007: Concepts-Sidebar-Loeschungen -> Redirects auf neue Ziele
        '/concepts/schema-catalog/':       '/concepts/schemas/',
        '/concepts/tag-search/':           '/concepts/schemas/',
        '/concepts/schemas-overview/':     '/concepts/schemas/',
        '/concepts/schemas-and-tools/':    '/concepts/schemas/',
        '/concepts/schemas-tools/':        '/concepts/primitives/',
        '/concepts/schemas-resources/':    '/concepts/primitives/',
        '/concepts/schemas-prompts/':      '/concepts/primitives/',
        '/concepts/schemas-skills/':       '/concepts/primitives/',
        '/concepts/agents/':               '/concepts/primitives/',
        '/de/concepts/schema-catalog/':    '/de/concepts/schemas/',
        '/de/concepts/tag-search/':        '/de/concepts/schemas/',
        '/de/concepts/schemas-overview/':  '/de/concepts/schemas/',
        '/de/concepts/schemas-and-tools/': '/de/concepts/schemas/',
        '/de/concepts/schemas-tools/':     '/de/concepts/primitives/',
        '/de/concepts/schemas-resources/': '/de/concepts/primitives/',
        '/de/concepts/schemas-prompts/':   '/de/concepts/primitives/',
        '/de/concepts/schemas-skills/':    '/de/concepts/primitives/',
        '/de/concepts/agents/':            '/de/concepts/primitives/',

        '/docs/agents/overview/':        '/concepts/primitives/',
        '/concepts/agents-overview/':    '/concepts/primitives/',
        '/de/concepts/agents-overview/': '/de/concepts/primitives/',

        // Memo 142: Reference section removed; legacy URLs repoint to surviving pages.
        '/docs/usage/cli/':              '/quickstart/quickstart/',
        '/docs/usage/mcp-server/':       '/specification/mcp-integration/',

        '/docs/guides/schema-creation/':    '/guides/schema-creation/',
        '/docs/guides/examples/':           '/guides/examples/',
        '/docs/guides/server-integration/': '/guides/server-integration/',

        '/docs/reference/core-methods/':    '/quickstart/quickstart/',
        '/docs/reference/cli-reference/':   '/quickstart/quickstart/',
        '/reference/cli-reference/':        '/quickstart/quickstart/',
        '/de/reference/cli-reference/':     '/de/quickstart/quickstart/',
        '/docs/reference/troubleshooting/': '/about/',
        '/reference/troubleshooting/':      '/about/',
        '/de/reference/troubleshooting/':   '/de/about/',

        '/docs/ecosystem/agentprobe/':      '/specification/overview/',
        '/docs/ecosystem/x402/':            '/specification/overview/',

        '/docs/specification/overview/':            '/specification/overview/',
        '/docs/specification/schema-format/':       '/specification/schema-format/',
        '/docs/specification/parameters/':          '/specification/parameters/',
        '/docs/specification/shared-lists/':        '/specification/shared-lists/',
        '/docs/specification/skills/':              '/specification/skills/',
        '/docs/specification/agents/':              '/specification/agents/',
        '/docs/specification/resources/':           '/specification/resources/',
        '/docs/specification/catalog/':             '/specification/catalog/',
        '/docs/specification/id-schema/':           '/specification/id-schema/',
        '/docs/specification/validation-rules/':    '/specification/validation-rules/',
        '/docs/specification/migration/':           '/specification/migration/',
        '/docs/specification/security/':            '/specification/security/',
        '/docs/specification/output-schema/':       '/specification/output-schema/',
        '/docs/specification/route-tests/':         '/specification/tests/',
        '/docs/specification/preload/':             '/specification/preload/',
        '/docs/specification/groups-prompts/':      '/specification/groups-prompts/',
        '/docs/specification/tests/':               '/specification/tests/',
        '/docs/specification/prompt-architecture/': '/specification/prompt-architecture/',

        // PRD-27: DE Slug-Vereinheitlichung (Memo 052 Phase 7)
        // Memo 058 PRD-04: for-decision-makers consolidated into /about/.
        '/de/about/fuer-entscheider/': '/de/about/',
        '/about/for-decision-makers/': '/about/',
        '/de/about/for-decision-makers/': '/de/about/',
        '/introduction/about/': '/about/',
        '/de/introduction/about/': '/de/about/',
        '/introduction/why/': '/about/',
        '/de/introduction/why/': '/de/about/',
        '/introduction/faq/': '/about/',
        '/de/introduction/faq/': '/de/about/',

        // PRD-015 (Memo 060) → Memo 142: License & ToS FAQ now points to the spec license page.
        '/license-faq/':    '/specification/license-and-tos/',
        '/de/license-faq/': '/de/specification/license-and-tos/',
    },
    integrations: [
        starlight({
            title: 'FlowMCP',
            favicon: '/favicon.svg',
            defaultLocale: 'root',
            locales: {
                root: {
                    label: 'English',
                    lang: 'en',
                },
                de: {
                    label: 'Deutsch',
                    lang: 'de',
                },
            },
            customCss: ['./src/styles/custom.css'],
            expressiveCode: {
                themes: ['github-dark'],
            },
            plugins: [],
            components: {
                Header: './src/components/Header.astro',
                MobileMenuToggle: './src/components/MobileMenuToggle.astro',
                Footer: './src/components/Footer.astro',
                PageTitle: './src/components/PageTitleWithBreadcrumb.astro',
                SiteTitle: './src/components/SiteTitleCustom.astro',
                Head: './src/components/Head.astro',
                Search: './src/components/SearchCustom.astro',
            },
            social: [
                { icon: 'github', label: 'GitHub', href: 'https://github.com/flowmcp' },
            ],
            head: [
                {
                    tag: 'script',
                    attrs: { defer: true },
                    content: `
                        function setMobileClass() {
                            var w = window.innerWidth;
                            document.body.classList.toggle('is-mobile', w < 800);
                            document.body.classList.toggle('is-desktop', w >= 800);
                            document.body.classList.add('has-pencil-hero-detection');
                        }
                        document.addEventListener('DOMContentLoaded', setMobileClass);
                        document.addEventListener('astro:page-load', setMobileClass);
                        window.addEventListener('resize', setMobileClass);
                    `,
                },
            ],
            sidebar: [
                {
                    label: 'About',
                    translations: { de: 'Ueber FlowMCP' },
                    collapsed: true,
                    items: [
                        // Memo 142 (REMOVE): FAQ, Use Cases, Schemas & Sources moved to
                        // .trash/memo-142-reduction (default-out reduction principle).
                        { label: 'About FlowMCP', translations: { de: 'Ueber FlowMCP' }, slug: 'about' },
                    ],
                },
                // Memo 059 PRD-011: Quickstart + Guides merged into "Get Started" (B3/B7).
                // Inline-Listing (Variant A) — flat list, no sub-group. AC-3: exactly 4 items.
                // PRD-013 audit: DE-Mirror via Starlight `translations` keys — both locales
                // render 6 groups with localized labels (Loslegen, Konzepte, etc.).
                // Memo 060 PRD-016 (QS3 + LM1): "Quickstart" -> "CLI Setup", For LLMs aufgenommen.
                {
                    label: 'Get Started',
                    translations: { de: 'Loslegen' },
                    collapsed: true,
                    items: [
                        // Memo 060 PRD-016 (QS3): "Quickstart" -> "CLI Setup" (DE bewusst englisch, analog "Tag Search").
                        // Memo 142 (REMOVE): Hackathon Kit, Agent Creation, GTFS Pilot -> .trash/memo-142-reduction.
                        { label: 'CLI Setup', translations: { de: 'CLI Setup' }, slug: 'quickstart/quickstart' },
                        { label: 'For LLMs', translations: { de: 'Fuer LLMs' }, slug: 'introduction/for-llms' },
                    ],
                },
                // Memo 060 PRD-007 (Phase 2): Concepts reduziert auf 4 Eintraege
                // (Variante C). Schema Catalog, Tag Search, Schemas Overview,
                // Schemas & Tools, Resources, Prompts, Skills, Agents -> in
                // schemas.md / tools.md / primitives.md / clients.md konsolidiert.
                {
                    label: 'Concepts',
                    translations: { de: 'Konzepte' },
                    collapsed: true,
                    items: [
                        { label: 'Schemas',    translations: { de: 'Schemas' },    slug: 'concepts/schemas' },
                        { label: 'Primitives', translations: { de: 'Primitive' },  slug: 'concepts/primitives' },
                        { label: 'Clients',    translations: { de: 'Clients' },    slug: 'concepts/clients' },
                    ],
                },
                {
                    label: 'Specification',
                    translations: { de: 'Spezifikation' },
                    collapsed: true,
                    badge: specBadge,
                    items: specSidebar.items,
                },
                // Memo 086 PRD-07: Grading nav group (point 5) + v2.0 badge.
                ...gradingGroup,
                // Memo 108: Best Practice nav group (advisory track) + badge.
                ...bestPracticeGroup,
                // Memo 142 (REMOVE): the whole "Reference" (CLI/Programmatic API/MCP
                // Server Mode) and "Ecosystem" (AgentProbe/x402/GTFS) nav groups are
                // removed; their pages moved to .trash/memo-142-reduction. FlowMCP is a
                // format/specification — the add-on/ecosystem surface is the Drumherum,
                // not the core message.
                // Memo 064 Phase 4 PRD-011: lone top-level Blog sidebar entry
                // removed. Blog has its own /blog/ section (BlogIndexLayout).
                // Memo 059 PRD-011 (B4/B5): Roadmap + Team removed from sidebar.
                // Reachable via Footer-Widget (PRD-012). Pages remain at /roadmap, /team.
            ],
        }),
    ],
});
