// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';


export default defineConfig({
    site: 'https://flowmcp.github.io',
    integrations: [
        starlight({
            title: 'FlowMCP',
            favicon: '/favicon.png',
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
            social: [
                { icon: 'github', label: 'GitHub', href: 'https://github.com/flowmcp' },
            ],
            head: [
                {
                    tag: 'script',
                    attrs: { defer: true },
                    content: `
                        function addHeaderLinks() {
                            var rg = document.querySelector('.right-group');
                            if (!rg) return;
                            var path = window.location.pathname;
                            var isDE = path.indexOf('/de/') === 0 || path === '/de';
                            var prefix = isDE ? '/de' : '';
                            var baseStyle = 'font-weight:600!important;text-decoration:none!important;margin-right:0.5rem!important;';
                            var activeColor = 'color:var(--sl-color-text-accent)!important;';
                            var inactiveColor = 'color:var(--sl-color-gray-2)!important;';
                            var isHome = path === '/' || path === '/de' || path === '/de/';
                            var isRoadmap = path.indexOf('/roadmap') !== -1;
                            var isDocs = !isHome && !isRoadmap;
                            var existingDocs = rg.querySelector('a[href*="/introduction/about"]');
                            var existingRm = rg.querySelector('a[href*="/roadmap"]');
                            if (!existingDocs) {
                                var docsLink = document.createElement('a');
                                docsLink.href = prefix + '/introduction/about/';
                                docsLink.textContent = 'Docs';
                                docsLink.className = 'header-nav-link';
                                rg.appendChild(docsLink);
                                existingDocs = docsLink;
                            } else {
                                existingDocs.href = prefix + '/introduction/about/';
                            }
                            if (!existingRm) {
                                var rmLink = document.createElement('a');
                                rmLink.href = prefix + '/roadmap/overview/';
                                rmLink.textContent = 'Roadmap';
                                rmLink.className = 'header-nav-link';
                                rg.appendChild(rmLink);
                                existingRm = rmLink;
                            } else {
                                existingRm.href = prefix + '/roadmap/overview/';
                            }
                            existingDocs.style.cssText = baseStyle + (isDocs ? activeColor : inactiveColor);
                            existingRm.style.cssText = baseStyle + (isRoadmap ? activeColor : inactiveColor);
                        }
                        document.addEventListener('DOMContentLoaded', function() { addHeaderLinks(); });
                        document.addEventListener('astro:page-load', function() { addHeaderLinks(); });
                    `,
                },
            ],
            sidebar: [
                {
                    label: 'Introduction',
                    translations: { de: 'Einfuehrung' },
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
                    items: [
                        { label: 'Schemas and Tools', translations: { de: 'Schemas und Tools' }, slug: 'basics/schemas-and-tools' },
                        { label: 'Schema Catalog', translations: { de: 'Schema-Katalog' }, slug: 'basics/schema-catalog' },
                        { label: 'Agents and Architectures', translations: { de: 'Agents und Architekturen' }, slug: 'basics/agents' },
                        { label: 'Clients and Compatibility', translations: { de: 'Clients und Kompatibilitaet' }, slug: 'basics/clients' },
                    ],
                },
                {
                    label: 'Roadmap',
                    items: [
                        { label: 'Overview', translations: { de: 'Uebersicht' }, slug: 'roadmap/overview' },
                        { label: 'Integration', slug: 'roadmap/integration' },
                        { label: 'Community Hub', slug: 'roadmap/community' },
                        { label: 'Team', slug: 'roadmap/team' },
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
