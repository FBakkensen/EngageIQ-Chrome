# Mock Implementations for Testing

This directory contains mock implementations of various components used in the EngageIQ Chrome Extension. These mocks are designed to simplify testing by providing controllable implementations of services, APIs, and DOM elements.

## Directory Structure

```
mocks/
├── chrome/           # Chrome API mocks
│   ├── storage/      # Storage API mocks
│   ├── runtime/      # Messaging API mocks
│   └── tabs/         # Tab management mocks
├── dom/              # DOM element mocks
│   ├── elements/     # LinkedIn DOM element mocks
│   ├── events/       # DOM event mocks
│   └── selectors/    # LinkedIn selector mocks
├── api/              # External API mocks
│   ├── gemini/       # Gemini API response mocks
│   └── fetch/        # Network request mocks
└── services/         # Service mocks
    ├── background/   # Background service mocks
    ├── content/      # Content service mocks
    ├── ui/           # UI component mocks
    └── utility/      # Utility service mocks
```

## Usage Examples

### Chrome Storage Mock

```typescript
import { ChromeStorageMock } from '@tests/mocks/chrome/storage';

describe('ApiKeyService', () => {
  let storageMock: ChromeStorageMock;
  
  beforeEach(() => {
    // Setup storage mock
    storageMock = new ChromeStorageMock();
    chrome.storage.local.get = storageMock.get;
    chrome.storage.local.set = storageMock.set;
  });
  
  it('should save and retrieve API key', async () => {
    // Test implementation using mock
    await apiKeyService.saveApiKey('test-api-key');
    
    // Verify storage was called with correct data
    expect(storageMock.get).toHaveBeenCalled();
    expect(storageMock.set).toHaveBeenCalledWith(
      { 'gemini-api-key': 'test-api-key' },
      expect.any(Function)
    );
  });
  
  afterEach(() => {
    // Reset mock
    storageMock.reset();
  });
});
```

### Gemini API Mock

```typescript
import { GeminiApiMock } from '@tests/mocks/api/gemini';

describe('CommentGenerationService', () => {
  let geminiApiMock: GeminiApiMock;
  
  beforeEach(() => {
    // Setup API mock
    geminiApiMock = new GeminiApiMock();
    
    // Configure specific response for a test
    geminiApiMock.setResponseTemplate(
      'professional', 
      'medium',
      'This is a custom professional response for testing.'
    );
    
    // Replace fetch with mock implementation
    global.fetch = jest.fn().mockImplementation((url, options) => {
      if (url.includes('gemini-pro:generateContent')) {
        return geminiApiMock.generateContent(
          JSON.parse(options.body).contents[0].parts[0].text
        );
      }
      return Promise.reject(new Error('Unhandled fetch mock'));
    });
  });
  
  it('should generate professional comment', async () => {
    const result = await commentGenerationService.generateComment(
      { text: 'Sample post' },
      { style: 'professional', length: 'medium' }
    );
    
    expect(result).toContain('This is a custom professional response for testing.');
  });
  
  afterEach(() => {
    // Reset mock
    geminiApiMock.reset();
    jest.restoreAllMocks();
  });
});
```

### ServiceFactory Mock

```typescript
import { ServiceFactoryMock } from '@tests/mocks/services/content';

describe('CommentFieldEnhancer', () => {
  let serviceFactoryMock: ServiceFactoryMock;
  
  beforeEach(() => {
    // Reset and get mock instance
    ServiceFactoryMock.resetInstance();
    serviceFactoryMock = ServiceFactoryMock.getInstance();
    
    // Configure mock implementation
    const commentInserterMock = serviceFactoryMock.getCommentInserter();
    commentInserterMock.insertComment.mockImplementation(() => true);
    
    // Replace the real ServiceFactory with mock
    jest.spyOn(ServiceFactory, 'getInstance').mockImplementation(() => 
      serviceFactoryMock as any
    );
  });
  
  it('should enhance comment field with button', () => {
    const commentFieldEnhancer = new CommentFieldEnhancer();
    const result = commentFieldEnhancer.enhanceCommentField(mockCommentField);
    
    expect(result).toBe(true);
    expect(serviceFactoryMock.getThemeDetector().isDarkTheme).toHaveBeenCalled();
  });
  
  afterEach(() => {
    // Reset mocks
    serviceFactoryMock.resetAllMocks();
    jest.restoreAllMocks();
  });
});
```

### DOM Elements Mock

```typescript
import { createMockLinkedInPost, createMockLinkedInCommentField } from '@tests/mocks/dom/elements';

describe('PostDetector', () => {
  let mockFeed: HTMLElement;
  
  beforeEach(() => {
    // Create mock LinkedIn feed
    mockFeed = document.createElement('div');
    mockFeed.className = 'feed';
    
    // Add mock posts to feed
    const mockPost = createMockLinkedInPost({
      content: 'Test post content',
      author: 'Test Author',
      hasCommentSection: true
    });
    
    mockFeed.appendChild(mockPost);
    document.body.appendChild(mockFeed);
  });
  
  it('should detect LinkedIn posts', () => {
    const postDetector = new PostDetector();
    const posts = postDetector.scanForLinkedInPosts();
    
    expect(posts.length).toBe(1);
    expect(posts[0].getAttribute('data-urn')).toBeTruthy();
  });
  
  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
  });
});
```

## Working with Mocks

### Setting Up

To use these mocks in your tests:

1. Import the necessary mocks from the appropriate directories
2. Configure the mocks with the desired behavior for your test case
3. Use Jest's mocking capabilities to replace real implementations with mocks
4. Reset mocks after each test to ensure test isolation

### Common Patterns

- Use `beforeEach` to set up mocks for each test case
- Use `afterEach` to reset mocks and restore original implementations
- Use Jest's `mockImplementation` to define custom behavior
- Configure mock responses to simulate success and error conditions
- Use `jest.spyOn` to mock methods on existing objects

### Adding New Mocks

When adding new mocks:

1. Create a new file in the appropriate directory
2. Export the mock class or functions
3. Update the index.ts file to export the new mock
4. Add example usage in this README file

## Advanced Usage

For more complex scenarios, mocks can be combined:

```typescript
import { ChromeStorageMock } from '@tests/mocks/chrome/storage';
import { GeminiApiMock } from '@tests/mocks/api/gemini';
import { ServiceFactoryMock } from '@tests/mocks/services/content';
import { createMockLinkedInPost } from '@tests/mocks/dom/elements';
import { FetchMock } from '@tests/mocks/api/fetch';

// Set up all mocks for end-to-end testing
// ...
``` 