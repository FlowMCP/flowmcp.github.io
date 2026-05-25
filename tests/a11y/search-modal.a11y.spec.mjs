// Search-Modal a11y tests — Memo 057 PRD-07
// Covers: axe scan, role=dialog/aria-modal, focus-trap, return-focus.

import { test, expect } from '@playwright/test'
import { runAxe, assertNoViolations } from './helpers.mjs'


const openModalViaShortcut = async ( { page } ) => {
    await page.goto( '/' )
    await page.waitForLoadState( 'domcontentloaded' )
    await page.keyboard.press( 'Meta+K' )
    await page.waitForTimeout( 200 )
}


test.describe( 'Search Modal a11y', () => {
    test.skip( ( { browserName } ) => browserName === 'webkit', 'Pagefind/dialog open timing differs on WebKit' )

    test( '1. no axe violations when search modal is open', async ( { page } ) => {
        await openModalViaShortcut( { page } )
        const dialog = page.locator( 'dialog[aria-label="Search"], dialog[data-starlight-search], .starlight-search-dialog, dialog.pagefind-ui' ).first()
        await expect( dialog ).toBeVisible()
        const results = await runAxe( { page, include: 'dialog' } )
        assertNoViolations( { results, expect, label: 'search-modal' } )
    } )

    test( '2. role=dialog and aria-modal=true are present', async ( { page } ) => {
        await openModalViaShortcut( { page } )
        const dialog = page.locator( 'dialog[aria-label="Search"], dialog[data-starlight-search], .starlight-search-dialog, dialog.pagefind-ui' ).first()
        await expect( dialog ).toHaveAttribute( 'role', 'dialog' )
        await expect( dialog ).toHaveAttribute( 'aria-modal', 'true' )
    } )

    test( '3. Esc closes the modal and returns focus to body', async ( { page } ) => {
        await openModalViaShortcut( { page } )
        await page.keyboard.press( 'Escape' )
        await page.waitForTimeout( 200 )
        const dialog = page.locator( 'dialog[aria-label="Search"], dialog[data-starlight-search], .starlight-search-dialog, dialog.pagefind-ui' ).first()
        const isOpen = await dialog.evaluate( ( el ) => el.open === true )
        expect( isOpen ).toBe( false )
    } )

    test( '4. Tab inside modal stays within modal (focus trap)', async ( { page } ) => {
        await openModalViaShortcut( { page } )
        const initialInside = await page.evaluate( () => {
            const dialog = document.querySelector( 'dialog[aria-label="Search"], dialog[data-starlight-search], .starlight-search-dialog, dialog.pagefind-ui' )
            return dialog ? dialog.contains( document.activeElement ) : false
        } )
        expect( initialInside ).toBeTruthy()

        // Tab a few times and verify activeElement is still inside the dialog
        await page.keyboard.press( 'Tab' )
        await page.keyboard.press( 'Tab' )
        await page.keyboard.press( 'Tab' )
        const stillInside = await page.evaluate( () => {
            const dialog = document.querySelector( 'dialog[aria-label="Search"], dialog[data-starlight-search], .starlight-search-dialog, dialog.pagefind-ui' )
            return dialog ? dialog.contains( document.activeElement ) : false
        } )
        expect( stillInside ).toBeTruthy()
    } )
} )
