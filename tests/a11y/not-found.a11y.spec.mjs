// 404-Page a11y tests — Memo 057 PRD-07
// Covers: role="main", h1+h2 hierarchy, axe scan.

import { test, expect } from '@playwright/test'
import { runAxe, assertNoViolations } from './helpers.mjs'


test.describe( '404-Page a11y', () => {
    test( '1. axe scan passes on the 404 page', async ( { page } ) => {
        const response = await page.goto( '/404.html', { waitUntil: 'domcontentloaded' } )
        expect( response ).not.toBeNull()
        const results = await runAxe( { page } )
        assertNoViolations( { results, expect, label: '404' } )
    } )

    test( '2. main element has role="main"', async ( { page } ) => {
        await page.goto( '/404.html', { waitUntil: 'domcontentloaded' } )
        const main = page.locator( 'main[role="main"]' ).first()
        await expect( main ).toBeVisible()
    } )

    test( '3. h1 and h2 hierarchy is present', async ( { page } ) => {
        await page.goto( '/404.html', { waitUntil: 'domcontentloaded' } )
        const h1 = page.locator( 'h1' )
        const h2 = page.locator( 'h2' )
        await expect( h1 ).toHaveCount( 1 )
        const h2Count = await h2.count()
        expect( h2Count ).toBeGreaterThanOrEqual( 1 )
    } )
} )
