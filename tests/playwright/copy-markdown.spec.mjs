// copy-markdown.spec.mjs — Memo 064 Phase 4 PRD-009 (updated)
//
// The old two-button design (verbose page button + skill slot button via the
// retired CopyMarkdown.astro component) was replaced by ONE small icon button
// injected on the heading line of EVERY content page via the PageTitle override
// (HeaderCopyButton.astro). This spec was rewritten to verify the new design.
//
// Coverage:
//   A. Exactly ONE header copy button on a guide page (EN) — visible
//   B. Click copies page content as Markdown + shows "Copied to clipboard"
//   C. Button state reverts after ~2s
//   D. DE variant uses German feedback ("In Zwischenspeicher kopiert")

import { test, expect } from '@playwright/test'


test.describe( 'Header copy-markdown button', () => {
    test.skip( ( { browserName } ) => browserName === 'webkit', 'webkit clipboard permissions API is unreliable in Playwright' )

    test.beforeEach( async ( { context } ) => {
        await context.grantPermissions( [ 'clipboard-read', 'clipboard-write' ] )
    } )

    // Memo 142: the Hackathon Kit guide was removed; the header copy button is a
    // generic per-page feature, so these assert it on a surviving content page.
    test( 'A. exactly one header copy button on Quickstart', async ( { page } ) => {
        await page.goto( '/quickstart/quickstart/' )

        const buttons = page.locator( 'button[data-header-copy]' )
        await expect( buttons ).toHaveCount( 1 )
        await expect( buttons.first() ).toBeVisible()
    } )

    test( 'B. click copies page markdown and shows feedback', async ( { page } ) => {
        await page.goto( '/quickstart/quickstart/' )

        const button = page.locator( 'button[data-header-copy]' ).first()
        await button.click()

        await expect( button ).toContainText( 'Copied to clipboard', { timeout: 1500 } )

        const clipboardText = await page.evaluate( () => navigator.clipboard.readText() )
        expect( clipboardText.length ).toBeGreaterThan( 500 )
        expect( clipboardText.toLowerCase() ).toContain( 'flowmcp' )
    } )

    test( 'C. button state reverts after 2s', async ( { page } ) => {
        await page.goto( '/quickstart/quickstart/' )

        const button = page.locator( 'button[data-header-copy]' ).first()
        await button.click()

        await expect( button ).toHaveAttribute( 'data-state', 'done', { timeout: 1500 } )

        // component reverts after 2s
        await page.waitForTimeout( 2500 )

        expect( await button.getAttribute( 'data-state' ) ).toBeNull()
    } )

    test( 'D. DE variant uses German feedback on CLI Setup', async ( { page } ) => {
        await page.goto( '/de/quickstart/installation/' )

        const button = page.locator( 'button[data-header-copy]' ).first()
        await expect( button ).toBeVisible()

        await button.click()
        await expect( button ).toContainText( 'In Zwischenspeicher kopiert', { timeout: 1500 } )

        const clipboardText = await page.evaluate( () => navigator.clipboard.readText() )
        expect( clipboardText.length ).toBeGreaterThan( 200 )
    } )
} )
