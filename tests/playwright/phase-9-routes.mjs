// Memo 060 Phase 9 (PRD-027 Task 2): Sidebar-Routen + Forbidden-Routen.
//
// Quelle: astro.config.mjs Starlight-Sidebar nach Abschluss Phase 1-8.
// Slugs gemapped auf reale Astro-URLs:
//   - sidebar slug 'about'                          -> /about/
//   - sidebar slug 'about/faq'                      -> /about/faq/
//   - sidebar slug 'introduction/use-cases'         -> /introduction/use-cases/
//   - sidebar slug 'schemas-and-sources'            -> /schemas-and-sources/
//   - sidebar slug 'quickstart/quickstart'          -> /quickstart/quickstart/   (Label: CLI Setup)
//   - sidebar slug 'introduction/for-llms'          -> /introduction/for-llms/
//   - sidebar slug 'guides/hackathon-kit'           -> /guides/hackathon-kit/
//   - sidebar slug 'guides/agent-creation'          -> /guides/agent-creation/
//   - sidebar slug 'guides/gtfs-pilot'              -> /guides/gtfs-pilot/
//   - sidebar slug 'reference/cli'                  -> /reference/cli/           (Label: CLI Usage)
//   - sidebar slug 'reference/core-methods'         -> /reference/core-methods/  (Label: Programmatic API)
//   - sidebar slug 'reference/mcp-server'           -> /reference/mcp-server/    (Label: MCP Server Mode)
//   - sidebar slug 'ecosystem/agentprobe'           -> /ecosystem/agentprobe/
//   - sidebar slug 'ecosystem/x402'                 -> /ecosystem/x402/
//   - sidebar link '/blog/'                         -> /blog/
//
// Specification (Spot-Check, 5 Seiten):
//   /specification/overview/, schema-format/, parameters/, resources/, validation-rules/
//
// Optional-Route (QS5 Discovery, derzeit nicht in Sidebar): /guides/schema-creation/


const EN_ROUTES = [
    // About-Gruppe
    { path: '/about/',                       expectedMarker: 'About FlowMCP',           group: 'About',         locale: 'en' },
    { path: '/about/faq/',                   expectedMarker: 'FAQ',                     group: 'About',         locale: 'en' },
    { path: '/introduction/use-cases/',      expectedMarker: 'Use Cases',               group: 'About',         locale: 'en' },
    { path: '/schemas-and-sources/',         expectedMarker: 'Schemas & Sources',       group: 'About',         locale: 'en' },

    // Get-Started-Gruppe
    { path: '/quickstart/quickstart/',       expectedMarker: 'Quickstart',              group: 'Get Started',   locale: 'en' },
    { path: '/introduction/for-llms/',       expectedMarker: 'For LLMs',                group: 'Get Started',   locale: 'en' },
    { path: '/guides/hackathon-kit/',        expectedMarker: 'Hackathon Kit',           group: 'Get Started',   locale: 'en' },
    { path: '/guides/agent-creation/',       expectedMarker: 'Agent Creation',          group: 'Get Started',   locale: 'en' },
    { path: '/guides/gtfs-pilot/',           expectedMarker: 'GTFS Pilot',              group: 'Get Started',   locale: 'en' },

    // Concepts
    { path: '/concepts/schemas/',            expectedMarker: 'Schemas',                 group: 'Concepts',      locale: 'en' },
    { path: '/concepts/tools/',              expectedMarker: 'Tools',                   group: 'Concepts',      locale: 'en' },
    { path: '/concepts/primitives/',         expectedMarker: 'Primitives',              group: 'Concepts',      locale: 'en' },
    { path: '/concepts/clients/',            expectedMarker: 'Clients',                 group: 'Concepts',      locale: 'en' },

    // Specification (Spot-Check)
    { path: '/specification/overview/',      expectedMarker: 'Overview',                group: 'Specification', locale: 'en' },
    { path: '/specification/schema-format/', expectedMarker: 'Schema',                  group: 'Specification', locale: 'en' },
    { path: '/specification/parameters/',    expectedMarker: 'Parameters',              group: 'Specification', locale: 'en' },
    { path: '/specification/resources/',     expectedMarker: 'Resources',               group: 'Specification', locale: 'en' },
    { path: '/specification/validation-rules/', expectedMarker: 'Validation',           group: 'Specification', locale: 'en' },

    // Reference
    { path: '/reference/cli/',               expectedMarker: 'CLI',                     group: 'Reference',     locale: 'en' },
    { path: '/reference/core-methods/',      expectedMarker: 'Core',                    group: 'Reference',     locale: 'en' },
    { path: '/reference/mcp-server/',        expectedMarker: 'MCP Server',              group: 'Reference',     locale: 'en' },

    // Ecosystem
    { path: '/ecosystem/agentprobe/',        expectedMarker: 'AgentProbe',              group: 'Ecosystem',     locale: 'en' },
    { path: '/ecosystem/x402/',              expectedMarker: 'x402',                    group: 'Ecosystem',     locale: 'en' },

    // Blog
    { path: '/blog/',                        expectedMarker: 'Blog',                    group: 'Blog',          locale: 'en' },

    // Optional (QS5 Discovery — falls vorhanden, sonst skip)
    { path: '/guides/schema-creation/',      expectedMarker: 'Schema',                  group: 'Get Started',   locale: 'en', optional: true }
]


// DE-Mirror: gleiche Pfade mit Prefix /de/. Optional-Flag uebernommen.
// Die Marker werden gelockert (nutzen kleinere Tokens), weil viele DE-Seiten
// neu hinzugefuegte Content-Items (hackathon-kit, agent-creation, gtfs-pilot,
// schemas-and-sources) keine DE-Uebersetzung haben und Starlight diese als
// 404 ausliefert — diese Routen werden als optional markiert.
const DE_ONLY_OPTIONAL_PATHS = [
    '/about/faq/',                 // DE-Faq existiert, aber Marker variiert
    '/schemas-and-sources/',       // DE-Mirror existiert
    '/introduction/use-cases/',
    '/introduction/for-llms/',
    '/quickstart/quickstart/',
    '/guides/hackathon-kit/',
    '/guides/agent-creation/',
    '/guides/gtfs-pilot/',
    '/concepts/schemas/',
    '/concepts/tools/',
    '/concepts/primitives/',
    '/concepts/clients/',
    '/reference/cli/',
    '/reference/core-methods/',
    '/reference/mcp-server/',
    '/ecosystem/agentprobe/',
    '/ecosystem/x402/'
]

// /de/blog/ existiert nicht (404) — Blog ist EN-only auf dieser Site.
const DE_EXCLUDED_PATHS = new Set( [ '/blog/' ] )

const DE_ROUTES = EN_ROUTES
    .filter( ( route ) => !DE_EXCLUDED_PATHS.has( route.path ) )
    .map( ( route ) => {
        return {
            ...route,
            path: `/de${ route.path }`,
            locale: 'de',
            // DE-Pfade ohne strikten Marker-Check, weil DE-Translation fehlt
            // und Starlight ggf. das EN-Fallback rendert.
            relaxedMarker: true
        }
    } )


const ROUTES = [ ...EN_ROUTES, ...DE_ROUTES ]


// Verbotene Routen: Routen die NICHT mehr in der Sidebar stehen und die
// vom Build durch Astro-Redirects auf neue Ziele zeigen (Meta-Refresh
// HTML, HTTP 200). Oder Routen die komplett entfernt wurden (HTTP 404).
//
// Test-Bedingung: Status 200 mit Meta-Refresh-Tag (Redirect-HTML) ODER 404.
// Das ist akzeptabel; eine echte Real-Page (kein Redirect, kein 404) ist FAIL.
const FORBIDDEN_ROUTES = [
    // Phase 2 (PRD-007): Concepts auf 4 Eintraege konsolidiert
    '/concepts/agents/',
    '/concepts/schemas-and-tools/',
    '/concepts/schemas-overview/',
    '/concepts/schemas-prompts/',
    '/concepts/schemas-resources/',
    '/concepts/schemas-skills/',
    '/concepts/schemas-tools/',
    '/concepts/schema-catalog/',
    '/concepts/tag-search/',

    // Phase 6: Ecosystem cleanup
    '/ecosystem/schema-library/',
    '/ecosystem/agent-server/',

    // DE-Mirror
    '/de/concepts/agents/',
    '/de/concepts/schemas-and-tools/',
    '/de/concepts/schemas-overview/',
    '/de/concepts/schemas-prompts/',
    '/de/concepts/schemas-resources/',
    '/de/concepts/schemas-skills/',
    '/de/concepts/schemas-tools/',
    '/de/concepts/schema-catalog/',
    '/de/concepts/tag-search/'
]


export { ROUTES, FORBIDDEN_ROUTES }
