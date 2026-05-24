// TOC a11y tests — Memo 057 PRD-07
// Covers: aside aria-label="On this page", aria-current="location" on active link, axe scan.

import { test, expect } from '@playwright/test'
import { runAxe, assertNoViolations } from './helpers.mjs'


test.describe( 'TOC a11y', () => {
    test.skip( ( { browserName } ) => browserName === 'webkit', 'Mobile-Safari hides TOC by design (PRD-02)' )

    test( '1. axe scan passes on Quickstart page', async ( { page } ) => {
        await page.goto( '/quickstart/what-is-flowmcp/' )
        await page.waitForLoadState( 'domcontentloaded' )
        const results = await runAxe( { page, include: '.right-sidebar, starlight-toc' } )
        assertNoViolations( { results, expect, label: 'toc' } )
    } )

    test( '2. TOC aside has aria-label="On this page"', async ( { page } ) => {
        await page.goto( '/quickstart/what-is-flowmcp/' )
        await page.waitForLoadState( 'domcontentloaded' )
        await page.waitForTimeout( 400 )
        const labelled = await page.evaluate( () => {
            const toc = document.querySelector( 'starlight-toc, .right-sidebar' )
            if( ! toc ) { return null }
            const aside = toc.closest( 'aside' ) || toc
            return aside.getAttribute( 'aria-label' )
        } )
        expect( labelled ).toBe( 'On this page' )
    } )

    test( '3. some TOC link has aria-current="location" after scroll', async ( { page } ) => {
        await page.goto( '/quickstart/what-is-flowmcp/' )
        await page.waitForLoadState( 'domcontentloaded' )
        // Scroll into the body to trigger the IntersectionObserver
        await page.evaluate( () => window.scrollTo( 0, 400 ) )
        await page.waitForTimeout( 500 )
        const count = await page.locator( '.right-sidebar a[aria-current="location"], starlight-toc a[aria-current="location"]' ).count()
        expect( count ).toBeGreaterThan( 0 )
    } )
} )
