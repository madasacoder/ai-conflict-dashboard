# 🧪 **Frontend Testing Guide - AI Conflict Dashboard**

This guide covers our comprehensive frontend testing strategy using modern tools that exceed industry standards.

---

## 📊 **Testing Stack Overview**

| **Layer** | **Tool** | **Purpose** | **Status** |
|-----------|----------|-------------|------------|
| **Unit Testing** | Vitest | Component & utility testing | ✅ **Implemented** |
| **Integration** | React Testing Library + MSW | API integration testing | ✅ **Implemented** |
| **E2E Testing** | Playwright | Full user journey testing | ✅ **Implemented** |
| **Coverage** | Vitest Coverage V8 | Code coverage reporting | ✅ **Implemented** |
| **DOM Environment** | happy-dom | Fast DOM simulation | ✅ **Implemented** |

---

## 🚀 **Quick Start**

### **Install Dependencies**
```bash
cd frontend
npm install
```

### **Run Tests**
```bash
# Unit tests
npm test

# Unit tests with UI
npm run test:ui

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
```

---

## 🏗️ **Project Structure**

```
frontend/
├── tests/
│   ├── setup.ts                    # Global test setup
│   ├── components/                 # Component tests
│   │   └── WorkflowBuilder.test.js
│   ├── utils/                      # Utility tests
│   │   └── logger.test.js
│   ├── global-setup.js             # Playwright global setup
│   └── global-teardown.js          # Playwright global teardown
├── e2e/
│   ├── workflow-builder-comprehensive.spec.js
│   ├── api-integration.spec.js
│   └── basic-flow.spec.js
├── vitest.config.ts                # Vitest configuration
├── playwright.config.js            # Playwright configuration
└── package.json                    # Dependencies & scripts
```

---

## 🔧 **Configuration Details**

### **Vitest Configuration**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'happy-dom',        // Faster than jsdom
    globals: true,                   // Global test functions
    setupFiles: ['./tests/setup.ts'], // Test setup
    coverage: {
      provider: 'v8',                // Modern coverage
      thresholds: {
        global: {
          branches: 85,              // Per CLAUDE.md requirements
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    }
  }
});
```

### **Playwright Configuration**
```javascript
// playwright.config.js
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  projects: [
    { name: 'chromium' },           // Desktop Chrome
    { name: 'firefox' },            // Desktop Firefox  
    { name: 'webkit' },             // Desktop Safari
    { name: 'Mobile Chrome' },      // Mobile testing
    { name: 'Mobile Safari' }       // iOS testing
  ],
  webServer: [
    { command: 'python3 -m http.server 8080', port: 8080 },
    { command: 'uvicorn main:app --port 8000', port: 8000 }
  ]
});
```

---

## ✅ **Writing Tests Following Standards**

### **Component Test Example**
```javascript
// tests/components/WorkflowBuilder.test.js
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

describe('WorkflowBuilder', () => {
  beforeEach(() => {
    // ✅ Setup DOM structure
    document.body.innerHTML = `<div id="drawflow"></div>`;
    
    // ✅ Reset mocks
    vi.clearAllMocks();
    global.logger.info.mockClear();
  });
  
  test('should initialize with structured logging', async () => {
    const { WorkflowBuilder } = await import('../../js/workflow-builder.js');
    new WorkflowBuilder();
    
    // ✅ Verify structured logging (NO console.log)
    expect(global.logger.info).toHaveBeenCalledWith('workflow_builder_init_start', {
      component: 'WorkflowBuilder'
    });
  });
  
  test('should sanitize HTML with DOMPurify', async () => {
    const { WorkflowBuilder } = await import('../../js/workflow-builder.js');
    const builder = new WorkflowBuilder();
    
    builder.addNode('input', 100, 100);
    
    // ✅ Verify XSS protection
    expect(global.DOMPurify.sanitize).toHaveBeenCalled();
  });
});
```

### **E2E Test Example**
```javascript
// e2e/workflow-builder-comprehensive.spec.js
import { test, expect } from '@playwright/test';

test.describe('Workflow Builder E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workflow-builder.html');
    await page.waitForSelector('#drawflow', { state: 'visible' });
  });
  
  test('should create workflow via drag and drop', async ({ page }) => {
    const inputNode = page.locator('[data-node-type="input"]');
    const canvas = page.locator('#drawflow');
    
    await inputNode.dragTo(canvas, {
      targetPosition: { x: 200, y: 100 }
    });
    
    await expect(page.locator('.drawflow-node')).toBeVisible();
  });
  
  test('should prevent XSS attacks', async ({ page }) => {
    await page.locator('[data-node-type="llm"]').click();
    await page.locator('.drawflow-node').first().click();
    
    const maliciousScript = '<script>window.xssExecuted = true;</script>';
    await page.locator('textarea').fill(maliciousScript);
    
    const xssExecuted = await page.evaluate(() => window.xssExecuted);
    expect(xssExecuted).toBeFalsy(); // XSS should be prevented
  });
});
```

---

## 🎯 **Testing Best Practices**

### **1. Follow JAVASCRIPT-STANDARDS.md**
- ✅ **NO console.log** - Use structured logging only
- ✅ **Sanitize with DOMPurify** - Prevent XSS
- ✅ **Memory cleanup** - Remove event listeners
- ✅ **Error handling** - Test error scenarios

### **2. Test Structure Standards**
```javascript
// ✅ REQUIRED naming pattern
test('should [action] [expected result] [condition]');

// Examples:
test('should sanitize user input before rendering');
test('should log API errors with correlation ID');
test('should cleanup event listeners on component unmount');
```

### **3. Mock Strategy**
```javascript
// ✅ Mock structured logger
global.logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  workflow: vi.fn(),
  userAction: vi.fn()
};

// ✅ Mock DOMPurify
global.DOMPurify = {
  sanitize: vi.fn((input: string) => input)
};

// ✅ Mock external libraries
global.Drawflow = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  addNode: vi.fn()
}));
```

### **4. Coverage Requirements**
- **Minimum**: 85% across all metrics
- **Branches**: 85%
- **Functions**: 85% 
- **Lines**: 85%
- **Statements**: 85%

---

## 🚦 **Test Categories**

### **Unit Tests** (`tests/`)
- ✅ **Utility functions** (logger, validation, etc.)
- ✅ **Component logic** (node creation, configuration)
- ✅ **Error handling** (network failures, validation)
- ✅ **Security** (XSS prevention, input sanitization)

### **Integration Tests** (MSW + Vitest)
- ✅ **API integration** (workflow execution, model calls)
- ✅ **Data flow** (user input → processing → output)
- ✅ **State management** (localStorage, workflow persistence)

### **E2E Tests** (`e2e/`)
- ✅ **User workflows** (create, configure, run workflow)
- ✅ **Cross-browser** (Chrome, Firefox, Safari)
- ✅ **Mobile responsive** (Pixel 5, iPhone 12)
- ✅ **Accessibility** (keyboard navigation, ARIA)

---

## 📈 **Running & Monitoring Tests**

### **Local Development**
```bash
# Watch mode for unit tests
npm test -- --watch

# Interactive UI
npm run test:ui

# Coverage with threshold enforcement
npm run test:coverage

# E2E with debugging
npm run test:e2e -- --debug
```

### **CI/CD Pipeline**
```bash
# Complete test suite
npm run test:coverage && npm run test:e2e

# Generate reports
npm run test:coverage -- --reporter=json --outputFile=coverage.json
npm run test:e2e -- --reporter=junit --outputFile=results.xml
```

### **Coverage Reports**
- **HTML Report**: `coverage/index.html`
- **Console**: Real-time feedback
- **CI Integration**: JSON/LCOV formats

---

## 🔍 **Debugging Tests**

### **Unit Test Debugging**
```bash
# Debug specific test
npm test -- --reporter=verbose WorkflowBuilder

# Debug with breakpoints
npm test -- --inspect-brk
```

### **E2E Test Debugging**
```bash
# Run in headed mode
npm run test:e2e -- --headed

# Debug mode with browser dev tools
npm run test:e2e -- --debug

# Generate trace for failed tests
npm run test:e2e -- --trace=on
```

### **Common Issues & Solutions**

| **Issue** | **Solution** |
|-----------|--------------|
| **Tests timeout** | Increase `timeout` in config |
| **DOM not found** | Add `waitForSelector` in E2E |
| **Mock not working** | Verify `vi.clearAllMocks()` in beforeEach |
| **Coverage too low** | Add tests for untested branches |
| **XSS test failing** | Verify DOMPurify.sanitize calls |

---

## 🎨 **Visual Testing (Future)**

### **Screenshot Testing** (Optional Enhancement)
```javascript
// Potential addition for visual regression
test('should maintain visual consistency', async ({ page }) => {
  await page.goto('/workflow-builder.html');
  await expect(page).toHaveScreenshot('workflow-builder.png');
});
```

---

## 🏆 **Quality Gates**

### **Required for PR Approval**
- ✅ **85%+ coverage** on all metrics
- ✅ **All tests passing** (unit + E2E)
- ✅ **No console.log violations** 
- ✅ **XSS protection verified**
- ✅ **Memory leaks prevented**

### **Performance Benchmarks**
- **Unit tests**: < 10 seconds
- **E2E tests**: < 5 minutes
- **Coverage generation**: < 30 seconds

---

## 📚 **Resources & References**

### **Documentation**
- [Vitest Guide](https://vitest.dev/guide/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/docs/)

### **Project Standards**
- [JAVASCRIPT-STANDARDS.md](../JAVASCRIPT-STANDARDS.md)
- [CLAUDE.md](../CLAUDE.md)
- [Testing Examples](../frontend/tests/)

---

**Last Updated**: 2025-08-03  
**Status**: Production Ready  
**Coverage Target**: 85%+ (Per CLAUDE.md)  
**Maintainer**: AI Conflict Dashboard Team