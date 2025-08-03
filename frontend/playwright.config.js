import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E testing configuration for AI Conflict Dashboard
 * Follows JAVASCRIPT-STANDARDS.md requirements
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Timeout per test (30 seconds)
  timeout: 30 * 1000,

  // Expect timeout for assertions
  expect: {
    timeout: 5000,
  },

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI for stability
  workers: process.env.CI ? 1 : undefined,

  // Enhanced reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['line'],
    // Add JUnit reporter for CI integration
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  // Shared settings for all tests
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Record video on failure
    video: 'retain-on-failure',

    // Ignore HTTPS errors for development
    ignoreHTTPSErrors: true,

    // Default navigation timeout
    navigationTimeout: 15000,

    // Default action timeout
    actionTimeout: 5000,

    // Locale for testing
    locale: 'en-US',

    // Timezone for testing
    timezoneId: 'America/New_York',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile testing for responsive design
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Web server configuration - disabled for manual control
  // webServer: [
  //   {
  //     command: 'echo "Frontend already running on port 3000"',
  //     port: 3000,
  //     reuseExistingServer: true,
  //     stdout: 'ignore',
  //     stderr: 'pipe',
  //   },
  //   {
  //     command: 'echo "Backend already running on port 8000"',
  //     port: 8000,
  //     reuseExistingServer: true,
  //     stdout: 'ignore',
  //     stderr: 'pipe',
  //   },
  // ],

  // Output directory for test artifacts
  outputDir: 'test-results/',

  // Global timeout for entire test run (10 minutes)
  globalTimeout: 10 * 60 * 1000,
});
