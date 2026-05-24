// TOC a11y — Memo 057 PRD-07
// - <aside aria-label="On this page"> wrapper around Starlight TOC
// - aria-current="location" on the link matching the most-recent intersecting heading
// - IntersectionObserver tracks h2/h3 in main content

const TOC_SELECTORS = [
    'starlight-toc',
    '.right-sidebar mobile-starlight-toc',
    '.right-sidebar'
]


const findToc = () => {
    const found = TOC_SELECTORS
        .map( ( sel ) => document.querySelector( sel ) )
        .find( ( el ) => el !== null )
    return found || null
}


const ensureAsideLabel = () => {
    const toc = findToc()
    if( ! toc ) { return null }
    const aside = toc.closest( 'aside' ) || toc
    if( ! aside.hasAttribute( 'aria-label' ) ) {
        aside.setAttribute( 'aria-label', 'On this page' )
    }
    return aside
}


const collectTocLinks = () => {
    const aside = ensureAsideLabel()
    if( ! aside ) { return [] }
    return Array.from( aside.querySelectorAll( 'a[href^="#"]' ) )
}


const setActive = ( links, id ) => {
    links.forEach( ( link ) => {
        const isActive = link.getAttribute( 'href' ) === `#${id}`
        if( isActive ) {
            link.setAttribute( 'aria-current', 'location' )
        } else {
            link.removeAttribute( 'aria-current' )
        }
    } )
}


let observer = null


const wireObserver = () => {
    if( observer ) { observer.disconnect(); observer = null }
    const links = collectTocLinks()
    if( links.length === 0 ) { return }
    const headings = Array.from( document.querySelectorAll( 'main h2[id], main h3[id]' ) )
    if( headings.length === 0 ) { return }

    let currentId = null

    observer = new IntersectionObserver( ( entries ) => {
        entries.forEach( ( entry ) => {
            if( entry.isIntersecting ) {
                currentId = entry.target.id
                setActive( links, currentId )
            }
        } )
    }, { rootMargin: '0px 0px -70% 0px', threshold: 0 } )

    headings.forEach( ( heading ) => observer.observe( heading ) )
}


let initialized = false


const initTocA11y = () => {
    if( initialized ) { return }
    initialized = true
    const run = () => {
        ensureAsideLabel()
        wireObserver()
    }
    document.addEventListener( 'DOMContentLoaded', run )
    document.addEventListener( 'astro:page-load', () => {
        observer = null
        initialized = false
        initTocA11y()
    } )
    setTimeout( run, 200 )
}


export { initTocA11y }
