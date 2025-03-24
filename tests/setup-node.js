// tests/setup-node.js
// Setup for Node testing environment (services and background scripts)

// Import Chrome API mocks
require('./setup-chrome');

// Mock fetch API for Gemini API calls
global.fetch = jest.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
    status: 200,
    statusText: 'OK',
  })
);

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

// Reset mocks after each test
afterEach(() => {
  if (global.resetChromeMocks) {
    global.resetChromeMocks();
  }
  global.fetch.mockClear();
}); 