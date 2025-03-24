// tests/services/sample-service.test.ts

// Simple mock service to test
class MockApiService {
  async fetchData(apiKey: string): Promise<any> {
    try {
      const response = await fetch('https://example.com/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ prompt: 'test prompt' })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }
  
  async saveApiKey(apiKey: string): Promise<void> {
    return new Promise<void>((resolve) => {
      chrome.storage.sync.set({ apiKey }, () => {
        resolve();
      });
    });
  }
  
  async getApiKey(): Promise<string> {
    return new Promise<string>((resolve) => {
      chrome.storage.sync.get('apiKey', (result: { apiKey?: string }) => {
        resolve(result.apiKey || '');
      });
    });
  }
}

describe('Node Environment Setup', () => {
  const apiService = new MockApiService();

  it('properly mocks fetch API', async () => {
    // Setup mock response
    geminiMocks.mockSuccessResponse({ result: 'success' });
    
    // Test the service
    const result = await apiService.fetchData('test-api-key');
    
    // Verify
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('https://example.com/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-api-key'
      },
      body: JSON.stringify({ prompt: 'test prompt' })
    });
    expect(result).toEqual({ result: 'success' });
  });
  
  it('properly mocks Chrome storage API', async () => {
    // Mock Chrome storage behavior
    chrome.storage.sync.set.mockImplementation((data, callback) => {
      callback();
    });
    
    chrome.storage.sync.get.mockImplementation((key, callback) => {
      callback({ apiKey: 'stored-api-key' });
    });
    
    // Test storage methods
    await apiService.saveApiKey('test-api-key');
    const storedKey = await apiService.getApiKey();
    
    // Verify
    expect(chrome.storage.sync.set).toHaveBeenCalledWith(
      { apiKey: 'test-api-key' },
      expect.any(Function)
    );
    expect(chrome.storage.sync.get).toHaveBeenCalledWith(
      'apiKey',
      expect.any(Function)
    );
    expect(storedKey).toBe('stored-api-key');
  });
}); 