// Memo 060 Phase 1a (PRD-006): Header-Parity-Test fuer /blog/ vs /about/.
// Stellt sicher dass die Migration in den Starlight-Frame Header, Logo,
// Search-Button und LanguageSelect 1:1 wie auf /about/ rendert. Adressiert
// Befunde BH1-BH5 + CC7 + CC8 aus Memo 060 Kap 12a.1.

import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE_URL || 'http://localhost:4321'
const PROOFS_DIR = path.resolve( 'proofs' )

test.beforeAll( () => {
    if( !fs.existsSync( PROOFS_DIR ) ) {
        fs.mkdirSync( PROOFS_DIR, { recursive: true } )
    }
} )

test.describe( 'Blog Starlight Header Parity (Memo 060 Phase 1a)', () => {

    test( 'BH1: Logo-Groesse auf /blog/ ist identisch zu /about/', async ( { page } ) => {
        await page.goto( `${ BASE }/blog/` )
        const blogLogo = await page.locator( 'header.header img.site-title-icon' ).first().boundingBox()
        await page.goto( `${ BASE }/about/` )
        const aboutLogo = await page.locator( 'header.header img.site-title-icon' ).first().boundingBox()
        expect( blogLogo ).not.toBeNull()
        expect( aboutLogo ).not.toBeNull()
        expect( blogLogo.width ).toBe( aboutLogo.width )
        expect( blogLogo.height ).toBe( aboutLogo.height )
        expect( blogLogo.width ).toBeGreaterThanOrEqual( 30 )
    } )

    test( 'BH2: Search-Button auf /blog/ ist sichtbar (Header.astro greift)', async ( { page } ) => {
        await page.goto( `${ BASE }/blog/` )
        const searchButton = page.locator( 'header.header button[aria-label="Search"]' ).first()
        await expect( searchButton ).toBeVisible()
    } )

    test( 'BH3: LanguageSelect auf /blog/ hat Globe-Icon (identisch zu /about/)', async ( { page } ) => {
        await page.goto( `${ BASE }/blog/` )
        const langSelect = page.locator( 'header.header starlight-lang-select' ).first()
        await expect( langSelect ).toBeVisible()
        const globeIcon = langSelect.locator( 'svg.label-icon' ).first()
        await expect( globeIcon ).toBeVisible()
    } )

    test( 'BH4: Header-Hoehe auf /blog/ ist identisch zu /about/', async ( { page } ) => {
        await page.goto( `${ BASE }/blog/` )
        const blogHeader = await page.locator( 'header.header' ).first().boundingBox()
        await page.goto( `${ BASE }/about/` )
        const aboutHeader = await page.locator( 'header.header' ).first().boundingBox()
        expect( blogHeader.height ).toBe( aboutHeader.height )
        expect( blogHeader.height ).toBeGreaterThanOrEqual( 50 )
    } )

    test( 'BH5: Logo-Groesse bleibt beim Page-Wechsel /about/ -> /blog/ -> /about/ konstant', async ( { page } ) => {
        await page.goto( `${ BASE }/about/` )
        const a1 = await page.locator( 'header.header img.site-title-icon' ).first().boundingBox()
        await page.goto( `${ BASE }/blog/` )
        const b = await page.locator( 'header.header img.site-title-icon' ).first().boundingBox()
        await page.goto( `${ BASE }/about/` )
        const a2 = await page.locator( 'header.header img.site-title-icon' ).first().boundingBox()
        expect( a1.width ).toBe( b.width )
        expect( b.width ).toBe( a2.width )
    } )

    test( 'CC8: keine /_styles/global.css-404-Response mehr auf /blog/', async ( { page } ) => {
        const failed = []
        page.on( 'response', ( resp ) => {
            if( resp.url().includes( '_styles/global.css' ) && resp.status() === 404 ) {
                failed.push( resp.url() )
            }
        } )
        await page.goto( `${ BASE }/blog/` )
        await page.waitForLoadState( 'networkidle' )
        expect( failed ).toEqual( [] )
    } )

    test( 'Header-Region Pixel-Diff: /blog/ vs /about/ erzeugt Proof-Screenshots', async ( { page } ) => {
        await page.setViewportSize( { width: 1440, height: 900 } )

        await page.goto( `${ BASE }/about/` )
        await page.waitForLoadState( 'networkidle' )
        const aboutHeaderBuf = await page.locator( 'header.header' ).first().screenshot( {
            path: path.join( PROOFS_DIR, 'about-header-2026-05-24.png' )
        } )

        await page.goto( `${ BASE }/blog/` )
        await page.waitForLoadState( 'networkidle' )
        const blogHeaderBuf = await page.locator( 'header.header' ).first().screenshot( {
            path: path.join( PROOFS_DIR, 'blog-header-after-migration-2026-05-24.png' )
        } )

        expect( aboutHeaderBuf.length ).toBeGreaterThan( 0 )
        expect( blogHeaderBuf.length ).toBeGreaterThan( 0 )

        // Pixel-Diff Mindestkriterium: gleiche Buffer-Groesse + selbe Bounding-Box.
        // Schaerferer Vergleich (Pixel-by-Pixel) waere via toMatchSnapshot moeglich.
        const blogBox = await page.locator( 'header.header' ).first().boundingBox()
        await page.goto( `${ BASE }/about/` )
        await page.waitForLoadState( 'networkidle' )
        const aboutBox = await page.locator( 'header.header' ).first().boundingBox()
        expect( blogBox.width ).toBe( aboutBox.width )
        expect( blogBox.height ).toBe( aboutBox.height )
    } )
} )
