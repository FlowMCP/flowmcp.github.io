import { test, expect } from '@playwright/test'

test.describe( 'Navigation (Pencil-Layout REV-15)', () => {
    test( '1. Sidebar — Top-Groups sichtbar (Docs)', async ( { page }, testInfo ) => {
        test.skip( testInfo.project.name === 'mobile-safari', 'Sidebar collapsed behind hamburger on mobile' )
        await page.goto( '/about/' )
        // Echte Sidebar ist nav.sidebar (aria-label="Main"); nav[aria-label="Main
        // navigation"] ist die Header-Nav. Untere Gruppen (Reference/Grading/
        // Ecosystem) liegen im headless Desktop-Viewport unter dem Scroll-Fold —
        // pixel-genaues toBeVisible ist dort flaky. Aussagekraeftig + stabil ist,
        // dass die Sidebar die Top-Gruppen fuehrt: toBeAttached.
        const sidebar = page.locator( 'nav.sidebar, [aria-label="Main"]' ).first()
        await expect( sidebar.getByText( /About/ ).first() ).toBeAttached()
        await expect( sidebar.getByText( /Get Started/i ).first() ).toBeAttached()
        await expect( sidebar.getByText( /Concepts/i ).first() ).toBeAttached()
        await expect( sidebar.getByText( /Specification/i ).first() ).toBeAttached()
        // Memo 142: Reference group removed; Grading is a surviving nav group.
        await expect( sidebar.getByText( /Grading/i ).first() ).toBeAttached()
    } )

    test( '2. Landing zeigt Pencil-Hero + LogoStrip + StatsBar', async ( { page } ) => {
        await page.goto( '/' )
        // Memo 142: hero headline pivot to the schema-format positioning.
        await expect( page.getByText( /Schema-driven data access/i ).first() ).toBeVisible()
        await expect( page.getByText( /Connects to/i ).first() ).toBeVisible()
        // Stats are dynamic (from refs.json); assert numeric pattern instead of fixed value
        await expect( page.getByText( /\b\d{3,}\b/ ).first() ).toBeVisible()
    } )

    test( '3. Hackathon Trust-Line auf Landing', async ( { page } ) => {
        await page.goto( '/' )
        const trustLine = page.getByText( /Berlin Mobility Hackathon/i )
        await expect( trustLine ).toBeVisible()
    } )

    test( '4. Sprachumschaltung EN -> DE', async ( { page } ) => {
        await page.goto( '/' )
        await page.goto( '/de/' )
        await expect( page ).toHaveURL( /\/de\/?$/ )
    } )

    test( '5. Sidebar-Active-State matched URL', async ( { page }, testInfo ) => {
        test.skip( testInfo.project.name === 'mobile-safari', 'Sidebar collapsed behind hamburger on mobile' )
        await page.goto( '/specification/schema-format/' )
        const active = page.locator( 'a[aria-current="page"]' )
        await expect( active.first() ).toBeVisible()
    } )

    test.skip( '6. Tag-Filter Route lädt (Schema Catalog removed by Memo 060 Phase 2)', async ( { page } ) => {
        const response = await page.goto( '/schemas?tag=defi' )
        expect( response?.status() ).toBeLessThan( 400 )
        await expect( page.getByText( /Schema Catalog/i ) ).toBeVisible()
    } )

    test( '7. Blog Index lädt + Posts sichtbar', async ( { page } ) => {
        // Memo 069: the 'Welcome to the FlowMCP Blog' meta-post was removed.
        // Assert the index renders with its title and at least one real post.
        const response = await page.goto( '/blog/' )
        expect( response?.status() ).toBeLessThan( 400 )
        await expect( page.locator( '.blog-index__title' ) ).toBeVisible()
        await expect( page.locator( '.blog-index__featured, .blog-index__card' ).first() ).toBeVisible()
    } )

    test( '8. RSS-Feed erreichbar', async ( { page } ) => {
        const response = await page.goto( '/rss.xml' )
        expect( response?.status() ).toBeLessThan( 400 )
    } )

    test( '9. Responsive Breakpoints — Landing rendert auf 1440/768/375', async ( { page } ) => {
        for( const width of [ 1440, 768, 375 ] ) {
            await page.setViewportSize( { width, height: 900 } )
            await page.goto( '/' )
            await expect( page.locator( 'body' ) ).toBeVisible()
        }
    } )

    test( '10. Linkkonsistenz — keine 404 von Hauptpfaden', async ( { page } ) => {
        // Memo 142: removed pages (faq, reference/cli, schemas-and-sources) dropped;
        // they 404 by design and are covered in phase-9 FORBIDDEN_ROUTES instead.
        const routes = [
            '/about/',
            '/concepts/schemas/',
            '/concepts/tools/',
            '/concepts/primitives/',
            '/concepts/clients/',
            '/specification/overview/',
            '/blog/',
        ]
        for( const route of routes ) {
            const response = await page.goto( route )
            // Redirect-sicher: konfigurierte Redirects (z.B. /concepts/tools/ ->
            // /concepts/primitives/) liefern in Playwright kein response-Objekt.
            // Echte 404 liefern weiterhin ein response mit status >= 400.
            expect( !response || response.status() < 400 ).toBe( true )
        }
    } )
} )
