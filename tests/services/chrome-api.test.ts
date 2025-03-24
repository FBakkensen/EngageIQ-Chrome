// tests/chrome-api.test.ts
// Tests to verify Chrome API mocks are working correctly

// Import helpers directly from setup file
// Note: These are globally available due to the setup-chrome.js file

describe('Chrome API Mocks', () => {
  // Reset mocks between each test
  beforeEach(() => {
    // Use the global resetChromeMocks function
    if (typeof resetChromeMocks === 'function') {
      resetChromeMocks();
    }
  });

  describe('Storage API', () => {
    it('should store and retrieve data with chrome.storage.local', async () => {
      // Set data
      await chrome.storage.local.set({ testKey: 'test value' });
      
      // Get data
      const result = await chrome.storage.local.get('testKey');
      
      // Verify
      expect(result).toEqual({ testKey: 'test value' });
      expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
      expect(chrome.storage.local.get).toHaveBeenCalledTimes(1);
    });

    it('should store and retrieve data with chrome.storage.sync', async () => {
      // Set data
      await chrome.storage.sync.set({ apiKey: 'mock-api-key' });
      
      // Get data
      const result = await chrome.storage.sync.get('apiKey');
      
      // Verify
      expect(result).toEqual({ apiKey: 'mock-api-key' });
      expect(chrome.storage.sync.set).toHaveBeenCalledTimes(1);
      expect(chrome.storage.sync.get).toHaveBeenCalledTimes(1);
    });

    it('should clear storage data', async () => {
      // Set data
      await chrome.storage.local.set({ testKey: 'test value' });
      
      // Clear data
      await chrome.storage.local.clear();
      
      // Get data (should be empty)
      const result = await chrome.storage.local.get('testKey');
      
      // Verify
      expect(result).toEqual({});
      expect(chrome.storage.local.clear).toHaveBeenCalledTimes(1);
    });

    it('should provide default values for missing keys', async () => {
      // Get data with default
      const result = await chrome.storage.local.get({ testKey: 'default value' });
      
      // Verify
      expect(result).toEqual({ testKey: 'default value' });
    });
  });

  describe('Runtime API', () => {
    it('should send messages with chrome.runtime.sendMessage', async () => {
      // Send message
      const message = { type: 'TEST_MESSAGE', payload: { test: true } };
      await chrome.runtime.sendMessage(message);
      
      // Verify
      expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
      // Only check that it was called with the message object, ignore any additional parameters
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(message);
    });

    it('should register and trigger message listeners', () => {
      // Create mock listener
      const listener = jest.fn();
      
      // Register listener
      chrome.runtime.onMessage.addListener(listener);
      
      // Trigger message using the global helper function
      const message = { type: 'TEST_MESSAGE', payload: { test: true } };
      const sender = { id: 'mock-sender' };
      const sendResponse = jest.fn();
      
      // @ts-ignore - global function defined in setup-chrome.js
      triggerChromeMessage(message, sender, sendResponse);
      
      // Verify
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(message, sender, sendResponse);
    });

    it('should remove message listeners', () => {
      // Create mock listener
      const listener = jest.fn();
      
      // Register listener
      chrome.runtime.onMessage.addListener(listener);
      
      // Remove listener
      chrome.runtime.onMessage.removeListener(listener);
      
      // Trigger message
      // @ts-ignore - global function defined in setup-chrome.js
      triggerChromeMessage({ type: 'TEST_MESSAGE' });
      
      // Verify listener was not called
      expect(listener).not.toHaveBeenCalled();
    });

    it('should generate extension URLs', () => {
      // Get URL
      const url = chrome.runtime.getURL('test.html');
      
      // Verify
      expect(url).toBe('chrome-extension://mock-extension-id/test.html');
      expect(chrome.runtime.getURL).toHaveBeenCalledTimes(1);
    });
  });

  describe('Tabs API', () => {
    it('should query tabs', async () => {
      // Mock implementation for this test
      // @ts-ignore - Jest mock functions are properly set up in setup-chrome.js
      chrome.tabs.query.mockImplementationOnce(() => 
        Promise.resolve([{ id: 1, url: 'https://www.linkedin.com' }])
      );
      
      // Query tabs
      const tabs = await chrome.tabs.query({ active: true });
      
      // Verify
      expect(tabs).toEqual([{ id: 1, url: 'https://www.linkedin.com' }]);
      expect(chrome.tabs.query).toHaveBeenCalledTimes(1);
      expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true });
    });

    it('should send messages to tabs', async () => {
      // Send message to tab
      const tabId = 1;
      const message = { type: 'TEST_TAB_MESSAGE' };
      await chrome.tabs.sendMessage(tabId, message);
      
      // Verify
      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(1);
      // Only check that it was called with the tabId and message, ignore any additional parameters
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(tabId, message);
    });

    it('should create new tabs', async () => {
      // Create tab
      const tab = await chrome.tabs.create({ url: 'https://www.linkedin.com' });
      
      // Verify
      expect(tab).toEqual({ id: 'mock-tab-id' });
      expect(chrome.tabs.create).toHaveBeenCalledTimes(1);
      expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'https://www.linkedin.com' });
    });
  });
}); 