// Chrome API mock implementation

// Storage implementation using in-memory maps
const localStorageMap = new Map();
const syncStorageMap = new Map();

// Mock Chrome API
const chrome = {
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        const result = {};
        if (Array.isArray(keys)) {
          keys.forEach(key => {
            if (localStorageMap.has(key)) {
              result[key] = localStorageMap.get(key);
            }
          });
        } else if (typeof keys === 'string') {
          if (localStorageMap.has(keys)) {
            result[keys] = localStorageMap.get(keys);
          }
        } else if (typeof keys === 'object') {
          Object.keys(keys).forEach(key => {
            result[key] = localStorageMap.has(key) ? localStorageMap.get(key) : keys[key];
          });
        } else {
          localStorageMap.forEach((value, key) => {
            result[key] = value;
          });
        }
        if (callback) callback(result);
        return Promise.resolve(result);
      }),
      set: jest.fn((items, callback) => {
        Object.entries(items).forEach(([key, value]) => {
          localStorageMap.set(key, value);
        });
        if (callback) callback();
        return Promise.resolve();
      }),
      clear: jest.fn(callback => {
        localStorageMap.clear();
        if (callback) callback();
        return Promise.resolve();
      }),
    },
    sync: {
      get: jest.fn((keys, callback) => {
        const result = {};
        if (Array.isArray(keys)) {
          keys.forEach(key => {
            if (syncStorageMap.has(key)) {
              result[key] = syncStorageMap.get(key);
            }
          });
        } else if (typeof keys === 'string') {
          if (syncStorageMap.has(keys)) {
            result[keys] = syncStorageMap.get(keys);
          }
        } else if (typeof keys === 'object') {
          Object.keys(keys).forEach(key => {
            result[key] = syncStorageMap.has(key) ? syncStorageMap.get(key) : keys[key];
          });
        } else {
          syncStorageMap.forEach((value, key) => {
            result[key] = value;
          });
        }
        if (callback) callback(result);
        return Promise.resolve(result);
      }),
      set: jest.fn((items, callback) => {
        Object.entries(items).forEach(([key, value]) => {
          syncStorageMap.set(key, value);
        });
        if (callback) callback();
        return Promise.resolve();
      }),
      clear: jest.fn(callback => {
        syncStorageMap.clear();
        if (callback) callback();
        return Promise.resolve();
      }),
    },
  },
  runtime: {
    sendMessage: jest.fn((message, callback) => {
      if (callback) callback();
      return Promise.resolve();
    }),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    lastError: null,
  },
  tabs: {
    query: jest.fn(() => Promise.resolve([])),
    sendMessage: jest.fn((tabId, message, callback) => {
      if (callback) callback();
      return Promise.resolve();
    }),
  },
};

// Export the mock for use in tests
global.chrome = chrome;

// Function to reset all mocks
global.resetChromeMocks = () => {
  localStorageMap.clear();
  syncStorageMap.clear();
  
  Object.values(chrome).forEach(namespace => {
    Object.values(namespace).forEach(method => {
      if (typeof method === 'object' && method !== null) {
        Object.values(method).forEach(subMethod => {
          if (typeof subMethod === 'function' && subMethod.mockClear) {
            subMethod.mockClear();
          }
        });
      } else if (typeof method === 'function' && method.mockClear) {
        method.mockClear();
      }
    });
  });
};

module.exports = chrome; 