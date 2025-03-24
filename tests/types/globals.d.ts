// tests/types/globals.d.ts

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