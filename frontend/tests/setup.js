/**
 * Test setup file for Vitest
 * Sets up global mocks and utilities
 */

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem(key) {
    return this.store[key] || null;
  },
  setItem(key, value) {
    this.store[key] = value.toString();
  },
  removeItem(key) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  }
};

global.localStorage = localStorageMock;

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock Bootstrap components
global.bootstrap = {
  Tooltip: class {
    constructor(element) {
      this.element = element;
    }
    show() {}
    hide() {}
    dispose() {}
  },
  Collapse: class {
    constructor(element) {
      this.element = element;
    }
    show() {}
    hide() {}
    toggle() {}
  }
};

// Mock Prism
global.Prism = {
  highlightAllUnder: vi.fn(),
  highlightElement: vi.fn()
};

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  document.body.innerHTML = '';
});

// Helper to load HTML fixtures
global.loadHTMLFixture = (html) => {
  document.body.innerHTML = html;
};

// Helper to trigger events
global.triggerEvent = (element, eventType, eventData = {}) => {
  const event = new Event(eventType, { bubbles: true, ...eventData });
  Object.assign(event, eventData);
  element.dispatchEvent(event);
};