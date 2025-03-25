// tests/setup-node.js
// Setup for Node testing environment (services and background scripts)

// Import Chrome API mocks
require('./setup-chrome');

// Mock Chrome API in Node environment
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

// Mock fetch API for service tests
global.fetch = jest.fn();

// Mock Gemini API responses
global.geminiMocks = {
  // Sample response mock for comment generation
  commentResponse: {
    candidates: [{
      content: {
        parts: [{
          text: "This is a mocked Gemini API response for testing purposes. It simulates a generated comment."
        }]
      }
    }]
  },
  // Helper to set up a successful response
  mockSuccessResponse: (responseData) => {
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        json: () => Promise.resolve(responseData),
        ok: true,
        status: 200,
        statusText: 'OK',
      })
    );
  },
  // Helper to set up an error response
  mockErrorResponse: (status = 400, statusText = 'Bad Request') => {
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        json: () => Promise.reject(new Error(statusText)),
        ok: false,
        status,
        statusText,
      })
    );
  }
};

// Reset all mocks after each test
afterEach(() => {
  if (global.resetChromeMocks) {
    global.resetChromeMocks();
  }
  global.fetch.mockClear();
  jest.clearAllMocks();
});

console.log('Node environment setup complete'); 