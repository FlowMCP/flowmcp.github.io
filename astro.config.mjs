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
                            var existingDocs = rg.querySelector('a[href*="/about"]');
                            var existingRm = rg.querySelector('a[href*="/roadmap"]');
                            if (!existingDocs) {
                                var docsLink = document.createElement('a');
                                docsLink.href = prefix + '/about/';
                                docsLink.textContent = 'Docs';
                                docsLink.className = 'header-nav-link';
                                rg.appendChild(docsLink);
                                existingDocs = docsLink;
                            } else {
                                existingDocs.href = prefix + '/about/';
                            }
                            if (!existingRm) {
                                var rmLink = document.createElement('a');
                                rmLink.href = prefix + '/roadmap/';
                                rmLink.textContent = 'Roadmap';
                                rmLink.className = 'header-nav-link';
                                rg.appendChild(rmLink);
                                existingRm = rmLink;
                            } else {
                                existingRm.href = prefix + '/roadmap/';
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
                        { label: 'About', translations: { de: 'Ueber FlowMCP' }, slug: 'about' },
                        { label: 'Why We Do This', translations: { de: 'Warum wir das machen' }, slug: 'warum' },
                        { label: 'FAQ', translations: { de: 'Haeufige Fragen' }, slug: 'faq' },
                        { label: 'Use Cases', slug: 'use-cases' },
                        { label: 'For LLMs', translations: { de: 'Fuer LLMs' }, slug: 'for-llms' },
                    ],
                },
                {
                    label: 'Basics',
                    translations: { de: 'Grundlagen' },
                    items: [
                        { label: 'Schemas and Tools', translations: { de: 'Schemas und Tools' }, slug: 'schemas-and-tools' },
                        { label: 'Schema Catalog', translations: { de: 'Schema-Katalog' }, slug: 'schemas-katalog' },
                        { label: 'Agents and Architectures', translations: { de: 'Agents und Architekturen' }, slug: 'agents' },
                        { label: 'Clients and Compatibility', translations: { de: 'Clients und Kompatibilitaet' }, slug: 'mcp-clients' },
                    ],
                },
                {
                    label: 'Roadmap',
                    items: [
                        { label: 'Overview', translations: { de: 'Uebersicht' }, slug: 'roadmap' },
                        { label: 'Integration', slug: 'integration' },
                        { label: 'Community Hub', slug: 'community' },
                        { label: 'Team', slug: 'team' },
                    ],
                },
            ],
        }),
    ],
});
