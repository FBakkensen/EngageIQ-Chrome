// tests/types/chrome.d.ts

// Type definitions to extend Chrome namespace for tests
import '@types/chrome';

// Extend the Chrome namespace to include Jest Mock functionality
declare global {
  namespace chrome {
    namespace storage {
      // Override the SyncStorageArea interface to add Jest Mock methods
      interface SyncStorageArea {
        get: jest.Mock;
        set: jest.Mock;
        clear: jest.Mock;
      }
      
      // Override the LocalStorageArea interface to add Jest Mock methods
      interface LocalStorageArea {
        get: jest.Mock;
        set: jest.Mock;
        clear: jest.Mock;
      }
    }
    
    namespace runtime {
      // Extend the runtime namespace
      var sendMessage: jest.Mock;
      
      interface MessageEvent {
        addListener: jest.Mock;
        removeListener: jest.Mock;
      }
    }
    
    namespace tabs {
      // Extend the tabs namespace
      var query: jest.Mock;
      var sendMessage: jest.Mock;
    }
  }
} 