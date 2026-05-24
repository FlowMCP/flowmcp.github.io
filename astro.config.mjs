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


export default defineConfig({
    site: 'https://flowmcp.github.io',
    markdown: {
        rehypePlugins: [
            [ rehypeMermaid, { strategy: 'inline-svg' } ],
        ],
    },
    redirects: {
        '/docs': '/quickstart/what-is-flowmcp/',
        '/specification': '/specification/overview/',

        // PRD-06: IA-Refactor URL-Mappings (REV-05 Kap. 6.3)
        '/basics/schemas-and-tools/':         '/concepts/schemas-and-tools/',
        '/basics/schema-catalog/':            '/concepts/schema-catalog/',
        '/basics/agents/':                    '/concepts/agents/',
        '/basics/clients/':                   '/concepts/clients/',

        '/docs/getting-started/what-is-flowmcp/': '/quickstart/what-is-flowmcp/',
        '/docs/getting-started/installation/':    '/quickstart/installation/',
        '/docs/getting-started/quickstart/':      '/quickstart/quickstart/',
        '/docs/getting-started/how-it-works/':    '/quickstart/how-it-works/',

        '/docs/schemas/overview/':       '/concepts/schemas-overview/',
        '/docs/schemas/tools/':          '/concepts/schemas-tools/',
        '/docs/schemas/resources/':      '/concepts/schemas-resources/',
        '/docs/schemas/prompts/':        '/concepts/schemas-prompts/',
        '/docs/schemas/skills/':         '/concepts/schemas-skills/',
        '/docs/schemas/tags-reference/': '/concepts/tag-search/',
        '/reference/tags-reference/':    '/concepts/tag-search/',
        '/de/reference/tags-reference/': '/de/concepts/tag-search/',

        '/docs/agents/overview/':        '/concepts/agents/',
        '/concepts/agents-overview/':    '/concepts/agents/',
        '/de/concepts/agents-overview/': '/de/concepts/agents/',

        '/docs/usage/cli/':              '/reference/cli/',
        '/docs/usage/mcp-server/':       '/reference/mcp-server/',

        '/docs/guides/schema-creation/':    '/guides/schema-creation/',
        '/docs/guides/examples/':           '/guides/examples/',
        '/docs/guides/server-integration/': '/guides/server-integration/',

        '/docs/reference/core-methods/':    '/reference/core-methods/',
        '/docs/reference/cli-reference/':   '/reference/cli/',
        '/reference/cli-reference/':        '/reference/cli/',
        '/de/reference/cli-reference/':     '/de/reference/cli/',
        '/docs/reference/troubleshooting/': '/about/faq/',
        '/reference/troubleshooting/':      '/about/faq/',
        '/de/reference/troubleshooting/':   '/de/about/faq/',

        '/docs/ecosystem/schema-library/':  '/ecosystem/schema-library/',
        '/docs/ecosystem/agent-server/':    '/ecosystem/agent-server/',
        '/docs/ecosystem/agentprobe/':      '/ecosystem/agentprobe/',
        '/docs/ecosystem/x402/':            '/ecosystem/x402/',

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
        '/docs/specification/route-tests/':         '/specification/route-tests/',
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
        '/introduction/faq/': '/about/faq/',
        '/de/introduction/faq/': '/de/about/faq/',
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
                        { label: 'About FlowMCP', translations: { de: 'Ueber FlowMCP' }, slug: 'about' },
                        { label: 'FAQ', translations: { de: 'Haeufige Fragen' }, slug: 'about/faq' },
                        { label: 'Use Cases', translations: { de: 'Anwendungsfaelle' }, slug: 'introduction/use-cases' },
                        { label: 'For LLMs', translations: { de: 'Fuer LLMs' }, slug: 'introduction/for-llms' },
                        { label: 'License & ToS FAQ', translations: { de: 'Lizenz & AGB FAQ' }, slug: 'license-faq' },
                    ],
                },
                // Memo 059 PRD-011: Quickstart + Guides merged into "Get Started" (B3/B7).
                // Inline-Listing (Variant A) — flat list, no sub-group. AC-3: exactly 4 items.
                // PRD-013 audit: DE-Mirror via Starlight `translations` keys — both locales
                // render 6 groups with localized labels (Loslegen, Konzepte, etc.).
                {
                    label: 'Get Started',
                    translations: { de: 'Loslegen' },
                    collapsed: true,
                    items: [
                        { label: 'Quickstart', translations: { de: 'Schnellstart' }, slug: 'quickstart/quickstart' },
                        { label: 'Hackathon Kit', translations: { de: 'Hackathon-Kit' }, slug: 'guides/hackathon-kit' },
                        { label: 'Agent Creation', translations: { de: 'Agent-Erstellung' }, slug: 'guides/agent-creation' },
                        { label: 'GTFS Pilot', translations: { de: 'GTFS-Pilot' }, slug: 'guides/gtfs-pilot' },
                    ],
                },
                {
                    label: 'Concepts',
                    translations: { de: 'Konzepte' },
                    collapsed: true,
                    items: [
                        { label: 'Schemas & Tools', translations: { de: 'Schemas und Tools' }, slug: 'concepts/schemas-and-tools' },
                        { label: 'Schema Catalog', translations: { de: 'Schema-Katalog' }, slug: 'concepts/schema-catalog' },
                        { label: 'Schemas Overview', translations: { de: 'Schemas-Uebersicht' }, slug: 'concepts/schemas-overview' },
                        { label: 'Tools', translations: { de: 'Tools' }, slug: 'concepts/schemas-tools' },
                        { label: 'Resources', translations: { de: 'Ressourcen' }, slug: 'concepts/schemas-resources' },
                        { label: 'Prompts', translations: { de: 'Prompts' }, slug: 'concepts/schemas-prompts' },
                        { label: 'Skills', translations: { de: 'Skills' }, slug: 'concepts/schemas-skills' },
                        { label: 'Agents', translations: { de: 'Agents' }, slug: 'concepts/agents' },
                        { label: 'Clients', translations: { de: 'Clients' }, slug: 'concepts/clients' },
                        { label: 'Tag Search', translations: { de: 'Tag-Suche' }, slug: 'concepts/tag-search' },
                    ],
                },
                {
                    label: 'Specification',
                    translations: { de: 'Spezifikation' },
                    collapsed: true,
                    badge: specBadge,
                    items: specSidebar.items,
                },
                {
                    label: 'Reference',
                    translations: { de: 'Referenz' },
                    collapsed: true,
                    items: [
                        { label: 'CLI Usage', translations: { de: 'CLI-Nutzung' }, slug: 'reference/cli' },
                        { label: 'Programmatic API', translations: { de: 'Programmatic API' }, slug: 'reference/core-methods' },
                        { label: 'MCP Server Mode', translations: { de: 'MCP Server Mode' }, slug: 'reference/mcp-server' },
                    ],
                },
                {
                    label: 'Ecosystem',
                    translations: { de: 'Oekosystem' },
                    collapsed: true,
                    items: [
                        { label: 'Schema Library (stable)', translations: { de: 'Schema-Bibliothek (stable)' }, slug: 'ecosystem/schema-library' },
                        { label: 'Agent Server (experimental)', translations: { de: 'Agent-Server (experimentell)' }, slug: 'ecosystem/agent-server' },
                        { label: 'AgentProbe (external)', translations: { de: 'AgentProbe (extern)' }, slug: 'ecosystem/agentprobe' },
                        { label: 'x402 (experimental)', translations: { de: 'x402 (experimentell)' }, slug: 'ecosystem/x402' },
                    ],
                },
                // Blog removed from sidebar — now standalone view at /blog/ (Memo 057 PRD-11)
                // Memo 059 PRD-011 (B4/B5): Roadmap + Team removed from sidebar.
                // Reachable via Footer-Widget (PRD-012). Pages remain at /roadmap, /team.
            ],
        }),
    ],
});
