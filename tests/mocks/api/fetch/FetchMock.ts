/**
 * Fetch API Mock
 * 
 * Provides a configurable mock for the global fetch API
 */

/**
 * Response configuration for mock fetch
 */
export interface MockFetchResponse {
  status: number;
  statusText: string;
  headers?: Record<string, string>;
  body?: any;
}

/**
 * Request matcher for conditional responses
 */
export interface RequestMatcher {
  url: string | RegExp;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

/**
 * Mock configuration for a specific request
 */
export interface MockFetchConfig {
  matcher: RequestMatcher;
  response: MockFetchResponse;
  delay?: number;
}

/**
 * Fetch API Mock
 */
export class FetchMock {
  private static originalFetch = global.fetch;
  private static mocks: MockFetchConfig[] = [];
  private static defaultDelay = 100;
  
  /**
   * Enable fetch mocking
   */
  static enable(): void {
    global.fetch = FetchMock.mockFetch;
  }
  
  /**
   * Disable fetch mocking and restore original fetch
   */
  static disable(): void {
    global.fetch = FetchMock.originalFetch;
  }
  
  /**
   * Reset all mocks
   */
  static reset(): void {
    FetchMock.mocks = [];
  }
  
  /**
   * Add a mock response for a specific request
   */
  static mock(config: MockFetchConfig): void {
    FetchMock.mocks.push(config);
  }
  
  /**
   * Set default delay for all responses
   */
  static setDefaultDelay(delay: number): void {
    FetchMock.defaultDelay = delay;
  }
  
  /**
   * Helper to mock GET requests
   */
  static mockGet(url: string | RegExp, response: MockFetchResponse, delay?: number): void {
    FetchMock.mock({
      matcher: { url, method: 'GET' },
      response,
      delay
    });
  }
  
  /**
   * Helper to mock POST requests
   */
  static mockPost(url: string | RegExp, response: MockFetchResponse, body?: any, delay?: number): void {
    FetchMock.mock({
      matcher: { url, method: 'POST', body },
      response,
      delay
    });
  }
  
  /**
   * Mock implementation of fetch
   */
  private static mockFetch = jest.fn().mockImplementation(async (url: string, options: RequestInit = {}) => {
    const method = options.method || 'GET';
    const headers = options.headers || {};
    const body = options.body;
    
    // Find matching mock configuration
    const mockConfig = FetchMock.mocks.find(mock => {
      // Match URL
      const urlMatches = typeof mock.matcher.url === 'string' 
        ? mock.matcher.url === url 
        : mock.matcher.url.test(url);
      
      // Match method if specified
      const methodMatches = !mock.matcher.method || mock.matcher.method === method;
      
      // Match headers if specified
      const headersMatch = !mock.matcher.headers || Object.entries(mock.matcher.headers)
        .every(([key, value]) => {
          const headerValue = typeof headers === 'object' ? 
            (headers as Record<string, string>)[key] : 
            '';
          return headerValue === value;
        });
      
      // Match body if specified
      const bodyMatches = !mock.matcher.body || JSON.stringify(mock.matcher.body) === JSON.stringify(body);
      
      return urlMatches && methodMatches && headersMatch && bodyMatches;
    });
    
    // Return mock response or 404
    if (mockConfig) {
      // Wait for specified delay
      const delay = mockConfig.delay ?? FetchMock.defaultDelay;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Create response
      const { status, statusText, headers, body } = mockConfig.response;
      
      return new Response(
        body !== undefined ? JSON.stringify(body) : '', 
        {
          status,
          statusText,
          headers: headers as HeadersInit
        }
      );
    }
    
    // No matching mock found, return 404
    console.warn(`No mock found for fetch request: ${method} ${url}`);
    return new Response(
      JSON.stringify({ error: 'Not Found' }),
      {
        status: 404,
        statusText: 'Not Found'
      }
    );
  });
}

/**
 * Configure common mock responses
 */
export function setupCommonFetchMocks(): void {
  // Example: Mock Gemini API
  FetchMock.mockPost(
    /googleapis\.com\/v1beta\/models\/gemini-pro:generateContent/,
    {
      status: 200,
      statusText: 'OK',
      body: {
        contents: [
          {
            parts: [
              {
                text: "This is a mock Gemini API response."
              }
            ]
          }
        ]
      }
    }
  );
  
  // Add more common mocks as needed
} 