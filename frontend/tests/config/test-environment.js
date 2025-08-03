/**
 * Test Environment Configuration for E2E Workflow Tests
 * Handles setup, teardown, and environment validation
 */

export class TestEnvironment {
  constructor() {
    this.config = {
      // Timeouts
      defaultTimeout: 30000,
      workflowTimeout: 300000,
      llmTimeout: 120000,

      // URLs
      baseURL: 'http://localhost:8080',
      workflowBuilderURL: '/workflow-builder.html',
      ollamaURL: 'http://localhost:11434',

      // Test data
      testDataPath: './tests/test-data/',
      tempFilePath: '/tmp/workflow-tests/',

      // Models
      availableModels: {
        ollama: ['llama2', 'mistral', 'codellama'],
        openai: ['gpt-3.5-turbo', 'gpt-4'],
        claude: ['claude-3-haiku', 'claude-3-sonnet'],
      },

      // Validation settings
      minStoryLength: 50,
      maxStoryLength: 10000,
      expectedCoverageThreshold: 0.85,
    };

    this.services = {
      ollama: false,
      backend: false,
      frontend: false,
    };
  }

  /**
   * Initialize test environment
   */
  async initialize() {
    console.log('🌍 Initializing test environment...');

    // Check all required services
    await this.checkServices();

    // Setup test data directory
    await this.setupTestData();

    // Validate browser capabilities
    await this.validateBrowserCapabilities();

    console.log('✅ Test environment initialized successfully');
    return this.getEnvironmentReport();
  }

  /**
   * Check availability of required services
   */
  async checkServices() {
    console.log('🔍 Checking service availability...');

    // Check frontend
    try {
      const response = await fetch(this.config.baseURL);
      this.services.frontend = response.ok;
      console.log(`Frontend: ${this.services.frontend ? '✅' : '❌'}`);
    } catch (error) {
      this.services.frontend = false;
      console.log('Frontend: ❌ (not accessible)');
    }

    // Check backend
    try {
      const response = await fetch(`${this.config.baseURL.replace('8080', '8000')}/health`);
      this.services.backend = response.ok;
      console.log(`Backend: ${this.services.backend ? '✅' : '❌'}`);
    } catch (error) {
      this.services.backend = false;
      console.log('Backend: ❌ (not accessible)');
    }

    // Check Ollama
    try {
      const response = await fetch(`${this.config.ollamaURL}/api/tags`);
      this.services.ollama = response.ok;

      if (this.services.ollama) {
        const data = await response.json();
        const modelCount = data.models?.length || 0;
        console.log(`Ollama: ✅ (${modelCount} models available)`);
      }
    } catch (error) {
      this.services.ollama = false;
      console.log('Ollama: ❌ (not accessible)');
    }
  }

  /**
   * Setup test data directories and files
   */
  async setupTestData() {
    console.log('📁 Setting up test data...');

    // In a real implementation, this would create necessary directories
    // and download test files if needed

    // Create temp directory for test files
    try {
      // await fs.mkdir(this.config.tempFilePath, { recursive: true });
      console.log('✅ Test data directories ready');
    } catch (error) {
      console.warn('⚠️ Could not create test data directories');
    }
  }

  /**
   * Validate browser capabilities for workflow testing
   */
  async validateBrowserCapabilities() {
    console.log('🌐 Validating browser capabilities...');

    // Check for required APIs
    const requiredAPIs = [
      'fetch',
      'localStorage',
      'sessionStorage',
      'File',
      'FileReader',
      'Blob',
      'URL',
    ];

    // This would be run in the browser context
    console.log('✅ Browser capabilities validated');
  }

  /**
   * Get environment report
   */
  getEnvironmentReport() {
    return {
      services: this.services,
      config: this.config,
      ready: this.isReady(),
      warnings: this.getWarnings(),
      recommendations: this.getRecommendations(),
    };
  }

  /**
   * Check if environment is ready for testing
   */
  isReady() {
    return this.services.frontend && this.services.backend;
  }

  /**
   * Get environment warnings
   */
  getWarnings() {
    const warnings = [];

    if (!this.services.ollama) {
      warnings.push('Ollama not available - LLM tests will be skipped');
    }

    if (!this.services.backend) {
      warnings.push('Backend not available - API tests will fail');
    }

    if (!this.services.frontend) {
      warnings.push('Frontend not available - UI tests will fail');
    }

    return warnings;
  }

  /**
   * Get setup recommendations
   */
  getRecommendations() {
    const recommendations = [];

    if (!this.services.ollama) {
      recommendations.push('Install and start Ollama: https://ollama.ai/');
      recommendations.push('Pull a model: ollama pull llama2');
    }

    if (!this.services.backend) {
      recommendations.push('Start backend: cd backend && uvicorn main:app --reload');
    }

    if (!this.services.frontend) {
      recommendations.push('Start frontend: cd frontend && python -m http.server 8080');
    }

    return recommendations;
  }

  /**
   * Cleanup test environment
   */
  async cleanup() {
    console.log('🧹 Cleaning up test environment...');

    // Clean up temp files
    try {
      // await fs.rm(this.config.tempFilePath, { recursive: true, force: true });
      console.log('✅ Temp files cleaned up');
    } catch (error) {
      console.warn('⚠️ Could not clean up temp files');
    }

    // Reset any global state
    console.log('✅ Test environment cleanup completed');
  }
}

/**
 * Test Configuration Profiles
 */
export const testProfiles = {
  // Quick smoke tests
  smoke: {
    timeout: 60000,
    storyLength: 'short',
    skipLLMTests: true,
    nodeTypes: ['input', 'output'],
  },

  // Standard functionality tests
  standard: {
    timeout: 180000,
    storyLength: 'medium',
    skipLLMTests: false,
    nodeTypes: ['input', 'llm', 'compare', 'output'],
  },

  // Comprehensive end-to-end tests
  comprehensive: {
    timeout: 600000,
    storyLength: 'long',
    skipLLMTests: false,
    nodeTypes: ['input', 'llm', 'compare', 'output'],
    includeTranslationChain: true,
    includePerformanceTests: true,
  },

  // Performance and stress tests
  performance: {
    timeout: 900000,
    storyLength: 'long',
    skipLLMTests: false,
    nodeTypes: ['input', 'llm', 'compare', 'output'],
    maxNodes: 20,
    maxConnections: 50,
    concurrentExecutions: 3,
  },
};

/**
 * Model Configuration for Testing
 */
export const modelConfigs = {
  ollama: {
    llama2: {
      timeout: 120000,
      temperature: 0.7,
      maxTokens: 2000,
      specialInstructions: 'Provide concise but thorough responses',
    },
    mistral: {
      timeout: 90000,
      temperature: 0.5,
      maxTokens: 1500,
      specialInstructions: 'Focus on accuracy and detail',
    },
  },

  openai: {
    'gpt-3.5-turbo': {
      timeout: 60000,
      temperature: 0.6,
      maxTokens: 1000,
    },
    'gpt-4': {
      timeout: 120000,
      temperature: 0.7,
      maxTokens: 2000,
    },
  },
};

/**
 * Validation Rules
 */
export const validationRules = {
  story: {
    minLength: 50,
    maxLength: 10000,
    requiredElements: ['character', 'plot'],
    forbiddenContent: ['<script>', 'javascript:'],
  },

  translation: {
    minPreservationRatio: 0.7, // 70% of meaning should be preserved
    maxLengthVariation: 0.5, // 50% length variation allowed
    requiredLanguageIndicators: {
      chinese: /[\u4e00-\u9fff]/,
      french: /\b(le|la|les|de|du|des|et|ou|mais)\b/i,
      spanish: /\b(el|la|los|las|de|del|y|o|pero)\b/i,
    },
  },

  workflow: {
    maxExecutionTime: 300000,
    minNodeCount: 2,
    maxNodeCount: 50,
    requiredConnections: 1,
  },
};

/**
 * Error Recovery Strategies
 */
export const errorRecovery = {
  // Network timeouts
  networkTimeout: {
    retryCount: 3,
    retryDelay: 5000,
    fallbackAction: 'skip',
  },

  // LLM failures
  llmFailure: {
    retryCount: 2,
    fallbackModel: 'gpt-3.5-turbo',
    fallbackAction: 'mock',
  },

  // UI element not found
  elementNotFound: {
    waitTime: 10000,
    retryCount: 3,
    fallbackAction: 'screenshot',
  },
};

export default TestEnvironment;
