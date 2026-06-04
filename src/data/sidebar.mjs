// Memo 056 PRD-16: Sidebar-Loader fuer die Spezifikations-Section.
// Liest src/data/manifest.json (gesynct von flowmcp-spec via PRD-06) und
// erzeugt die Starlight-Sidebar-Items aus den Feldern sidebar_group,
// collapsed und version_added. Strict-Mode — keine Silent-Defaults.

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'


const __dirname = dirname( fileURLToPath( import.meta.url ) )
const MANIFEST_PATH = resolve( __dirname, 'manifest.json' )

const GROUP_LABELS = {
    introduction: { en: 'Introduction', de: 'Einfuehrung' },
    specification: { en: 'Core Specification', de: 'Kern-Spezifikation' },
    guides: { en: 'Guides', de: 'Leitfaeden' }
}


// Memo 087 PRD-P2-C (F4=A): grading sidebar sub-groups. Order is fixed so the
// nav renders deterministically regardless of manifest iteration order.
const GRADING_GROUP_LABELS = {
    introduction: { en: 'Introduction', de: 'Einfuehrung' },
    'core-model': { en: 'Core Model', de: 'Kern-Modell' },
    'process-contracts': { en: 'Process & Contracts', de: 'Prozess & Kontrakte' },
    reference: { en: 'Reference', de: 'Referenz' }
}

const GRADING_GROUP_ORDER = [ 'introduction', 'core-model', 'process-contracts', 'reference' ]


// Memo 108: best-practice sidebar sub-groups. Fixed order for deterministic nav.
const BEST_PRACTICE_GROUP_LABELS = {
    introduction: { en: 'Introduction', de: 'Einfuehrung' },
    overview: { en: 'Overview', de: 'Uebersicht' },
    'schema-creation': { en: 'Schema Creation', de: 'Schema-Erstellung' }
}

const BEST_PRACTICE_GROUP_ORDER = [ 'introduction', 'overview', 'schema-creation' ]


class SidebarLoader {
    static buildSidebar() {
        const manifest = SidebarLoader.#loadManifest()
        SidebarLoader.#assertManifest( { manifest } )

        const filtered = manifest.files.filter( ( file ) => {
            return file.filename !== 'route-tests.md'
        } )

        const groups = SidebarLoader.#groupByCategory( { files: filtered } )
        const items = SidebarLoader.#renderGroups( { groups } )

        // Memo 059 PRD-007 (C2 + C3): Single source of truth for the spec
        // version surfaced as a sidebar badge — read from manifest.spec_version
        // (synced from flowmcp-spec/package.json via generate-docs-payload.mjs).
        // Strict mode: no silent default, fail loudly if missing.
        if( typeof manifest.spec_version !== 'string' || manifest.spec_version.length === 0 ) {
            throw new Error( '[sidebar] manifest.spec_version missing or empty' )
        }
        const specVersion = manifest.spec_version

        return { items, totalFiles: filtered.length, specVersion }
    }


    // Memo 086 PRD-07: the grading spec is a separate nav group (point 5) with
    // its own slug-root and a second badge. Built from manifest.grading (the
    // additive block). Returns null when no grading block is present — strict,
    // no silent default. The grading version is surfaced once as the group badge.
    static buildGradingSidebar() {
        const manifest = SidebarLoader.#loadManifest()
        if( !manifest.grading || !Array.isArray( manifest.grading.files ) ) {
            return null
        }
        if( manifest.grading.files.length === 0 ) {
            throw new Error( '[sidebar] manifest.grading present but files is empty' )
        }
        if( typeof manifest.grading.version !== 'string' || manifest.grading.version.length === 0 ) {
            throw new Error( '[sidebar] manifest.grading.version missing or empty' )
        }

        // Memo 087 PRD-P2-C (F4=A): group the flat grading list into the four
        // sub-groups carried on each file's sidebar_group field. Strict — fail
        // loudly if the field is missing (no silent default).
        const sorted = [ ...manifest.grading.files ].sort( ( a, b ) => a.order - b.order )
        const missing = sorted
            .map( ( file, index ) => typeof file.sidebar_group === 'string' ? null : `grading.files[${ index }].sidebar_group` )
            .filter( ( entry ) => entry !== null )
        if( missing.length > 0 ) {
            throw new Error( `[sidebar] grading manifest missing required fields: ${ missing.join( ', ' ) }` )
        }

        const buckets = {}
        sorted.forEach( ( file ) => {
            const key = file.sidebar_group
            if( !buckets[ key ] ) {
                buckets[ key ] = {
                    label: GRADING_GROUP_LABELS[ key ]?.en ?? key,
                    translations: { de: GRADING_GROUP_LABELS[ key ]?.de ?? key },
                    collapsed: file.collapsed,
                    items: []
                }
            }
            buckets[ key ].items.push( { label: file.title, slug: `grading/${ file.slug }` } )
        } )

        const items = GRADING_GROUP_ORDER
            .filter( ( key ) => buckets[ key ] )
            .map( ( key ) => buckets[ key ] )

        return { items, gradingVersion: manifest.grading.version }
    }


    // Memo 108: the best-practice track is a separate nav group with its own
    // slug-root and a third badge. Built from manifest.bestPractice (the additive
    // block). Returns null when no best-practice block is present — strict, no
    // silent default. Mirrors buildGradingSidebar.
    static buildBestPracticeSidebar() {
        const manifest = SidebarLoader.#loadManifest()
        if( !manifest.bestPractice || !Array.isArray( manifest.bestPractice.files ) ) {
            return null
        }
        if( manifest.bestPractice.files.length === 0 ) {
            throw new Error( '[sidebar] manifest.bestPractice present but files is empty' )
        }
        if( typeof manifest.bestPractice.version !== 'string' || manifest.bestPractice.version.length === 0 ) {
            throw new Error( '[sidebar] manifest.bestPractice.version missing or empty' )
        }

        const sorted = [ ...manifest.bestPractice.files ].sort( ( a, b ) => a.order - b.order )
        const missing = sorted
            .map( ( file, index ) => typeof file.sidebar_group === 'string' ? null : `bestPractice.files[${ index }].sidebar_group` )
            .filter( ( entry ) => entry !== null )
        if( missing.length > 0 ) {
            throw new Error( `[sidebar] best-practice manifest missing required fields: ${ missing.join( ', ' ) }` )
        }

        const buckets = {}
        sorted.forEach( ( file ) => {
            const key = file.sidebar_group
            if( !buckets[ key ] ) {
                buckets[ key ] = {
                    label: BEST_PRACTICE_GROUP_LABELS[ key ]?.en ?? key,
                    translations: { de: BEST_PRACTICE_GROUP_LABELS[ key ]?.de ?? key },
                    collapsed: file.collapsed,
                    items: []
                }
            }
            buckets[ key ].items.push( { label: file.title, slug: `best-practice/${ file.slug }` } )
        } )

        const items = BEST_PRACTICE_GROUP_ORDER
            .filter( ( key ) => buckets[ key ] )
            .map( ( key ) => buckets[ key ] )

        return { items, bestPracticeVersion: manifest.bestPractice.version }
    }


    static #loadManifest() {
        if( !existsSync( MANIFEST_PATH ) ) {
            throw new Error( `[sidebar] manifest missing at ${ MANIFEST_PATH } — run "npm run sync-spec" first` )
        }
        const raw = readFileSync( MANIFEST_PATH, 'utf8' )
        return JSON.parse( raw )
    }


    static #assertManifest( { manifest } ) {
        if( !Array.isArray( manifest.files ) ) {
            throw new Error( '[sidebar] manifest.files is not an array' )
        }
        if( manifest.files.length === 0 ) {
            throw new Error( '[sidebar] manifest.files is empty' )
        }
        const missingFields = manifest.files
            .map( ( file, index ) => {
                if( typeof file.sidebar_group !== 'string' ) return `files[${ index }].sidebar_group`
                if( typeof file.collapsed !== 'boolean' ) return `files[${ index }].collapsed`
                return null
            } )
            .filter( ( entry ) => entry !== null )

        if( missingFields.length > 0 ) {
            throw new Error( `[sidebar] manifest missing required fields: ${ missingFields.join( ', ' ) }` )
        }
    }


    static #groupByCategory( { files } ) {
        const sorted = [ ...files ].sort( ( a, b ) => a.order - b.order )
        const groups = {}
        sorted.forEach( ( file ) => {
            const key = file.sidebar_group
            if( !groups[ key ] ) {
                groups[ key ] = {
                    key,
                    label: GROUP_LABELS[ key ] ?? { en: key, de: key },
                    collapsed: file.collapsed,
                    items: []
                }
            }
            // Memo 059 PRD-007 (C1 + C2): no per-item badges. The version is
            // surfaced once on the top-level Specification group only (set in
            // astro.config.mjs via buildSidebar().specVersion).
            groups[ key ].items.push( {
                label: file.title,
                slug: `specification/${ file.slug }`
            } )
        } )
        return Object.values( groups )
    }


    static #renderGroups( { groups } ) {
        return groups.map( ( group ) => {
            return {
                label: group.label.en,
                translations: { de: group.label.de },
                collapsed: group.collapsed,
                items: group.items.map( ( item ) => {
                    return { label: item.label, slug: item.slug }
                } )
            }
        } )
    }
}


export { SidebarLoader }
