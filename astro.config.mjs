// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeMermaid from 'rehype-mermaid';


export default defineConfig({
    site: 'https://flowmcp.github.io',
    markdown: {
        rehypePlugins: [
            [ rehypeMermaid, { strategy: 'pre-mermaid' } ],
        ],
    },
    redirects: {
        '/docs': '/docs/getting-started/what-is-flowmcp/',
        '/specification': '/docs/specification/overview/',
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
                        { label: 'About', translations: { de: 'Ueber FlowMCP' }, slug: 'introduction/about' },
                        { label: 'Why We Do This', translations: { de: 'Warum wir das machen' }, slug: 'introduction/why' },
                        { label: 'Use Cases', translations: { de: 'Anwendungsfaelle' }, slug: 'introduction/use-cases' },
                        { label: 'FAQ', translations: { de: 'Haeufige Fragen' }, slug: 'introduction/faq' },
                        { label: 'For LLMs', translations: { de: 'Fuer LLMs' }, slug: 'introduction/for-llms' },
                    ],
                },
                {
                    label: 'Basics',
                    translations: { de: 'Grundlagen' },
                    collapsed: true,
                    items: [
                        { label: 'Schemas and Tools', translations: { de: 'Schemas und Tools' }, slug: 'basics/schemas-and-tools' },
                        { label: 'Schema Catalog', translations: { de: 'Schema-Katalog' }, slug: 'basics/schema-catalog' },
                        { label: 'Agents and Architectures', translations: { de: 'Agents und Architekturen' }, slug: 'basics/agents' },
                        { label: 'Clients and Compatibility', translations: { de: 'Clients und Kompatibilitaet' }, slug: 'basics/clients' },
                    ],
                },
                {
                    label: 'Roadmap',
                    collapsed: true,
                    items: [
                        { label: 'Overview', translations: { de: 'Uebersicht' }, slug: 'roadmap/overview' },
                        { label: 'Integration', slug: 'roadmap/integration' },
                        { label: 'Community Hub', slug: 'roadmap/community' },
                        { label: 'Team', slug: 'roadmap/team' },
                    ],
                },
                {
                    label: 'Specification',
                    translations: { de: 'Spezifikation' },
                    collapsed: true,
                    items: [
                        { label: 'Overview',            slug: 'docs/specification/overview' },
                        { label: 'Schema Format',       slug: 'docs/specification/schema-format' },
                        { label: 'Parameters',          slug: 'docs/specification/parameters' },
                        { label: 'Shared Lists',        slug: 'docs/specification/shared-lists' },
                        { label: 'Skills',              slug: 'docs/specification/skills' },
                        { label: 'Agents',              slug: 'docs/specification/agents' },
                        { label: 'Resources',           slug: 'docs/specification/resources' },
                        { label: 'Catalog',             slug: 'docs/specification/catalog' },
                        { label: 'ID Schema',           slug: 'docs/specification/id-schema' },
                        { label: 'Validation Rules',    slug: 'docs/specification/validation-rules' },
                        { label: 'Migration',           slug: 'docs/specification/migration' },
                        { label: 'Security',            slug: 'docs/specification/security' },
                        { label: 'Output Schema',       slug: 'docs/specification/output-schema' },
                        { label: 'Route Tests',         slug: 'docs/specification/route-tests' },
                        { label: 'Preload',             slug: 'docs/specification/preload' },
                        { label: 'Groups & Prompts',    slug: 'docs/specification/groups-prompts' },
                        { label: 'Tests',               slug: 'docs/specification/tests' },
                        { label: 'Prompt Architecture', slug: 'docs/specification/prompt-architecture' },
                    ],
                },
                {
                    label: 'Docs',
                    translations: { de: 'Dokumentation' },
                    collapsed: true,
                    items: [
                        {
                            label: 'Getting Started',
                            translations: { de: 'Erste Schritte' },
                            collapsed: true,
                            items: [
                                { label: 'What is FlowMCP', translations: { de: 'Was ist FlowMCP' }, slug: 'docs/getting-started/what-is-flowmcp' },
                                { label: 'Installation', slug: 'docs/getting-started/installation' },
                                { label: 'Quickstart', slug: 'docs/getting-started/quickstart' },
                                { label: 'How It Works', translations: { de: 'Wie es funktioniert' }, slug: 'docs/getting-started/how-it-works' },
                            ],
                        },
                        {
                            label: 'Schemas',
                            collapsed: true,
                            items: [
                                { label: 'Overview', translations: { de: 'Uebersicht' }, slug: 'docs/schemas/overview' },
                                { label: 'Tools', slug: 'docs/schemas/tools' },
                                { label: 'Resources', translations: { de: 'Ressourcen' }, slug: 'docs/schemas/resources' },
                                { label: 'Prompts', slug: 'docs/schemas/prompts' },
                                { label: 'Skills', slug: 'docs/schemas/skills' },
                                { label: 'Tags Reference', slug: 'docs/schemas/tags-reference' },
                            ],
                        },
                        { label: 'Agents', slug: 'docs/agents/overview' },
                        {
                            label: 'Usage',
                            translations: { de: 'Nutzung' },
                            collapsed: true,
                            items: [
                                { label: 'CLI', slug: 'docs/usage/cli' },
                                { label: 'MCP Server', slug: 'docs/usage/mcp-server' },
                            ],
                        },
                        {
                            label: 'Guides',
                            translations: { de: 'Anleitungen' },
                            collapsed: true,
                            items: [
                                { label: 'Schema Creation', translations: { de: 'Schema erstellen' }, slug: 'docs/guides/schema-creation' },
                                { label: 'Examples', translations: { de: 'Beispiele' }, slug: 'docs/guides/examples' },
                                { label: 'Server Integration', slug: 'docs/guides/server-integration' },
                            ],
                        },
                        {
                            label: 'Reference',
                            translations: { de: 'Referenz' },
                            collapsed: true,
                            items: [
                                { label: 'Core Methods', translations: { de: 'Kern-Methoden' }, slug: 'docs/reference/core-methods' },
                                { label: 'CLI Reference', translations: { de: 'CLI-Referenz' }, slug: 'docs/reference/cli-reference' },
                                { label: 'Troubleshooting', translations: { de: 'Fehlerbehebung' }, slug: 'docs/reference/troubleshooting' },
                            ],
                        },
                        {
                            label: 'Ecosystem',
                            translations: { de: 'Oekosystem' },
                            collapsed: true,
                            items: [
                                { label: 'Schema Library', translations: { de: 'Schema-Bibliothek' }, slug: 'docs/ecosystem/schema-library' },
                                { label: 'Agent Server', slug: 'docs/ecosystem/agent-server' },
                                { label: 'AgentProbe', slug: 'docs/ecosystem/agentprobe' },
                                { label: 'x402', slug: 'docs/ecosystem/x402' },
                            ],
                        },
                    ],
                },
            ],
        }),
    ],
});
