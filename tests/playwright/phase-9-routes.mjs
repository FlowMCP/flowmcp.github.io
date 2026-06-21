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


// Memo 142: the docs site was reduced to the format/spec core. FAQ, Use Cases,
// Schemas & Sources, the guides (Hackathon Kit / Agent Creation / GTFS Pilot), the
// whole Reference section and the whole Ecosystem section were removed (moved to
// .trash). Those routes now live in FORBIDDEN_ROUTES (Block 2: 404/redirect = PASS).
const EN_ROUTES = [
    // Get-Started-Gruppe (Memo 144 T9: About FlowMCP merged into Get Started; standalone About group removed)
    { path: '/about/',                       expectedMarker: 'About FlowMCP',           group: 'Get Started',   locale: 'en' },

    // Memo 144 T8: sidebar label "CLI Setup" (Memo 060) now matches the page H1 "CLI Setup".
    { path: '/quickstart/quickstart/',       expectedMarker: 'CLI Setup',               group: 'Get Started',   locale: 'en' },
    { path: '/introduction/for-llms/',       expectedMarker: 'For LLMs',                group: 'Get Started',   locale: 'en' },

    // Concepts
    { path: '/concepts/schemas/',            expectedMarker: 'Schemas',                 group: 'Concepts',      locale: 'en' },
    { path: '/concepts/primitives/',         expectedMarker: 'Primitives',              group: 'Concepts',      locale: 'en' },
    { path: '/concepts/clients/',            expectedMarker: 'Clients',                 group: 'Concepts',      locale: 'en' },

    // Specification (Spot-Check)
    { path: '/specification/overview/',      expectedMarker: 'Overview',                group: 'Specification', locale: 'en' },
    { path: '/specification/schema-format/', expectedMarker: 'Schema',                  group: 'Specification', locale: 'en' },
    { path: '/specification/parameters/',    expectedMarker: 'Parameters',              group: 'Specification', locale: 'en' },
    { path: '/specification/resources/',     expectedMarker: 'Resources',               group: 'Specification', locale: 'en' },
    { path: '/specification/validation-rules/', expectedMarker: 'Validation',           group: 'Specification', locale: 'en' },
    // Memo 144 T12: new informative Philosophy chapter (Introduction group).
    { path: '/specification/philosophy/',    expectedMarker: 'Philosophy',              group: 'Introduction',  locale: 'en' },

    // Blog
    { path: '/blog/',                        expectedMarker: 'Blog',                    group: 'Blog',          locale: 'en' },

    // Optional (QS5 Discovery — falls vorhanden, sonst skip)
    { path: '/guides/schema-creation/',      expectedMarker: 'Schema',                  group: 'Get Started',   locale: 'en', optional: true }
]


// Memo 142: routes removed from the site (and their DE mirrors). They now 404
// (or redirect, for the ones with a repointed legacy redirect). Block 2 accepts
// 404 / 3xx / 200+meta-refresh → these verify the reduction landed.
const MEMO_142_REMOVED_PATHS = [
    '/about/faq/',
    '/introduction/use-cases/',
    '/schemas-and-sources/',
    '/guides/hackathon-kit/',
    '/guides/agent-creation/',
    '/guides/gtfs-pilot/',
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
    '/de/concepts/tag-search/',

    // Memo 142: reduced pages (EN + DE mirrors) — removed from the site.
    ...MEMO_142_REMOVED_PATHS,
    ...MEMO_142_REMOVED_PATHS.map( ( p ) => `/de${ p }` )
]


export { ROUTES, FORBIDDEN_ROUTES }
