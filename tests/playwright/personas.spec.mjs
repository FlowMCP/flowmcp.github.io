import { test, expect } from '@playwright/test'

test.describe( 'Persona-E2E-Pfade (Memo 045 REV-15 Kap. 2)', () => {
    test( 'Hackathon-Builder — Landing -> Docs -> CLI Setup', async ( { page } ) => {
        await page.goto( '/' )
        await expect( page ).toHaveTitle( /FlowMCP/ )
        // Memo 144 T8: the quickstart page H1 is now "CLI Setup" (matches its sidebar label).
        await page.goto( '/quickstart/quickstart/' )
        const heading = page.locator( 'h1' ).first()
        await expect( heading ).toContainText( /CLI Setup/i )
    } )

    test( 'AI-Engineer — Landing -> Specification', async ( { page } ) => {
        // Memo 142: the Reference section was removed; the format Specification is
        // the AI-engineer's canonical destination now.
        await page.goto( '/' )
        await page.goto( '/specification/overview/' )
        const heading = page.locator( 'h1' ).first()
        await expect( heading ).toContainText( /Overview/i )
    } )

    test( 'Schema-Maintainer — Landing -> Specification -> Schema-Format', async ( { page } ) => {
        await page.goto( '/' )
        await page.goto( '/specification/schema-format/' )
        const heading = page.locator( 'h1' ).first()
        await expect( heading ).toContainText( /Schema Format/i )

        const content = await page.locator( 'main' ).textContent()
        expect( content ).toContain( '4.0.0' )
    } )

    test( 'Decision-Maker — Landing -> Introduction -> Roadmap, Trust-Signale sichtbar', async ( { page } ) => {
        await page.goto( '/' )
        await expect( page.getByText( /Hackathon/i ).first() ).toBeVisible()
        // Stats sind dynamisch (aus stats.json) — keine hardcodierte Zahl asserten
        // (Boilerplate-Regel). Stattdessen: irgendeine 3+-stellige Kennzahl sichtbar.
        await expect( page.getByText( /\b\d{3,}\b/ ).first() ).toBeVisible()

        await page.goto( '/introduction/about/' )
        await page.goto( '/roadmap/overview/' )
        const heading = page.locator( 'h1' ).first()
        await expect( heading ).toBeVisible()
    } )
} )
