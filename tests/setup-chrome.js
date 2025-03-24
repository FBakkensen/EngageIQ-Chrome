// tests/setup-chrome.js
// Mock Chrome API for testing environment

// In-memory storage for chrome.storage mocks
const storageData = {
  local: {},
  sync: {}
};

// Helper to create storage API mock with specified area
const createStorageMock = (area) => ({
  get: jest.fn((keys, callback) => {
    const result = {};
    if (typeof keys === 'string') {
      if (storageData[area][keys] !== undefined) {
        result[keys] = storageData[area][keys];
      }
    } else if (Array.isArray(keys)) {
      keys.forEach(key => {
        if (storageData[area][key] !== undefined) {
          result[key] = storageData[area][key];
        }
      });
    } else if (typeof keys === 'object' && keys !== null) {
      Object.keys(keys).forEach(key => {
        result[key] = storageData[area][key] !== undefined ? 
          storageData[area][key] : keys[key];
      });
    } else {
      // Get all data
      Object.assign(result, storageData[area]);
    }
    
    if (callback) {
      callback(result);
    }
    return Promise.resolve(result);
  }),
  
  set: jest.fn((items, callback) => {
    Object.assign(storageData[area], items);
    if (callback) {
      callback();
    }
    return Promise.resolve();
  }),
  
  clear: jest.fn((callback) => {
    storageData[area] = {};
    if (callback) {
      callback();
    }
    return Promise.resolve();
  })
});

// Create message handling with proper event listener pattern
const createMessageHandlers = () => {
  const listeners = [];
  
  return {
    addListener: jest.fn((callback) => {
      listeners.push(callback);
    }),
    
    removeListener: jest.fn((callback) => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }),
    
    hasListeners: jest.fn(() => listeners.length > 0),
    
    // Helper for tests to trigger message events
    _triggerMessage: (message, sender, sendResponse) => {
      listeners.forEach(listener => {
        // Chrome runtime returns true if sendResponse will be called asynchronously
        const isAsync = listener(message, sender, sendResponse);
        return isAsync;
      });
    }
  };
};

// Define global chrome object with all needed APIs
global.chrome = {
  storage: {
    local: createStorageMock('local'),
    sync: createStorageMock('sync')
  },
  
  runtime: {
    sendMessage: jest.fn((message, callback) => {
      if (callback) {
        callback({});
      }
      return Promise.resolve({});
    }),
    onMessage: createMessageHandlers(),
    getURL: jest.fn(path => `chrome-extension://mock-extension-id/${path}`)
  },
  
  tabs: {
    query: jest.fn(() => Promise.resolve([])),
    sendMessage: jest.fn((tabId, message, callback) => {
      if (callback) {
        callback({});
      }
      return Promise.resolve({});
    }),
    create: jest.fn(() => Promise.resolve({ id: 'mock-tab-id' })),
    onUpdated: createMessageHandlers()
  }
};

// Helper functions for testing Chrome APIs

// Trigger a runtime message for testing message handlers
global.triggerChromeMessage = (message, sender = { id: 'mock-sender-id' }, sendResponse = jest.fn()) => {
  return chrome.runtime.onMessage._triggerMessage(message, sender, sendResponse);
};

// Simulate a storage change event
global.simulateStorageChange = (changes, areaName) => {
  if (chrome.storage.onChanged && chrome.storage.onChanged._triggerMessage) {
    chrome.storage.onChanged._triggerMessage(changes, areaName);
  }
};

// Helper to reset all mocks and storage data between tests
global.resetChromeMocks = () => {
  // Reset storage data
  storageData.local = {};
  storageData.sync = {};
  
  // Reset all mock functions
  // For storage API
  chrome.storage.local.get.mockClear();
  chrome.storage.local.set.mockClear();
  chrome.storage.local.clear.mockClear();
  
  chrome.storage.sync.get.mockClear();
  chrome.storage.sync.set.mockClear();
  chrome.storage.sync.clear.mockClear();
  
  // For runtime API
  chrome.runtime.sendMessage.mockClear();
  chrome.runtime.getURL.mockClear();
  chrome.runtime.onMessage.addListener.mockClear();
  chrome.runtime.onMessage.removeListener.mockClear();
  chrome.runtime.onMessage.hasListeners.mockClear();
  
  // For tabs API
  chrome.tabs.query.mockClear();
  chrome.tabs.sendMessage.mockClear();
  chrome.tabs.create.mockClear();
  chrome.tabs.onUpdated.addListener.mockClear();
  chrome.tabs.onUpdated.removeListener.mockClear();
};

// Reset mocks before each test
beforeEach(() => {
  resetChromeMocks();
}); 