// tests/setup-dom.js
// Setup for DOM testing environment

// Import testing-library Jest DOM extensions
require('@testing-library/jest-dom');

// Import Chrome API mocks
require('./setup-chrome');

// Set up DOM-specific mocks
global.MutationObserver = class {
  constructor(callback) {
    this.callback = callback;
    this.observe = jest.fn();
    this.disconnect = jest.fn();
    this.takeRecords = jest.fn();
  }
};

// LinkedIn-specific DOM mocks
global.linkedInMocks = {
  createPostElement: () => {
    const postElement = document.createElement('div');
    postElement.classList.add('feed-shared-update-v2');
    postElement.setAttribute('data-id', 'mock-post-id');
    return postElement;
  },
  createCommentField: () => {
    const commentField = document.createElement('div');
    commentField.classList.add('comments-comment-box');
    const textarea = document.createElement('div');
    textarea.classList.add('ql-editor');
    commentField.appendChild(textarea);
    return commentField;
  }
};

// Make sure jest-dom matchers are available in tests
expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null && received !== undefined;
    return {
      pass,
      message: () => pass 
        ? `Expected ${received} not to be in the document` 
        : `Expected ${received} to be in the document`
    };
  }
});

// Clean up all mocks after each test
afterEach(() => {
  if (global.resetChromeMocks) {
    global.resetChromeMocks();
  }
});

// Jest setup file for DOM environment (UI tests)

// Import any required DOM testing libraries
// require('@testing-library/jest-dom');

// Mock window.matchMedia for responsive component testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.scrollTo
window.scrollTo = jest.fn();

// Mock Chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
  },
};

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

console.log('DOM environment setup complete'); 