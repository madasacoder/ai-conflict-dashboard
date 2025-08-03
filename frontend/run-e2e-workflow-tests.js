#!/usr/bin/env node

/**
 * E2E Workflow Test Runner
 * Comprehensive test execution with environment validation and reporting
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

class WorkflowTestRunner {
  constructor() {
    this.testSuites = {
      // Core functionality tests
      smoke: ['e2e/workflow-node-manipulation.spec.js'],

      // Standard workflow tests
      standard: [
        'e2e/workflow-node-manipulation.spec.js',
        'e2e/workflow-builder-comprehensive.spec.js',
      ],

      // Full pipeline tests
      comprehensive: [
        'e2e/workflow-node-manipulation.spec.js',
        'e2e/workflow-builder-comprehensive.spec.js',
        'e2e/story-translation-pipeline.spec.js',
        'e2e/workflow-full-pipeline.spec.js',
      ],
    };

    this.environment = {
      frontend: false,
      backend: false,
      ollama: false,
    };

    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      duration: 0,
      errors: [],
    };
  }

  /**
   * Main test runner entry point
   */
  async run(options = {}) {
    console.log('🚀 Starting E2E Workflow Test Runner...\n');

    const suite = options.suite || 'standard';
    const headless = options.headless !== false;
    const parallel = options.parallel || false;

    try {
      // Step 1: Environment validation
      await this.validateEnvironment();

      // Step 2: Pre-test setup
      await this.preTestSetup();

      // Step 3: Execute test suite
      await this.executeTestSuite(suite, { headless, parallel });

      // Step 4: Generate reports
      await this.generateReports();

      // Step 5: Cleanup
      await this.cleanup();
    } catch (error) {
      console.error('❌ Test runner failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Validate test environment
   */
  async validateEnvironment() {
    console.log('🔍 Validating test environment...');

    // Check frontend
    try {
      const response = await fetch('http://localhost:8080');
      this.environment.frontend = response.ok;
    } catch (error) {
      this.environment.frontend = false;
    }

    // Check backend
    try {
      const response = await fetch('http://localhost:8000/health');
      this.environment.backend = response.ok;
    } catch (error) {
      this.environment.backend = false;
    }

    // Check Ollama
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      this.environment.ollama = response.ok;
    } catch (error) {
      this.environment.ollama = false;
    }

    // Report environment status
    console.log(`Frontend (8080): ${this.environment.frontend ? '✅' : '❌'}`);
    console.log(`Backend (8000): ${this.environment.backend ? '✅' : '❌'}`);
    console.log(`Ollama (11434): ${this.environment.ollama ? '✅' : '⚠️  Optional'}`);

    if (!this.environment.frontend) {
      throw new Error(
        'Frontend not available. Start with: cd frontend && python -m http.server 8080'
      );
    }

    if (!this.environment.backend) {
      throw new Error('Backend not available. Start with: cd backend && uvicorn main:app --reload');
    }

    if (!this.environment.ollama) {
      console.log('⚠️  Ollama not available - LLM tests will be skipped');
    }

    console.log('✅ Environment validation completed\n');
  }

  /**
   * Pre-test setup
   */
  async preTestSetup() {
    console.log('🛠️  Pre-test setup...');

    // Create test results directory
    await this.ensureDirectory('test-results');
    await this.ensureDirectory('test-results/screenshots');
    await this.ensureDirectory('test-results/videos');

    // Clear previous results
    try {
      await fs.rm('test-results/junit.xml', { force: true });
      await fs.rm('test-results/results.json', { force: true });
    } catch (error) {
      // Ignore - files may not exist
    }

    console.log('✅ Pre-test setup completed\n');
  }

  /**
   * Execute test suite
   */
  async executeTestSuite(suiteName, options = {}) {
    console.log(`🧪 Executing ${suiteName} test suite...\n`);

    const tests = this.testSuites[suiteName];
    if (!tests) {
      throw new Error(`Unknown test suite: ${suiteName}`);
    }

    const startTime = Date.now();

    for (const testFile of tests) {
      console.log(`Running: ${testFile}`);

      try {
        await this.runPlaywrightTest(testFile, options);
        this.results.passed++;
      } catch (error) {
        console.error(`❌ Test failed: ${testFile}`);
        console.error(`   Error: ${error.message}`);
        this.results.failed++;
        this.results.errors.push({
          test: testFile,
          error: error.message,
        });
      }

      this.results.total++;
    }

    this.results.duration = Date.now() - startTime;

    console.log(`\n📊 Test Execution Summary:`);
    console.log(`   Total: ${this.results.total}`);
    console.log(`   Passed: ${this.results.passed} ✅`);
    console.log(`   Failed: ${this.results.failed} ❌`);
    console.log(`   Duration: ${this.formatDuration(this.results.duration)}`);
  }

  /**
   * Run individual Playwright test
   */
  async runPlaywrightTest(testFile, options = {}) {
    return new Promise((resolve, reject) => {
      const args = ['test', testFile, '--reporter=json', '--output=test-results/'];

      if (options.headless) {
        args.push('--headed=false');
      }

      if (options.parallel) {
        args.push('--workers=2');
      }

      const child = spawn('npx', ['playwright', ...args], {
        stdio: 'pipe',
        cwd: process.cwd(),
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Test failed with code ${code}: ${errorOutput}`));
        }
      });
    });
  }

  /**
   * Generate test reports
   */
  async generateReports() {
    console.log('\n📋 Generating test reports...');

    // Generate JSON report
    const report = {
      timestamp: new Date().toISOString(),
      environment: this.environment,
      results: this.results,
      configuration: {
        testSuites: Object.keys(this.testSuites),
        playwrightVersion: await this.getPlaywrightVersion(),
      },
    };

    await fs.writeFile('test-results/workflow-test-report.json', JSON.stringify(report, null, 2));

    // Generate HTML report
    await this.generateHTMLReport(report);

    console.log('✅ Test reports generated:');
    console.log('   📄 test-results/workflow-test-report.json');
    console.log('   🌐 test-results/workflow-test-report.html');
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workflow E2E Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .status-pass { color: #28a745; }
        .status-fail { color: #dc3545; }
        .status-warn { color: #ffc107; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .metric { text-align: center; padding: 10px; background: #f8f9fa; border-radius: 5px; }
        .error { background: #f8d7da; padding: 10px; border-radius: 5px; margin: 5px 0; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Workflow E2E Test Report</h1>
        <p><strong>Generated:</strong> ${report.timestamp}</p>
        <p><strong>Duration:</strong> ${this.formatDuration(report.results.duration)}</p>
    </div>

    <div class="section">
        <h2>📊 Test Results</h2>
        <div class="grid">
            <div class="metric">
                <h3>Total Tests</h3>
                <div style="font-size: 2em;">${report.results.total}</div>
            </div>
            <div class="metric">
                <h3 class="status-pass">Passed</h3>
                <div style="font-size: 2em;">${report.results.passed}</div>
            </div>
            <div class="metric">
                <h3 class="status-fail">Failed</h3>
                <div style="font-size: 2em;">${report.results.failed}</div>
            </div>
            <div class="metric">
                <h3>Success Rate</h3>
                <div style="font-size: 2em;">${((report.results.passed / report.results.total) * 100).toFixed(1)}%</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>🌍 Environment Status</h2>
        <ul>
            <li>Frontend (8080): <span class="${report.environment.frontend ? 'status-pass' : 'status-fail'}">${report.environment.frontend ? '✅ Available' : '❌ Not Available'}</span></li>
            <li>Backend (8000): <span class="${report.environment.backend ? 'status-pass' : 'status-fail'}">${report.environment.backend ? '✅ Available' : '❌ Not Available'}</span></li>
            <li>Ollama (11434): <span class="${report.environment.ollama ? 'status-pass' : 'status-warn'}">${report.environment.ollama ? '✅ Available' : '⚠️ Not Available'}</span></li>
        </ul>
    </div>

    ${
      report.results.errors.length > 0
        ? `
    <div class="section">
        <h2>❌ Test Failures</h2>
        ${report.results.errors
          .map(
            (error) => `
            <div class="error">
                <strong>${error.test}</strong><br>
                ${error.error}
            </div>
        `
          )
          .join('')}
    </div>
    `
        : ''
    }

    <div class="section">
        <h2>🔧 Configuration</h2>
        <pre>${JSON.stringify(report.configuration, null, 2)}</pre>
    </div>
</body>
</html>
    `;

    await fs.writeFile('test-results/workflow-test-report.html', html.trim());
  }

  /**
   * Cleanup
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    // Any necessary cleanup
    console.log('✅ Cleanup completed');
  }

  /**
   * Utility methods
   */
  async ensureDirectory(dir) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  async getPlaywrightVersion() {
    try {
      const packagePath = path.join(process.cwd(), 'node_modules/@playwright/test/package.json');
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      const packageData = JSON.parse(packageContent);
      return packageData.version;
    } catch (error) {
      return 'unknown';
    }
  }
}

/**
 * CLI Interface
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--suite':
        options.suite = args[++i];
        break;
      case '--headed':
        options.headless = false;
        break;
      case '--parallel':
        options.parallel = true;
        break;
      case '--help':
        console.log(`
Usage: node run-e2e-workflow-tests.js [options]

Options:
  --suite <name>    Test suite to run (smoke, standard, comprehensive)
  --headed          Run tests in headed mode (visible browser)
  --parallel        Run tests in parallel
  --help            Show this help message

Examples:
  node run-e2e-workflow-tests.js --suite=smoke
  node run-e2e-workflow-tests.js --suite=comprehensive --headed
  node run-e2e-workflow-tests.js --parallel
        `);
        process.exit(0);
        break;
    }
  }

  const runner = new WorkflowTestRunner();
  runner.run(options);
}

export default WorkflowTestRunner;
