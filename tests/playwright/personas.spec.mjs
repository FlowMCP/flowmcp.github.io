import { test, expect } from '@playwright/test'

test.describe( 'Persona-E2E-Pfade (Memo 045 REV-15 Kap. 2)', () => {
    test( 'Hackathon-Builder — Landing -> Docs -> Quickstart', async ( { page } ) => {
        await page.goto( '/' )
        await expect( page ).toHaveTitle( /FlowMCP/ )
        await page.goto( '/docs/getting-started/quickstart/' )
        const heading = page.locator( 'h1' ).first()
        await expect( heading ).toContainText( /Quickstart/i )
    } )

    test( 'AI-Engineer — Landing -> Reference', async ( { page } ) => {
        await page.goto( '/' )
        await page.goto( '/docs/reference/core-methods/' )
        const heading = page.locator( 'h1' ).first()
        await expect( heading ).toContainText( /Core Methods/i )
    } )

    test( 'Schema-Maintainer — Landing -> Specification -> Schema-Format', async ( { page } ) => {
        await page.goto( '/' )
        await page.goto( '/docs/specification/schema-format/' )
        const heading = page.locator( 'h1' ).first()
        await expect( heading ).toContainText( /Schema Format/i )

        const content = await page.locator( 'main' ).textContent()
        expect( content ).toContain( '4.0.0' )
    } )

    test( 'Decision-Maker — Landing -> Introduction -> Roadmap, Trust-Signale sichtbar', async ( { page } ) => {
        await page.goto( '/' )
        await expect( page.getByText( /Hackathon/i ) ).toBeVisible()
        await expect( page.getByText( '288' ) ).toBeVisible()

        await page.goto( '/introduction/about/' )
        await page.goto( '/roadmap/overview/' )
        const heading = page.locator( 'h1' ).first()
        await expect( heading ).toBeVisible()
    } )
} )
