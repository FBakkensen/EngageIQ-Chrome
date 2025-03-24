// tests/setup-chrome.js
// Mock Chrome API for testing environment

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

// Helper to reset all mocks between tests
global.resetChromeMocks = () => {
  Object.values(chrome.storage.local).forEach(mock => mock.mockReset());
  Object.values(chrome.storage.sync).forEach(mock => mock.mockReset());
  chrome.runtime.sendMessage.mockReset();
  Object.values(chrome.runtime.onMessage).forEach(mock => mock.mockReset());
  Object.values(chrome.tabs).forEach(mock => mock.mockReset());
}; 