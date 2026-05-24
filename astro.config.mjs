// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeMermaid from 'rehype-mermaid';
import { SidebarLoader } from './src/data/sidebar.mjs';


// Memo 056 PRD-16: Sidebar Specification-Section wird aus dem Manifest geladen.
const specSidebar = SidebarLoader.buildSidebar();


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
        '/docs/schemas/tags-reference/': '/reference/tags-reference/',

        '/docs/agents/overview/':        '/concepts/agents-overview/',

        '/docs/usage/cli/':              '/reference/cli/',
        '/docs/usage/mcp-server/':       '/reference/mcp-server/',

        '/docs/guides/schema-creation/':    '/guides/schema-creation/',
        '/docs/guides/examples/':           '/guides/examples/',
        '/docs/guides/server-integration/': '/guides/server-integration/',

        '/docs/reference/core-methods/':    '/reference/core-methods/',
        '/docs/reference/cli-reference/':   '/reference/cli-reference/',
        '/docs/reference/troubleshooting/': '/reference/troubleshooting/',

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
        '/de/about/fuer-entscheider/': '/de/about/for-decision-makers/',
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
                    label: 'Introduction',
                    translations: { de: 'Einfuehrung' },
                    collapsed: true,
                    items: [
                        { label: 'For Decision Makers', translations: { de: 'Fuer Entscheider' }, slug: 'about/for-decision-makers' },
                        { label: 'About', translations: { de: 'Ueber FlowMCP' }, slug: 'introduction/about' },
                        { label: 'Why We Do This', translations: { de: 'Warum wir das machen' }, slug: 'introduction/why' },
                        { label: 'Use Cases', translations: { de: 'Anwendungsfaelle' }, slug: 'introduction/use-cases' },
                        { label: 'FAQ', translations: { de: 'Haeufige Fragen' }, slug: 'introduction/faq' },
                        { label: 'For LLMs', translations: { de: 'Fuer LLMs' }, slug: 'introduction/for-llms' },
                        { label: 'License & ToS FAQ', translations: { de: 'Lizenz & AGB FAQ' }, slug: 'license-faq' },
                    ],
                },
                {
                    label: 'Quickstart',
                    translations: { de: 'Schnellstart' },
                    collapsed: true,
                    items: [
                        { label: 'What is FlowMCP', translations: { de: 'Was ist FlowMCP' }, slug: 'quickstart/what-is-flowmcp' },
                        { label: 'Installation', translations: { de: 'Installation' }, slug: 'quickstart/installation' },
                        { label: 'Quickstart', translations: { de: 'Schnellstart' }, slug: 'quickstart/quickstart' },
                        { label: 'How It Works', translations: { de: 'Wie es funktioniert' }, slug: 'quickstart/how-it-works' },
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
                        { label: 'Agents Overview', translations: { de: 'Agents-Uebersicht' }, slug: 'concepts/agents-overview' },
                        { label: 'Clients', translations: { de: 'Clients' }, slug: 'concepts/clients' },
                    ],
                },
                {
                    label: 'Specification',
                    translations: { de: 'Spezifikation' },
                    collapsed: true,
                    items: specSidebar.items,
                },
                {
                    label: 'Reference',
                    translations: { de: 'Referenz' },
                    collapsed: true,
                    items: [
                        { label: 'Core Methods', translations: { de: 'Kern-Methoden' }, slug: 'reference/core-methods' },
                        { label: 'CLI Reference', translations: { de: 'CLI-Referenz' }, slug: 'reference/cli-reference' },
                        { label: 'CLI', translations: { de: 'CLI' }, slug: 'reference/cli' },
                        { label: 'MCP Server', translations: { de: 'MCP-Server' }, slug: 'reference/mcp-server' },
                        { label: 'Tags Reference', translations: { de: 'Tags-Referenz' }, slug: 'reference/tags-reference' },
                        { label: 'Troubleshooting', translations: { de: 'Fehlerbehebung' }, slug: 'reference/troubleshooting' },
                    ],
                },
                {
                    label: 'Guides',
                    translations: { de: 'Anleitungen' },
                    collapsed: true,
                    items: [
                        { label: 'Schema Creation', translations: { de: 'Schema erstellen' }, slug: 'guides/schema-creation' },
                        { label: 'Server Integration', translations: { de: 'Server-Integration' }, slug: 'guides/server-integration' },
                        { label: 'Examples', translations: { de: 'Beispiele' }, slug: 'guides/examples' },
                    ],
                },
                {
                    label: 'Ecosystem',
                    translations: { de: 'Oekosystem' },
                    collapsed: true,
                    items: [
                        { label: 'Schema Library', translations: { de: 'Schema-Bibliothek' }, slug: 'ecosystem/schema-library' },
                        { label: 'Agent Server', translations: { de: 'Agent-Server' }, slug: 'ecosystem/agent-server' },
                        { label: 'AgentProbe', translations: { de: 'AgentProbe' }, slug: 'ecosystem/agentprobe' },
                        { label: 'x402', translations: { de: 'x402' }, slug: 'ecosystem/x402' },
                    ],
                },
                {
                    label: 'Blog',
                    translations: { de: 'Blog' },
                    collapsed: true,
                    // SIDEBAR-STRATEGIE (PRD-29, Memo 052):
                    // Manuelle Pflege bis Memo 047 die ersten 4 Blog-Posts liefert.
                    // Danach Umstieg auf Auto-list via Astro getCollection('docs')
                    // mit Filter data.section === 'Blog' erwaegen.
                    items: [
                        { label: 'Blog', translations: { de: 'Blog' }, link: '/blog/' },
                        { label: 'Welcome', translations: { de: 'Willkommen' }, slug: 'blog/welcome' },
                    ],
                },
                {
                    label: 'Roadmap & Team',
                    translations: { de: 'Roadmap & Team' },
                    collapsed: true,
                    items: [
                        { label: 'Overview', translations: { de: 'Uebersicht' }, slug: 'roadmap/overview' },
                        { label: 'Integration', translations: { de: 'Integration' }, slug: 'roadmap/integration' },
                        { label: 'Community Hub', translations: { de: 'Community-Hub' }, slug: 'roadmap/community' },
                        { label: 'Team', translations: { de: 'Team' }, slug: 'roadmap/team' },
                    ],
                },
            ],
        }),
    ],
});
