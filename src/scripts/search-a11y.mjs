// Search-Modal a11y enhancements — Memo 057 PRD-07
// - role="dialog" + aria-modal="true" + aria-label on Starlight search dialog
// - role="listbox" + role="option" + aria-activedescendant on Pagefind results
// - Focus-trap (Tab cycles inside the modal)
// - Return-Focus to previously-focused element on close
// - aria-live="polite" region announces "{n} results for {q}"

const SEARCH_DIALOG_SELECTORS = [
    'dialog[data-starlight-search]',
    '.starlight-search-dialog',
    'dialog.pagefind-ui'
]

const findDialog = () => {
    const found = SEARCH_DIALOG_SELECTORS
        .map( ( sel ) => document.querySelector( sel ) )
        .find( ( el ) => el !== null )
    return found || null
}

const findFocusables = ( container ) => {
    const selector = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join( ',' )
    return Array.from( container.querySelectorAll( selector ) )
        .filter( ( el ) => el.offsetParent !== null || el === document.activeElement )
}


class FocusTrap {
    static activate( { container } ) {
        const handler = ( event ) => {
            if( event.key !== 'Tab' ) { return }
            const focusables = findFocusables( container )
            if( focusables.length === 0 ) { return }
            const first = focusables[ 0 ]
            const last = focusables[ focusables.length - 1 ]
            const active = document.activeElement
            if( event.shiftKey && active === first ) {
                event.preventDefault()
                last.focus()
                return
            }
            if( ! event.shiftKey && active === last ) {
                event.preventDefault()
                first.focus()
                return
            }
        }
        container.addEventListener( 'keydown', handler )
        return {
            deactivate: () => container.removeEventListener( 'keydown', handler )
        }
    }
}


let trap = null
let previousFocus = null
let liveRegion = null
let lastQuery = ''
let resultCounter = 0
let observerWired = false


const ensureLiveRegion = () => {
    if( liveRegion && document.body.contains( liveRegion ) ) { return liveRegion }
    liveRegion = document.getElementById( 'search-live-region' )
    if( liveRegion ) { return liveRegion }
    liveRegion = document.createElement( 'div' )
    liveRegion.id = 'search-live-region'
    liveRegion.className = 'visually-hidden'
    liveRegion.setAttribute( 'aria-live', 'polite' )
    liveRegion.setAttribute( 'aria-atomic', 'true' )
    document.body.appendChild( liveRegion )
    return liveRegion
}


const announce = ( { count, query } ) => {
    const region = ensureLiveRegion()
    const text = query
        ? `${count} results for ${query}`
        : ''
    region.textContent = text
}


const ensureDialogAria = ( dialog ) => {
    if( dialog.getAttribute( 'role' ) !== 'dialog' ) {
        dialog.setAttribute( 'role', 'dialog' )
    }
    if( dialog.getAttribute( 'aria-modal' ) !== 'true' ) {
        dialog.setAttribute( 'aria-modal', 'true' )
    }
    if( ! dialog.hasAttribute( 'aria-label' ) ) {
        dialog.setAttribute( 'aria-label', 'Search FlowMCP documentation' )
    }
}


const ensureResultsListbox = () => {
    const list = document.querySelector( '.pagefind-ui__results' )
    if( ! list ) { return null }
    if( list.getAttribute( 'role' ) !== 'listbox' ) {
        list.setAttribute( 'role', 'listbox' )
        list.setAttribute( 'aria-label', 'Search results' )
    }
    return list
}


const ensureInputAria = ( dialog ) => {
    const input = dialog.querySelector( '.pagefind-ui__search-input' )
    if( ! input ) { return null }
    if( ! input.hasAttribute( 'aria-label' ) ) {
        input.setAttribute( 'aria-label', 'Search' )
    }
    if( ! input.hasAttribute( 'aria-controls' ) ) {
        input.setAttribute( 'aria-controls', 'pagefind-results-list' )
    }
    if( ! input.hasAttribute( 'aria-autocomplete' ) ) {
        input.setAttribute( 'aria-autocomplete', 'list' )
    }
    if( ! input.hasAttribute( 'aria-activedescendant' ) ) {
        input.setAttribute( 'aria-activedescendant', '' )
    }
    return input
}


const ensureOptionRoles = () => {
    const list = ensureResultsListbox()
    if( ! list ) { return 0 }
    if( ! list.id ) { list.id = 'pagefind-results-list' }
    const items = Array.from( list.querySelectorAll( '.pagefind-ui__result' ) )
    items.forEach( ( item, index ) => {
        if( item.getAttribute( 'role' ) !== 'option' ) {
            item.setAttribute( 'role', 'option' )
        }
        if( ! item.id ) {
            resultCounter += 1
            item.id = `search-result-${resultCounter}-${index}`
        }
    } )
    return items.length
}


const announceFromDom = () => {
    const input = document.querySelector( '.pagefind-ui__search-input' )
    const query = input && input.value ? input.value.trim() : ''
    if( ! query ) { announce( { count: 0, query: '' } ); return }
    if( query === lastQuery ) { return }
    lastQuery = query
    const count = ensureOptionRoles()
    announce( { count, query } )
}


const openTrap = ( dialog ) => {
    if( trap ) { trap.deactivate(); trap = null }
    trap = FocusTrap.activate( { container: dialog } )
}


const closeTrap = () => {
    if( trap ) { trap.deactivate(); trap = null }
    if( previousFocus && typeof previousFocus.focus === 'function' ) {
        try { previousFocus.focus() } catch( e ) {}
    }
    previousFocus = null
    lastQuery = ''
    announce( { count: 0, query: '' } )
}


const wireDialog = ( dialog ) => {
    if( dialog.dataset.prd07Wired === 'true' ) { return }
    dialog.dataset.prd07Wired = 'true'

    ensureDialogAria( dialog )

    dialog.addEventListener( 'close', () => closeTrap() )

    // Watch for open state via attribute changes
    const observer = new MutationObserver( () => {
        if( dialog.open ) {
            if( ! previousFocus ) { previousFocus = document.activeElement }
            ensureDialogAria( dialog )
            ensureInputAria( dialog )
            ensureResultsListbox()
            ensureOptionRoles()
            openTrap( dialog )
        }
    } )
    observer.observe( dialog, { attributes: true, attributeFilter: [ 'open' ] } )

    // Capture trigger focus before showModal() is called
    document.addEventListener( 'keydown', ( event ) => {
        if( ( event.metaKey || event.ctrlKey ) && event.key.toLowerCase() === 'k' ) {
            if( ! dialog.open ) { previousFocus = document.activeElement }
        }
    }, true )
    document.addEventListener( 'click', ( event ) => {
        const trigger = event.target.closest && event.target.closest( '[data-open-modal], button[aria-label*="Search" i]' )
        if( trigger && ! dialog.open ) { previousFocus = document.activeElement }
    }, true )
}


const wireResults = () => {
    if( observerWired ) { return }
    observerWired = true
    const obs = new MutationObserver( () => {
        const dialog = findDialog()
        if( dialog ) {
            ensureDialogAria( dialog )
            ensureInputAria( dialog )
        }
        ensureResultsListbox()
        ensureOptionRoles()
        announceFromDom()
    } )
    obs.observe( document.body, { childList: true, subtree: true } )
}


// Track aria-activedescendant when search-keyboard.mjs marks an item active
const wireActiveDescendant = () => {
    document.addEventListener( 'keydown', ( event ) => {
        if( event.key !== 'ArrowDown' && event.key !== 'ArrowUp' ) { return }
        // Run after search-keyboard handler applies .is-active
        setTimeout( () => {
            const input = document.querySelector( '.pagefind-ui__search-input' )
            if( ! input ) { return }
            const activeItem = document.querySelector( '.pagefind-ui__result.is-active' )
            if( activeItem && activeItem.id ) {
                input.setAttribute( 'aria-activedescendant', activeItem.id )
            } else {
                input.setAttribute( 'aria-activedescendant', '' )
            }
        }, 0 )
    } )
}


let initialized = false


const initSearchA11y = () => {
    if( initialized ) { return }
    initialized = true
    ensureLiveRegion()
    wireResults()
    wireActiveDescendant()

    const tryWire = () => {
        const dialog = findDialog()
        if( dialog ) { wireDialog( dialog ) }
    }

    document.addEventListener( 'DOMContentLoaded', tryWire )
    document.addEventListener( 'astro:page-load', tryWire )
    // Also retry on a short delay in case dialog mounts after first paint
    setTimeout( tryWire, 200 )
    setTimeout( tryWire, 800 )
}


export { initSearchA11y, FocusTrap }
