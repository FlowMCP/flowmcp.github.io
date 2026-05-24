// Mobile-Menu a11y tests — Memo 057 PRD-07
// Covers: aria-expanded toggle, aria-controls present, axe scan on mobile viewport.

import { test, expect, devices } from '@playwright/test'
import { runAxe, assertNoViolations } from './helpers.mjs'


test.use( { ...devices[ 'iPhone 13' ] } )


test.describe( 'Mobile-Menu a11y', () => {
    test( '1. axe scan passes on home page (mobile viewport)', async ( { page } ) => {
        await page.goto( '/' )
        await page.waitForLoadState( 'domcontentloaded' )
        const results = await runAxe( { page, include: 'starlight-menu-button, nav.sidebar' } )
        assertNoViolations( { results, expect, label: 'mobile-menu' } )
    } )

    test( '2. toggle button has aria-expanded and aria-controls', async ( { page } ) => {
        await page.goto( '/' )
        await page.waitForLoadState( 'domcontentloaded' )
        const button = page.locator( 'starlight-menu-button button' ).first()
        await expect( button ).toHaveAttribute( 'aria-expanded', 'false' )
        await expect( button ).toHaveAttribute( 'aria-controls', /sidebar/i )
    } )

    test( '3. aria-expanded toggles to true on click', async ( { page } ) => {
        await page.goto( '/' )
        await page.waitForLoadState( 'domcontentloaded' )
        const button = page.locator( 'starlight-menu-button button' ).first()
        await button.click()
        await page.waitForTimeout( 100 )
        await expect( button ).toHaveAttribute( 'aria-expanded', 'true' )
        // Click again to close
        await button.click()
        await page.waitForTimeout( 100 )
        await expect( button ).toHaveAttribute( 'aria-expanded', 'false' )
    } )
} )
