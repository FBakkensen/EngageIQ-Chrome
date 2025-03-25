/**
 * Basic test to verify the test environment is working properly
 */

describe('Test Environment Setup', () => {
  it('should be able to run tests', () => {
    expect(true).toBe(true);
  });

  it('should have access to jest globals', () => {
    expect(jest).toBeDefined();
    expect(typeof describe).toBe('function');
    expect(typeof it).toBe('function');
    expect(typeof expect).toBe('function');
  });

  it('should have Chrome API mocked', () => {
    expect(global.chrome).toBeDefined();
    expect(global.chrome.storage).toBeDefined();
    expect(global.chrome.runtime).toBeDefined();
    expect(typeof global.chrome.storage.local.get).toBe('function');
  });
}); 