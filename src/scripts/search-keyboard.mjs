// Search-Keyboard — Memo 057 PRD-05
// Genau 5 Shortcuts, Scope: Search + (Esc-Cross-Scope) Mobile-Menu via Custom-Event
//
// Bewusst KEIN direkter Import von MobileMenuToggle — Cross-Scope-Kopplung
// laeuft ueber window.dispatchEvent( new CustomEvent( 'flowmcp:close-all' ) ).

// Memo 069 PRD-004: the previous three selectors no longer match Starlight's
// rendered markup — the dialog is <dialog class="astro-…"> inside a
// <site-search> web component, with .pagefind-ui as a child (not on the dialog
// itself). Without a match, findSearchDialog() returned null and ArrowUp/Down/
// Enter silently did nothing. Added the two robust selectors below.
const SEARCH_DIALOG_SELECTORS = [
    'dialog[data-starlight-search]',
    '.starlight-search-dialog',
    'dialog.pagefind-ui',
    'site-search dialog',
    'dialog:has(.pagefind-ui)'
]

const findSearchDialog = () => {
    const found = SEARCH_DIALOG_SELECTORS
        .map( ( sel ) => document.querySelector( sel ) )
        .find( ( el ) => el !== null )
    return found || null
}

const findSearchInput = () => {
    return document.querySelector( '.pagefind-ui__search-input' )
}

// Memo 069 PRD-004: navigate over result ITEMS, not links. Pagefind renders
// several .pagefind-ui__result-link per result (title + sub-results), so the
// old link-based setActive toggled is-active on the same item multiple times
// and the highlight never stuck. One item = one navigable step.
const findResultItems = () => {
    return Array.from( document.querySelectorAll( '.pagefind-ui__result' ) )
}

const isTyping = ( event ) => {
    const target = event.target
    if( !target ) { return false }
    const tag = ( target.tagName || '' ).toLowerCase()
    if( tag === 'input' || tag === 'textarea' ) { return true }
    if( target.isContentEditable ) { return true }
    return false
}

const openSearch = () => {
    const dialog = findSearchDialog()
    if( dialog && typeof dialog.showModal === 'function' && !dialog.open ) {
        dialog.showModal()
    }
    setTimeout( () => {
        const input = findSearchInput()
        if( input ) { input.focus() }
    }, 30 )
}

const closeAll = () => {
    const dialog = findSearchDialog()
    if( dialog && dialog.open && typeof dialog.close === 'function' ) {
        dialog.close()
    }
    // Cross-Scope-Signal an MobileMenuToggle (kein direkter Import)
    window.dispatchEvent( new CustomEvent( 'flowmcp:close-all' ) )
}

const focusSearchInput = () => {
    const input = findSearchInput()
    if( !input ) {
        openSearch()
        return
    }
    input.focus()
}

let activeIndex = -1

const setActive = ( items, index ) => {
    if( items.length === 0 ) { return }
    const next = ( ( index % items.length ) + items.length ) % items.length
    let activeId = ''
    items.forEach( ( item, i ) => {
        if( i === next ) {
            item.classList.add( 'is-active' )
            item.setAttribute( 'aria-selected', 'true' )
            // PRD-07: aria-activedescendant Pattern — Input keeps focus,
            // active descendant is referenced by ID. Do not call link.focus().
            if( item.id ) { activeId = item.id }
            if( typeof item.scrollIntoView === 'function' ) {
                item.scrollIntoView( { block: 'nearest' } )
            }
        } else {
            item.classList.remove( 'is-active' )
            item.removeAttribute( 'aria-selected' )
        }
    } )
    activeIndex = next

    // PRD-07: keep focus on the search input, update aria-activedescendant
    const input = findSearchInput()
    if( input ) {
        input.setAttribute( 'aria-activedescendant', activeId )
    }
}

const navigateResults = ( direction ) => {
    const items = findResultItems()
    if( items.length === 0 ) { return false }
    const start = activeIndex < 0 ? ( direction > 0 ? -1 : 0 ) : activeIndex
    setActive( items, start + direction )
    return true
}

const openActiveResult = () => {
    const items = findResultItems()
    if( items.length === 0 || activeIndex < 0 ) { return false }
    const item = items[ activeIndex ]
    if( !item ) { return false }
    const link = item.querySelector( '.pagefind-ui__result-link' )
    if( !link ) { return false }
    link.click()
    return true
}

const handleKeydown = ( event ) => {
    // Esc — immer (auch beim Tippen) Cross-Scope-Close
    if( event.key === 'Escape' ) {
        closeAll()
        return
    }

    // Cmd+K / Ctrl+K — Search oeffnen, global
    if( ( event.metaKey || event.ctrlKey ) && event.key.toLowerCase() === 'k' ) {
        event.preventDefault()
        openSearch()
        return
    }

    // Wenn User tippt: nur dialog-interne Navigation erlaubt
    if( isTyping( event ) ) {
        const dialog = findSearchDialog()
        const isInDialog = dialog && dialog.open && dialog.contains( event.target )
        if( !isInDialog ) { return }
    }

    // "/" — Search-Input fokussieren (nur wenn User nicht tippt)
    if( event.key === '/' && !isTyping( event ) ) {
        event.preventDefault()
        focusSearchInput()
        return
    }

    // ↑ / ↓ / Enter — nur wenn Search-Dialog offen
    const dialog = findSearchDialog()
    if( !dialog || !dialog.open ) { return }

    if( event.key === 'ArrowDown' ) {
        event.preventDefault()
        navigateResults( 1 )
        return
    }
    if( event.key === 'ArrowUp' ) {
        event.preventDefault()
        navigateResults( -1 )
        return
    }
    if( event.key === 'Enter' ) {
        const opened = openActiveResult()
        if( opened ) { event.preventDefault() }
        return
    }
}

const resetActiveOnTyping = () => {
    activeIndex = -1
}

let initialized = false

const init = () => {
    if( initialized ) { return }
    initialized = true
    document.addEventListener( 'keydown', handleKeydown )
    document.addEventListener( 'input', ( event ) => {
        const target = event.target
        if( target && target.classList && target.classList.contains( 'pagefind-ui__search-input' ) ) {
            resetActiveOnTyping()
        }
    } )
}

const reinit = () => {
    activeIndex = -1
    init()
}

document.addEventListener( 'DOMContentLoaded', init )
document.addEventListener( 'astro:page-load', reinit )

export { init }
