// copy-markdown.spec.mjs — Memo 060 Phase 7 PRD-023
// End-to-end verification of the CopyMarkdown component on a real built site.
//
// Coverage:
//   A. Whole-page copy on Hackathon Kit (EN) — text + state revert
//   B. Skill-block copy on Hackathon Kit (EN) — slot content + format
//   C. Button-state revert visual check on Hackathon Kit
//   D. DE variant on CLI Setup — label and clipboard payload

import { test, expect } from '@playwright/test'


test.describe( 'CopyMarkdown component', () => {
    test.skip( ( { browserName } ) => browserName === 'webkit', 'webkit clipboard permissions API is unreliable in Playwright' )

    test.beforeEach( async ( { context } ) => {
        await context.grantPermissions( [ 'clipboard-read', 'clipboard-write' ] )
    } )

    test( 'A. whole-page copy on Hackathon Kit', async ( { page } ) => {
        await page.goto( '/guides/hackathon-kit/' )

        const button = page.locator( 'button[data-copy-mode="page"]' ).first()
        await expect( button ).toBeVisible()
        await expect( button ).toContainText( 'Copy page as Markdown' )

        await button.click()

        await expect( button ).toContainText( 'Copied!', { timeout: 1500 } )

        const clipboardText = await page.evaluate( () => navigator.clipboard.readText() )
        expect( clipboardText.length ).toBeGreaterThan( 500 )
        expect( clipboardText.toLowerCase() ).toContain( 'hackathon' )

        await expect( button ).toContainText( 'Copy page as Markdown', { timeout: 3000 } )
    } )

    test( 'B. skill-block copy on Hackathon Kit', async ( { page } ) => {
        await page.goto( '/guides/hackathon-kit/' )

        const slotButton = page.locator( 'button[data-copy-mode="slot"]' ).first()
        await expect( slotButton ).toBeVisible()

        await slotButton.click()
        await expect( slotButton ).toContainText( 'Copied!', { timeout: 1500 } )

        const clipboardText = await page.evaluate( () => navigator.clipboard.readText() )
        expect( clipboardText.startsWith( '---' ) ).toBe( true )
        expect( clipboardText ).toContain( 'name: flowmcp-hackathon-kit' )
        expect( clipboardText ).toContain( 'description:' )
        expect( clipboardText.length ).toBeLessThan( 2000 )
    } )

    test( 'C. button state reverts after 2s', async ( { page } ) => {
        await page.goto( '/guides/hackathon-kit/' )

        const button = page.locator( 'button[data-copy-mode="page"]' ).first()
        const idleText = ( await button.textContent() || '' ).trim()
        expect( idleText ).toContain( 'Copy page as Markdown' )

        await button.click()

        // wait for state transition to complete (clipboard write is async)
        await expect( button ).toContainText( 'Copied!', { timeout: 1500 } )
        await expect( button ).toHaveAttribute( 'data-state', 'done' )

        // wait for revert (component uses 2s timeout)
        await page.waitForTimeout( 2500 )

        const revertedText = ( await button.textContent() || '' ).trim()
        expect( revertedText ).toEqual( idleText )
        expect( await button.getAttribute( 'data-state' ) ).toBeNull()
    } )

    test( 'D. DE variant on CLI Setup uses German labels', async ( { page } ) => {
        await page.goto( '/de/quickstart/installation/' )

        const button = page.locator( 'button[data-copy-mode="page"]' ).first()
        await expect( button ).toBeVisible()
        await expect( button ).toContainText( 'Seite als Markdown kopieren' )

        await button.click()
        await expect( button ).toContainText( 'Kopiert!', { timeout: 1500 } )

        const clipboardText = await page.evaluate( () => navigator.clipboard.readText() )
        expect( clipboardText.length ).toBeGreaterThan( 200 )
    } )
} )
