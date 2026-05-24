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


class SidebarLoader {
    static buildSidebar() {
        const manifest = SidebarLoader.#loadManifest()
        SidebarLoader.#assertManifest( { manifest } )

        const filtered = manifest.files.filter( ( file ) => {
            return file.filename !== 'route-tests.md'
        } )

        const groups = SidebarLoader.#groupByCategory( { files: filtered } )
        const items = SidebarLoader.#renderGroups( { groups } )

        return { items, totalFiles: filtered.length }
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
            groups[ key ].items.push( {
                label: file.title,
                slug: `specification/${ file.slug }`,
                badge: file.version_added ? { text: `v${ file.version_added }`, variant: 'note' } : null
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
                    const entry = { label: item.label, slug: item.slug }
                    if( item.badge ) entry.badge = item.badge
                    return entry
                } )
            }
        } )
    }
}


export { SidebarLoader }
