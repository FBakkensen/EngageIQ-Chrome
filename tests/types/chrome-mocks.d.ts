// Type definitions for Chrome API mocks in tests

/**
 * Chrome API mock global functions
 */
declare function resetChromeMocks(): void;
declare function triggerChromeMessage(message: any, sender?: any, sendResponse?: jest.Mock): void;
declare function simulateStorageChange(changes: any, areaName: string): void;

/**
 * Chrome API mocks for testing
 */
interface ChromeStorageArea {
  get: jest.Mock;
  set: jest.Mock;
  clear: jest.Mock;
}

interface ChromeStorage {
  local: ChromeStorageArea;
  sync: ChromeStorageArea;
}

interface ChromeRuntimeMessageEvent {
  addListener: jest.Mock;
  removeListener: jest.Mock;
  hasListeners: jest.Mock;
  _triggerMessage: (message: any, sender: any, sendResponse: any) => void;
}

interface ChromeRuntime {
  sendMessage: jest.Mock;
  onMessage: ChromeRuntimeMessageEvent;
  getURL: jest.Mock;
}

interface ChromeTabs {
  query: jest.Mock;
  sendMessage: jest.Mock;
  create: jest.Mock;
  onUpdated: ChromeRuntimeMessageEvent;
}

interface Chrome {
  storage: ChromeStorage;
  runtime: ChromeRuntime;
  tabs: ChromeTabs;
}

// Augment the global object
declare global {
  const chrome: Chrome;
} 