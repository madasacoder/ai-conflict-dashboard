import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use happy-dom for faster DOM simulation
    environment: 'happy-dom',
    
    // Global test setup
    globals: true,
    
    // Setup files to run before each test
    setupFiles: ['./tests/setup.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        'coverage/',
        '**/*.config.*',
        '**/*.d.ts',
        '**/vendor/**'
      ],
      // Target 85% coverage per CLAUDE.md standards
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    },
    
    // Test file patterns
    include: [
      'tests/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'js/**/*.{test,spec}.{js,ts}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.git',
      '.cache'
    ],
    
    // Test timeout (30 seconds for integration tests)
    testTimeout: 30000,
    
    // Hook timeout
    hookTimeout: 10000,
    
    // Retry failed tests once
    retry: 1,
    
    // Reporter configuration
    reporters: ['verbose', 'html'],
    
    // Output configuration
    outputFile: {
      html: './test-results/index.html'
    }
  },
  
  // Resolve configuration for imports
  resolve: {
    alias: {
      '@': './js',
      '@tests': './tests'
    }
  },
  
  // Define globals for testing environment
  define: {
    // Make testing globals available
    'import.meta.vitest': 'undefined'
  }
});