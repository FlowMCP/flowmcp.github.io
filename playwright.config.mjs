import { defineConfig, devices } from '@playwright/test'

export default defineConfig( {
    testDir: './tests/playwright',
    fullyParallel: true,
    forbidOnly: !! process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:4321',
        trace: 'on-first-retry',
    },
    projects: [
        { name: 'chromium-desktop',  use: { ...devices[ 'Desktop Chrome' ] } },
        { name: 'mobile-safari',     use: { ...devices[ 'iPhone 13' ] } },
    ],
    webServer: {
        command: 'npm run build && npm run preview -- --port 4321',
        url: 'http://localhost:4321',
        reuseExistingServer: ! process.env.CI,
        timeout: 180_000,
    },
} )
