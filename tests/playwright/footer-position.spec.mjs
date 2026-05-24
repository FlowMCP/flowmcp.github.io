import { test, expect } from '@playwright/test'

// Memo 060 PRD-003: Footer-Position-Bug About-Page
// Verifies sticky-footer pattern: short pages (e.g. /about/) hug the viewport
// bottom; long pages (e.g. /specification/overview/) push the footer below
// content (footer not floating above the viewport bottom).

const VIEWPORT_WIDTH = 1440
const VIEWPORT_HEIGHT = 900
const TOLERANCE_PX = 10


test.describe( 'Footer position (Memo 060 PRD-003)', () => {
    test.beforeEach( async ( { page } ) => {
        await page.setViewportSize( { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } )
    } )

    test( '1. About-Page (EN) — Footer klebt am Viewport-Bottom', async ( { page } ) => {
        await page.goto( '/about/' )
        const footer = page.locator( 'footer.pencil-footer' )
        await expect( footer ).toBeVisible()
        const box = await footer.boundingBox()
        expect( box ).not.toBeNull()
        const footerBottom = box.y + box.height
        expect( footerBottom ).toBeGreaterThanOrEqual( VIEWPORT_HEIGHT - TOLERANCE_PX )
    } )

    test( '2. About-Page (DE) — Footer klebt am Viewport-Bottom', async ( { page } ) => {
        await page.goto( '/de/about/' )
        const footer = page.locator( 'footer.pencil-footer' )
        await expect( footer ).toBeVisible()
        const box = await footer.boundingBox()
        expect( box ).not.toBeNull()
        const footerBottom = box.y + box.height
        expect( footerBottom ).toBeGreaterThanOrEqual( VIEWPORT_HEIGHT - TOLERANCE_PX )
    } )

    test( '3. Specification-Overview — Footer sitzt unter dem Content, nicht im Viewport', async ( { page } ) => {
        await page.goto( '/specification/overview/' )
        const footer = page.locator( 'footer.pencil-footer' )
        await expect( footer ).toBeAttached()
        const box = await footer.boundingBox()
        expect( box ).not.toBeNull()
        const footerTop = box.y
        // On long pages, footer must NOT float above the viewport bottom.
        // It either sits at/below the viewport bottom (off-screen until scroll)
        // or — if the content is shorter than expected — at the viewport bottom.
        expect( footerTop ).toBeGreaterThanOrEqual( VIEWPORT_HEIGHT - TOLERANCE_PX )
    } )

    test( '4. Sticky-Footer CSS — body > .page ist flex-column mit min-height: 100vh', async ( { page } ) => {
        await page.goto( '/about/' )
        const styles = await page.evaluate( () => {
            const pageEl = document.querySelector( 'body > .page' )
            if( !pageEl ) return null
            const cs = window.getComputedStyle( pageEl )
            return {
                display: cs.display,
                flexDirection: cs.flexDirection,
                minHeight: cs.minHeight,
            }
        } )
        expect( styles ).not.toBeNull()
        expect( styles.display ).toBe( 'flex' )
        expect( styles.flexDirection ).toBe( 'column' )
        // min-height may be reported in px (e.g. "900px") when computed
        const minHeightPx = parseFloat( styles.minHeight )
        expect( minHeightPx ).toBeGreaterThanOrEqual( VIEWPORT_HEIGHT - 1 )
    } )

    test( '5. main-frame ist flex-column und stretcht (flex: 1 0 auto)', async ( { page } ) => {
        // Footer is rendered inside <main>, not as a direct child of .main-frame.
        // Sticky-effect therefore depends on .main-frame stretching to fill the
        // .page (min-height: 100vh), pushing <main> + footer to the bottom.
        await page.goto( '/about/' )
        const styles = await page.evaluate( () => {
            const mf = document.querySelector( 'body > .page > .main-frame' )
            if( !mf ) return null
            const cs = window.getComputedStyle( mf )
            return {
                display: cs.display,
                flexDirection: cs.flexDirection,
                flexGrow: cs.flexGrow,
                flexShrink: cs.flexShrink,
                flexBasis: cs.flexBasis,
            }
        } )
        expect( styles ).not.toBeNull()
        expect( styles.display ).toBe( 'flex' )
        expect( styles.flexDirection ).toBe( 'column' )
        expect( parseFloat( styles.flexGrow ) ).toBe( 1 )
        expect( parseFloat( styles.flexShrink ) ).toBe( 0 )
        expect( styles.flexBasis ).toBe( 'auto' )
    } )
} )
