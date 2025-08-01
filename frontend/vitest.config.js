import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.js',
        'playwright.config.js'
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85
      }
    },
    setupFiles: ['./tests/setup.js']
  }
});