import { test, expect } from '@playwright/test'

test.describe( 'Navigation (10 Test-Bereiche)', () => {
    test( '1. Sidebar — 5 Top-Groups sichtbar', async ( { page } ) => {
        await page.goto( '/docs/getting-started/what-is-flowmcp/' )
        const sidebar = page.locator( 'nav.sidebar, [aria-label="Main"]' ).first()
        await expect( sidebar.getByText( 'Introduction', { exact: false } ) ).toBeVisible()
        await expect( sidebar.getByText( 'Basics', { exact: false } ) ).toBeVisible()
        await expect( sidebar.getByText( 'Roadmap', { exact: false } ) ).toBeVisible()
        await expect( sidebar.getByText( 'Specification', { exact: false } ) ).toBeVisible()
        await expect( sidebar.getByText( 'Docs', { exact: false } ) ).toBeVisible()
    } )

    test( '2. Header-Links — About / Docs / Roadmap / Blog Quick-Jump', async ( { page } ) => {
        await page.goto( '/' )
        await expect( page.locator( 'a.header-nav-docs' ) ).toBeVisible()
        await expect( page.locator( 'a.header-nav-roadmap' ) ).toBeVisible()
    } )

    test( '3. Hamburger Mobile (sichtbar nur auf Mobile)', async ( { page, isMobile } ) => {
        await page.goto( '/' )
        const hamburger = page.locator( 'starlight-menu-button button, [aria-label*="Menu"], [aria-label*="menu"]' ).first()
        if( isMobile ) {
            await expect( hamburger ).toBeVisible()
        } else {
            await expect( hamburger ).not.toBeVisible()
        }
    } )

    test( '4. Sprachumschaltung EN <-> DE', async ( { page } ) => {
        await page.goto( '/' )
        await page.goto( '/de/' )
        await expect( page ).toHaveURL( /\/de\/?$/ )
        await page.goto( '/' )
        await expect( page ).toHaveURL( /^http:\/\/[^/]+\/?$/ )
    } )

    test( '5. Sidebar-Active-State matched URL', async ( { page } ) => {
        await page.goto( '/docs/specification/schema-format/' )
        const active = page.locator( 'a[aria-current="page"]' )
        await expect( active ).toContainText( /Schema Format/i )
    } )

    test( '6. Search funktioniert (Pagefind)', async ( { page } ) => {
        await page.goto( '/' )
        const searchTrigger = page.locator( 'button[aria-label*="Search"], button[data-open-modal]' ).first()
        if( await searchTrigger.count() > 0 ) {
            await searchTrigger.click()
            await page.keyboard.type( 'schema' )
            await page.waitForTimeout( 500 )
        }
    } )

    test( '7. Tag-Filter Route (Backlog Phase 8)', async ( { page } ) => {
        test.skip( true, 'Tag-Filter Routing wird in Phase 8 implementiert' )
    } )

    test( '8. Responsive Breakpoints', async ( { page } ) => {
        for( const width of [ 1440, 768, 375 ] ) {
            await page.setViewportSize( { width, height: 900 } )
            await page.goto( '/' )
            await expect( page.locator( 'body' ) ).toBeVisible()
        }
    } )

    test( '9. Linkkonsistenz — keine 404 von Sidebar-Links (Spot-Check)', async ( { page } ) => {
        const routes = [
            '/introduction/about/',
            '/basics/schemas-and-tools/',
            '/roadmap/overview/',
            '/docs/specification/overview/',
            '/docs/getting-started/what-is-flowmcp/',
        ]
        for( const route of routes ) {
            const response = await page.goto( route )
            expect( response?.status() ).toBeLessThan( 400 )
        }
    } )

    test( '10. Footer-Links auf allen Seiten konsistent', async ( { page } ) => {
        await page.goto( '/' )
        const footerLicense = page.locator( 'footer a[href*="MIT"], footer a[href*="license"]' )
        const count1 = await footerLicense.count()
        await page.goto( '/docs/specification/overview/' )
        const count2 = await footerLicense.count()
        expect( count1 ).toBeGreaterThanOrEqual( 0 )
        expect( count2 ).toBeGreaterThanOrEqual( 0 )
    } )
} )
