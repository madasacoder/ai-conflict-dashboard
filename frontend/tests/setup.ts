/**
 * Vitest test setup file
 * Configures testing environment according to JAVASCRIPT-STANDARDS.md
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Global test setup following JAVASCRIPT-STANDARDS.md

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock DOMPurify for testing
global.DOMPurify = {
  sanitize: vi.fn((input: string) => input),
  isSupported: true,
  addHook: vi.fn(),
  removeHook: vi.fn(),
  removeAllHooks: vi.fn(),
};

// Mock structured logger following JAVASCRIPT-STANDARDS.md requirements
global.logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  workflow: vi.fn(),
  userAction: vi.fn(),
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage  
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock fetch API for API testing
global.fetch = vi.fn();

// Mock window.alert for tests
global.alert = vi.fn();

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// Mock ResizeObserver for component tests
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Extend expect with custom matchers if needed
expect.extend({
  toBeInTheDocument: expect.any(Function),
  toHaveClass: expect.any(Function),
  toHaveAttribute: expect.any(Function),
});

// Suppress console errors in tests unless explicitly testing them
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

// Global test timeout
vi.setConfig({ testTimeout: 10000 });