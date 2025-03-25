/**
 * Chrome Storage API Mock
 * 
 * Provides an in-memory implementation of Chrome's storage API
 */

export interface StorageArea {
  get: jest.Mock;
  set: jest.Mock;
  remove: jest.Mock;
  clear: jest.Mock;
  reset: () => void;
}

/**
 * Mock implementation of Chrome's storage API
 * Uses in-memory storage for testing
 */
export class ChromeStorageMock implements StorageArea {
  private storage: Record<string, any> = {};

  /**
   * Mock implementation of storage.get
   */
  get = jest.fn().mockImplementation((keys, callback) => {
    const result: Record<string, any> = {};
    
    if (typeof keys === 'string') {
      result[keys] = this.storage[keys];
    } else if (Array.isArray(keys)) {
      keys.forEach(key => {
        result[key] = this.storage[key];
      });
    } else if (typeof keys === 'object') {
      Object.keys(keys).forEach(key => {
        result[key] = this.storage[key] !== undefined 
          ? this.storage[key] 
          : keys[key as keyof typeof keys];
      });
    }
    
    if (callback) {
      callback(result);
    }
    
    return Promise.resolve(result);
  });

  /**
   * Mock implementation of storage.set
   */
  set = jest.fn().mockImplementation((items, callback) => {
    Object.assign(this.storage, items);
    
    if (callback) {
      callback();
    }
    
    return Promise.resolve();
  });

  /**
   * Mock implementation of storage.remove
   */
  remove = jest.fn().mockImplementation((keys, callback) => {
    if (typeof keys === 'string') {
      delete this.storage[keys];
    } else if (Array.isArray(keys)) {
      keys.forEach(key => delete this.storage[key]);
    }
    
    if (callback) {
      callback();
    }
    
    return Promise.resolve();
  });

  /**
   * Mock implementation of storage.clear
   */
  clear = jest.fn().mockImplementation(callback => {
    this.storage = {};
    
    if (callback) {
      callback();
    }
    
    return Promise.resolve();
  });

  /**
   * Reset the mock state and storage
   */
  reset(): void {
    this.storage = {};
    this.get.mockClear();
    this.set.mockClear();
    this.remove.mockClear();
    this.clear.mockClear();
  }
}

/**
 * Create storage mock instances
 */
export const createChromeStorageMocks = () => {
  return {
    local: new ChromeStorageMock(),
    sync: new ChromeStorageMock(),
    // Add session if needed
  };
}; 