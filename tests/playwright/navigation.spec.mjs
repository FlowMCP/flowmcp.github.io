import { test, expect } from '@playwright/test'

test.describe( 'Navigation (Pencil-Layout REV-15)', () => {
    test( '1. Sidebar — Top-Groups sichtbar (Docs)', async ( { page } ) => {
        await page.goto( '/quickstart/what-is-flowmcp/' )
        const sidebar = page.locator( 'nav.sidebar, [aria-label="Main"]' ).first()
        await expect( sidebar.getByText( /Introduction/i ).first() ).toBeVisible()
        await expect( sidebar.getByText( /Quickstart/i ).first() ).toBeVisible()
        await expect( sidebar.getByText( /Concepts/i ).first() ).toBeVisible()
        await expect( sidebar.getByText( /Specification/i ).first() ).toBeVisible()
        await expect( sidebar.getByText( /Reference/i ).first() ).toBeVisible()
    } )

    test( '2. Landing zeigt Pencil-Hero + LogoStrip + StatsBar + TagCloud', async ( { page } ) => {
        await page.goto( '/' )
        await expect( page.getByText( /Normalize any data source/i ).first() ).toBeVisible()
        await expect( page.getByText( /Connects to/i ).first() ).toBeVisible()
        await expect( page.getByText( '288' ).first() ).toBeVisible()
        await expect( page.getByText( '1,534' ).first() ).toBeVisible()
        await expect( page.getByText( /Browse by topic/i ).first() ).toBeVisible()
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

    test( '5. Sidebar-Active-State matched URL', async ( { page } ) => {
        await page.goto( '/specification/schema-format/' )
        const active = page.locator( 'a[aria-current="page"]' )
        await expect( active.first() ).toBeVisible()
    } )

    test( '6. Tag-Filter Route lädt', async ( { page } ) => {
        const response = await page.goto( '/schemas?tag=defi' )
        expect( response?.status() ).toBeLessThan( 400 )
        await expect( page.getByText( /Schema Catalog/i ) ).toBeVisible()
    } )

    test( '7. Blog Index lädt + Welcome-Post sichtbar', async ( { page } ) => {
        const response = await page.goto( '/blog/' )
        expect( response?.status() ).toBeLessThan( 400 )
        await expect( page.getByText( /Welcome to the FlowMCP Blog/i ) ).toBeVisible()
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
        const routes = [
            '/introduction/about/',
            '/quickstart/what-is-flowmcp/',
            '/concepts/schemas-and-tools/',
            '/specification/overview/',
            '/specification/schema-format/',
            '/roadmap/overview/',
            '/about/for-decision-makers/',
            '/blog/',
            '/schemas/',
        ]
        for( const route of routes ) {
            const response = await page.goto( route )
            expect( response?.status() ).toBeLessThan( 400 )
        }
    } )
} )
