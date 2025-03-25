// tests/types/globals.d.ts

/**
 * Global TypeScript declarations for testing
 */

// Declare global Chrome API type
declare global {
  // Chrome namespace
  var chrome: {
    storage: {
      local: {
        get: jest.Mock;
        set: jest.Mock;
        clear: jest.Mock;
      };
      sync: {
        get: jest.Mock;
        set: jest.Mock;
        clear: jest.Mock;
      };
    };
    runtime: {
      sendMessage: jest.Mock;
      onMessage: {
        addListener: jest.Mock;
        removeListener: jest.Mock;
      };
      lastError: any;
    };
    tabs: {
      query: jest.Mock;
      sendMessage: jest.Mock;
    };
  };

  // Reset Chrome mocks function
  var resetChromeMocks: () => void;
}

// Export as module to make TypeScript happy
export {};

// Global type definitions for test environment

// Global fetch mock
declare var fetch: jest.Mock;

// Global helper to reset Chrome mocks
declare function resetChromeMocks(): void;

// LinkedIn DOM mocks for tests
interface LinkedInMocks {
  createPostElement(): HTMLElement;
  createCommentField(): HTMLElement;
}

// Gemini API mocks for tests
interface GeminiMocks {
  commentResponse: {
    candidates: Array<{
      content: {
        parts: Array<{
          text: string;
        }>;
      };
    }>;
  };
  mockSuccessResponse(responseData: any): void;
  mockErrorResponse(status?: number, statusText?: string): void;
}

declare var linkedInMocks: LinkedInMocks;
declare var geminiMocks: GeminiMocks; 