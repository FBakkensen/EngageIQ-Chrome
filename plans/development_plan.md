# EngageIQ Chrome Extension - Incremental Development Plan

This development plan breaks down the implementation of the EngageIQ Chrome Extension into small, verifiable steps according to the development workflow guidelines. Each step includes specific verification methods to ensure completion before proceeding to the next step.

## Phase 1: Project Setup & Environment Configuration

### ✅ Step 1: Initialize Project Structure
**Tasks:**
- Set up basic directory structure for Chrome extenii wsion
- Configure TypeScript and required dependencies
- Create initial manifest.json file

**Verification:**
1. Run `npm run dev` to ensure the build process works without errors
2. Verify directory structure matches recommended pattern
3. Check that TypeScript compiles without errors
4. Load the extension in Chrome in developer mode to verify it registers

**Next Step:** Create basic background script service worker

---

### ✅ Step 2: Create Basic Background Script
**Tasks:**
- Implement minimal background service worker
- Set up message handling infrastructure
- Configure basic Chrome extension lifecycle management

**Verification:**
1. Run `npm run build` to ensure the background script compiles
2. Load extension in Chrome and verify the background service worker registers
3. Check Chrome DevTools for any console errors
4. Use Chrome's extension management page to verify service worker status

**Next Step:** Implement options page for API key management

---

### ✅ Step 3: Create Options Page
**Tasks:**
- Create basic options page UI with React
- Implement API key input field with secure storage
- Add validation UI for API key

**Verification:**
1. Run `npm run build` to ensure the options page compiles
2. Right-click the extension icon and select "Options" to open the page
3. Enter test API key and verify it's saved
4. Refresh the options page and verify the API key persists
5. Try invalid API key format and verify error messages

**Next Step:** Develop popup UI

---

### ✅ Step 4: Implement Popup UI
**Tasks:**
- Create basic popup UI structure
- Add status information display
- Connect popup to background script

**Verification:**
1. Run `npm run build` to compile the popup
2. Click extension icon to verify popup displays correctly
3. Check that status information is shown
4. Verify that styling matches LinkedIn's design aesthetic

**Next Step:** Create LinkedIn content script structure

---

## Phase 2: LinkedIn Integration

### ✅ Step 5: Implement Content Script Infrastructure
**Tasks:**
- Create basic content script that loads on LinkedIn domains
- Implement script injection logic
- Set up communication with background script

**Verification:**
1. Run `npm run build` to compile the content script
2. Visit LinkedIn and check Chrome DevTools console for script loading message
3. Verify the content script can communicate with the background script
4. Check for any console errors or warnings

**Next Step:** Develop LinkedIn post detection

---

### ✅ Step 6: Implement LinkedIn Post Detection
**Tasks:**
- Create post detection logic in content script
- Implement fallback detection methods for reliability
- Add mutation observers for dynamically loaded content

**Verification:**
1. Visit LinkedIn feed and open console to verify posts are detected
2. Scroll through feed to ensure new posts are detected as they load
3. Test detection on different types of LinkedIn posts
4. Verify detection works in both light and dark modes

**Next Step:** Implement comment field detection

---

### ✅ Step 7: Implement Comment Field Detection
**Tasks:**
- Add comment field detection logic
- Create button insertion mechanism
- Handle focus events on comment fields

**Verification:**
1. Visit LinkedIn feed and click on comment field
2. Verify "Generate Comment" button appears when comment field is focused
3. Test on different post types to ensure consistent behavior
4. Check that button positioning is correct and responsive

**Next Step:** Create UI for comment generation button

---

### ✅ Step 8: Create Generate Comment Button UI
**Tasks:**
- Design and implement button UI
- Add button positioning logic
- Implement click handling

**Verification:**
1. Focus on comment field and verify button appearance matches LinkedIn's style
2. Check button positioning in different viewport sizes
3. Verify button responds to clicks
4. Test dark/light mode compatibility

**Next Step:** Implement post content extraction

---

### ✅ Step 9: Implement Post Content Extraction
**Tasks:**
- Create post content extraction logic
- Handle different post types (text, images, links)
- Extract author and context information

**Verification:**
1. Use console logging to verify correct post content extraction
2. Test extraction on different post types (text-only, with images, with links)
3. Verify author information is correctly extracted
4. Check handling of special characters and formatting

**Next Step:** Implement Gemini API integration

---

## Phase 3: AI Integration

### ✅ Step 10: Implement Gemini API Integration
**Tasks:**
- Create API service in background script
- Implement request/response handling
- Add error handling for API calls

**Verification:**
1. Use API key from options page to make test requests
2. Verify successful API responses in console
3. Test error handling with invalid API keys
4. Check rate limiting handling

**Next Step:** Develop comment generation prompts

---

### ✅ Step 11: Implement Comment Generation Logic
**Tasks:**
- Create prompt engineering for Gemini API
- Implement comment generation request formatting
- Add response parsing logic

**Verification:**
1. Test comment generation with sample post content
2. Verify different comment tones are generated
3. Check handling of multilingual content
4. Test with image content extraction

**Next Step:** Create comment display UI

---

### ✅ Step 12: Create Comment Display UI
**Tasks:**
- Design and implement modal UI for displaying generated comments
- Add tone options and selection UI
- Implement responsive positioning

**Verification:**
1. Generate comments and verify modal displays correctly
2. Test different tone selections
3. Verify UI works in different viewport sizes
4. Check dark/light mode compatibility
5. Test keyboard navigation

**Next Step:** Implement comment insertion

---

### ✅ Step 13: Implement Comment Insertion
**Tasks:**
- Create comment insertion logic for LinkedIn editor
- Handle different editor states
- Add success/error feedback

**Verification:**
1. Select generated comment and verify it's inserted into LinkedIn comment field
2. Test insertion in different editor states
3. Verify formatting is preserved
4. Check handling of special characters

**Next Step:** Add length customization

---

### ✅ Step 14: Implement Length Customization

**✅ Sub-Step 14.1: Add Length Preference Options to UI**
**Tasks:**
- Design and implement slider in the comment display UI for selecting comment length (e.g., Short, Medium, Long).
- Ensure the UI integrates seamlessly with the existing design.

**Verification:**
1. Verify the length selection UI appears correctly in the comment display modal.
2. Test responsiveness and compatibility with light/dark modes.
3. Check that the selected length is visually highlighted.

**Next Sub-Step:** Update prompt engineering to handle length preferences.

---

**✅ Sub-Step 14.2: Update Prompt Engineering for Length Preferences**
**Tasks:**
- Modify the prompt generation logic to include the selected length preference.
- Ensure the prompt dynamically adjusts based on the user's selection.

**Verification:**
1. Test prompt generation with each length option and verify the API request includes the correct length parameter.
2. Check that the generated comments match the selected length.
3. Verify error handling for invalid or missing length preferences.

**Next Sub-Step:** Save user preferences for length selection.

---

**✅ Sub-Step 14.3: Save User Preferences for Length Selection**
**Tasks:**
- Implement logic to persist the user's length preference using secure storage.
- Ensure preferences are loaded and applied when the extension is reopened.

**Verification:**
1. Select a length preference and verify it persists after refreshing the extension.
2. Test with multiple users or profiles to ensure preferences are stored independently.
3. Verify secure storage implementation to prevent unauthorized access.

**Next Sub-Step:** Final testing and integration of length customization.

---

**✅ Sub-Step 14.4: Final Testing and Integration**
**Tasks:**
- Test the entire length customization workflow end-to-end.
- Ensure seamless integration with other features, such as tone selection and comment insertion.
- Fix any bugs or inconsistencies identified during testing.

**Verification:**
1. Test the complete user flow, from selecting a length to generating and inserting a comment.
2. Verify compatibility with different LinkedIn post types and content.
3. Check for any performance issues or UI glitches.

**Next Step:** Implement UI/UX improvements.

---

### ✅ Step 15: Implement UI/UX Improvements

**✅ Sub-Step 15.1: Add Loading Spinner for Comment Generation**
**Tasks:**
- Design and implement a loading spinner for the "Generate Comment" button
- Ensure consistent visual feedback with the existing "Regenerate Comment" loading state
- Handle state transitions (idle, loading, complete, error)

**Verification:**
1. Click the "Generate Comment" button and verify the spinner appears immediately
2. Confirm the spinner visually indicates activity during API calls
3. Test with different network speeds to ensure consistent behavior
4. Verify spinner design is consistent with LinkedIn's design language
5. Check spinner behavior in both light and dark modes

**Next Sub-Step:** Implement floating popup redesign.

---

**✅ Sub-Step 15.2: Redesign Comment Display as Movable Floating Popup**
**Tasks:**
- Redesign the comment display UI as a floating popup that utilizes more screen width
- Implement drag-and-drop functionality to allow users to reposition the popup
- Ensure the popup respects screen boundaries and maintains visibility
- Update styling to match LinkedIn's design language
- Add tabs for each comment style
- Make a visual style to the box that emphasis that it is floating

**Verification:**
1. Generate a comment and verify the new floating popup design appears
2. Test dragging the popup to different screen positions
3. Verify the popup remains within screen boundaries when dragged
4. Check that the wider design effectively utilizes available screen space
5. Test responsiveness on different screen sizes
6. Verify the redesign works in both light and dark modes
7. Confirm all existing functionality (tone selection, length selection, comment insertion) works within new design

**Next Sub-Step:** Replace the text on 'Generate Comment' button with an image.

---

**✅ Sub-Step 15.3: Replace Text on 'Generate Comment' Button with Image**
**Tasks:**
- Extract and prepare the icon image used for the extension
- Modify the 'Generate Comment' button to use the icon image instead of text
- Ensure the button maintains its responsive behavior
- Add appropriate alt text for accessibility

**Verification:**
1. Verify the button icon displays correctly and scales appropriately
2. Test the button appearance in both light and dark modes
3. Check that the button remains responsive and clickable
4. Verify the icon matches the extension icon for visual consistency
5. Test accessibility by ensuring screen readers can interpret the button's function
6. Verify the button works correctly on different screen sizes and resolutions

**Next Step:** Enhance comment readability and structure.

---

### ✅ Step 16: Enhance Comment Readability and Structure
**Tasks:**
- Implement structural formatting (paragraphs, bullet points) for generated comments
- Add appropriate emojis that match the selected tone of the comment
- Create spacing rules to improve visual scanning of comments
- Implement line breaks at appropriate semantic points
- Add opening and closing elements for longer comments
- Update prompt engineering to incorporate LinkedIn best practices for engagement

**Verification:**
1. Verify generated comments include appropriate paragraph breaks for readability
2. Confirm emojis are correctly matched to the tone and content of comments
3. Test readability across different comment lengths (short, medium, long)
4. Ensure consistent formatting patterns across different post types
5. Compare comment formatting with high-engagement LinkedIn comments for best practices
6. Verify proper spacing and visual hierarchy in generated comments
7. Test that special characters and unicode emojis display correctly across platforms

**Next Step:** Implement image content processing

---

### ✅ Step 17: Implement Code Refactoring According to SOLID Principles

**Tasks:**
- Analyze existing services for adherence to SOLID principles
- Create comprehensive test coverage before refactoring
- Refactor services one at a time with focus on maintainability and extensibility

**✅ Sub-Step 17.1: Service Analysis and Planning**
**Tasks:**
- Create a service inventory documenting all services, responsibilities, and dependencies
- Identify services that violate SOLID principles (particularly Single Responsibility)
- Map service relationships and coupling points
- Prioritize services for refactoring based on size, complexity, and dependencies
- Create a detailed refactoring roadmap with milestones

**Verification:**
1. Verify completeness of service inventory against codebase
2. Confirm comprehensive documentation of current architecture strengths and weaknesses
3. Check that refactoring priorities align with the extension's core functionality
4. Review the refactoring roadmap for feasibility and risk assessment

**Next Sub-Step:** Establish test infrastructure before refactoring.

---

**❌ Sub-Step 17.2: Establish Test Infrastructure**

**✅ Sub-Step 17.2.1: Set up Jest Configuration**
**Tasks:**
- Create jest.config.js in the project root
- Configure TypeScript support with ts-jest
- Set up module mapping for import aliases (@/ prefix)
- Configure test environment (jsdom for UI components, node for services)
- Configure Chrome API mocking
- Add test matching patterns

**Verification:**
1. Running `npm test` executes tests without configuration errors
2. TypeScript files are properly transpiled during testing
3. Import aliases work correctly in test files
4. Jest can find and run test files according to the configured patterns

**Next Sub-Step:** Create test directory structure.

---

**✓ Sub-Step 17.2.1.1: Create Basic Jest Config with TypeScript Support**
**Tasks:**
- Create the initial jest.config.js in the project root
- Configure TypeScript support with ts-jest
- Set up basic transform patterns for TypeScript files

**Implementation:**
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
};
```

**Verification:**
1. Create a simple TypeScript test file (e.g., `tests/setup.test.ts`)
2. Run `npm test` to verify TypeScript compilation works
3. Check that Jest can recognize and run the test file

**Potential Challenges:**
- Ensuring TypeScript version compatibility with ts-jest
- Handling any custom TypeScript configuration in the project

**Next Sub-Step:** Configure module aliases and paths.

---

**✓ Sub-Step 17.2.1.2: Configure Module Aliases and Paths**
**Tasks:**
- Set up moduleNameMapper to handle the @/ import alias
- Configure paths to match tsconfig.json settings
- Ensure proper handling of CSS/asset imports in tests

**Implementation:**
```javascript
// jest.config.js (updated)
module.exports = {
  // ... previous config
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/mocks/styleMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/tests/mocks/fileMock.js',
  },
};
```

**Verification:**
1. Create a test file that imports using the @/ alias
2. Run the test to verify the import resolution works
3. Try importing different types of files to verify proper mapping

**Potential Challenges:**
- Matching the exact path mapping from tsconfig.json
- Dealing with various import types (CSS, images, etc.)

**Next Sub-Step:** Set up test environments.

---

**✓ Sub-Step 17.2.1.3: Set Up Test Environments**
**Tasks:**
- Configure separate test environments for different test types
- Set up jsdom for UI component testing
- Configure node environment for service/utility testing

**Implementation:**
```javascript
// jest.config.js (updated)
module.exports = {
  // ... previous config
  projects: [
    {
      displayName: 'DOM',
      testMatch: ['<rootDir>/src/**/*.spec.tsx', '<rootDir>/tests/ui/**/*.test.ts?(x)'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/tests/setup-dom.js'],
    },
    {
      displayName: 'NODE',
      testMatch: ['<rootDir>/src/**/*.spec.ts', '<rootDir>/tests/services/**/*.test.ts'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup-node.js'],
    },
  ],
};
```

**Verification:**
1. Create a UI component test that requires DOM features
2. Create a service test that doesn't need DOM
3. Verify both tests run in their appropriate environments

**Potential Challenges:**
- Correctly categorizing tests for appropriate environments
- Ensuring test environment-specific setup doesn't conflict

**Next Sub-Step:** Configure Chrome API mocking.

---

**✓ Sub-Step 17.2.1.4: Configure Chrome API Mocking**
**Tasks:**
- Set up jest.mock for Chrome APIs
- Create basic Chrome API mock implementations
- Configure test setup files for extension API mocking

**Implementation:**
```javascript
// tests/setup-chrome.js
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
  },
};
```

**Verification:**
1. Create a test file that uses Chrome APIs
2. Verify the test runs without "chrome is not defined" errors
3. Test that mock implementations return expected values

**Potential Challenges:**
- Covering all necessary Chrome APIs used in the extension
- Ensuring mocks behave similarly to real Chrome APIs

**Next Sub-Step:** Configure test discovery and patterns.

---

**✓ Sub-Step 17.2.1.5: Configure Test Discovery and Patterns**
**Tasks:**
- Set testMatch patterns to find appropriate test files
- Configure coverage collection settings
- Set up test reporting formats

**Implementation:**
```javascript
// jest.config.js (updated)
module.exports = {
  // ... previous config
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  testTimeout: 10000,
  verbose: true,
};
```

**Verification:**
1. Place test files in different locations
2. Run `npm test` to verify all test files are discovered
3. Check that coverage reporting works

**Potential Challenges:**
- Finding the right balance for test file organization
- Setting appropriate coverage thresholds

**Next Sub-Step:** Create test directory structure.

---

**❌ Sub-Step 17.2.2: Create Test Directory Structure**
**Tasks:**
- Create a tests/ directory at the project root
- Set up subdirectories mirroring the src/ structure
- Create mocks/ directory for mock implementations
- Set up utilities/ directory for test helpers
- Add README.md with testing guidelines

**Verification:**
1. Directory structure is properly set up and matches src/ structure
2. Test files can be placed in the appropriate directories
3. Structure supports both unit and integration tests
4. Mock and utility directories are properly organized

**Next Sub-Step:** Implement mock frameworks.

---

**❌ Sub-Step 17.2.2.1: Define Core Test Directory Structure**
**Tasks:**
- Create a complete directory structure that mirrors the src/ hierarchy
- Add .gitkeep files to empty directories to preserve structure
- Create a directory map document for reference
- Add placeholder test files (*.test.ts) in each directory

**Verification:**
1. Run `ls -la tests` to verify directory structure
2. Compare structure with src/ directories using `find` commands
3. Run a test to ensure Jest recognizes the structure
4. Verify test placeholders are properly detected

**Estimated Time:** 1 hour

**Next Sub-Step:** Create mock implementation directories.

---

**❌ Sub-Step 17.2.2.2: Create Mock Implementation Structure**
**Tasks:**
- Expand mocks/ directory with subdirectories for:
  * mocks/chrome/ (Chrome API mocks by category)
  * mocks/dom/ (LinkedIn DOM element mocks)
  * mocks/api/ (Gemini API and other API mocks)
  * mocks/services/ (Mock service implementations)
- Create index.ts files in each mock directory for easy importing
- Add basic mock implementations as examples

**Verification:**
1. Verify directory structure is created
2. Test import statements work from a sample test file
3. Create a simple test that uses mocks from each category
4. Run test to verify mocks are properly configured

**Estimated Time:** 1.5 hours

**Next Sub-Step:** Implement test utilities structure.

---

**❌ Sub-Step 17.2.2.3: Implement Test Utilities Structure**
**Tasks:**
- Create utils/ directory with subdirectories:
  * utils/factories/ (Test factory functions)
  * utils/fixtures/ (Test data fixtures)
  * utils/helpers/ (Testing helper functions)
  * utils/test-renderers/ (Component rendering utilities)
- Add basic utility functions and helper files
- Create README.md with usage examples

**Verification:**
1. Verify directory structure is created
2. Import utilities in a sample test file
3. Create a test that uses the provided utilities
4. Run test to verify utilities work correctly

**Estimated Time:** 2 hours

**Next Sub-Step:** Add comprehensive test documentation.

---

**❌ Sub-Step 17.2.2.4: Add Comprehensive Test Documentation**
**Tasks:**
- Create main tests/README.md with overall structure explanation
- Add README.md files to each major directory
- Create CONTRIBUTING.md with testing guidelines
- Add example test files in each directory
- Document best practices for each test type

**Verification:**
1. Verify README files exist in each directory
2. Check that documentation is accurate and helpful
3. Ensure examples match the actual testing patterns
4. Have another team member review documentation

**Estimated Time:** 2 hours

**Next Sub-Step:** Set up CI test configuration.

---

**❌ Sub-Step 17.2.2.5: Set Up CI Test Configuration**
**Tasks:**
- Create ci/ directory for CI-specific configurations
- Add test reporters for CI environment
- Configure coverage reporting for CI
- Update package.json scripts for CI testing
- Add CI workflow documentation

**Verification:**
1. Verify CI directory structure exists
2. Test CI scripts locally
3. Check that coverage reporting works in CI mode
4. Ensure all tests can be run in a CI-like environment

**Estimated Time:** 1.5 hours

**Next Sub-Step:** Implement mock frameworks.

---

**❌ Sub-Step 17.2.3: Implement Mock Frameworks**
**Tasks:**
- Create Chrome API mocks for common extension APIs (storage, runtime, tabs)
- Create Gemini API mocks with sample responses for different prompts
- Set up DOM mocks for LinkedIn page structure
- Create mock implementation for fetch/API calls
- Implement mock ServiceFactory for testing

**Verification:**
1. Chrome API mocks correctly simulate Chrome extension behavior
2. Chrome storage APIs work with in-memory implementation
3. Gemini API mocks return realistic responses
4. Mock implementations can be easily used in test files

**Next Sub-Step:** Develop test utilities.

---

**❌ Sub-Step 17.2.4: Develop Test Utilities**
**Tasks:**
- Create service factory testing utilities
- Implement UI component testing helpers
- Set up async testing utilities
- Create test data generators
- Add helper functions for common testing patterns

**Verification:**
1. Helper functions simplify common testing tasks
2. ServiceFactory testing utilities allow easy service mocking
3. UI component testing helpers properly render components
4. Async utilities correctly handle promises and timers

**Next Sub-Step:** Write initial tests for priority services.

---

**❌ Sub-Step 17.2.5: Write Initial Tests for Priority Services**

**❌ Sub-Step 17.2.5.1: ServiceFactory Tests**
**Tasks:**
- Create test suite for the ServiceFactory singleton
- Implement tests for service retrieval and initialization
- Test error handling for service access patterns

**Verification:**
1. Test that getInstance() returns the same instance when called multiple times
2. Verify that getters return the expected service instances
3. Confirm proper initialization sequence of dependent services
4. Validate error handling for unavailable services

**Next Sub-Step:** ApiKeyService Tests

---

**❌ Sub-Step 17.2.5.2: ApiKeyService Tests**
**Tasks:**
- Set up test fixtures for simulated Chrome storage
- Create tests for API key storage operations (get, save, clear)
- Implement tests for API key validation logic
- Test error handling pathways

**Verification:**
1. Verify API key is correctly saved to mocked storage
2. Confirm API key retrieval functions correctly
3. Test that validation properly handles valid/invalid keys
4. Validate error handling for storage failures and API failures

**Next Sub-Step:** MessageHandler Tests

---

**❌ Sub-Step 17.2.5.3: MessageHandler Tests**
**Tasks:**
- Create mock implementations for dependencies (CommentInserter, PostDetector)
- Set up test fixtures for Chrome runtime messages
- Implement tests for message processing logic
- Test service coordination and event handling

**Verification:**
1. Verify correct message handling for different message types
2. Confirm proper coordination with dependent services
3. Test error propagation and handling
4. Validate event sequence during normal operation

**Next Sub-Step:** CommentGenerationService Core Tests

---

**❌ Sub-Step 17.2.5.4: CommentGenerationService Core Tests**
**Tasks:**
- Set up test fixtures for post content and API responses
- Create tests for prompt generation functionality
- Implement tests for basic comment generation flow
- Test core error handling

**Verification:**
1. Verify prompts are correctly generated for different post types
2. Confirm proper API request formatting
3. Test response parsing logic
4. Validate error handling for API failures

**Next Sub-Step:** CommentGenerationService Advanced Tests

---

**❌ Sub-Step 17.2.5.5: CommentGenerationService Advanced Tests**
**Tasks:**
- Create tests for comment style variations
- Implement tests for length customization
- Test formatting and structure application
- Create tests for edge cases and special content

**Verification:**
1. Verify different comment styles are correctly generated
2. Confirm length customization behaves as expected
3. Test formatting is correctly applied to generated comments
4. Validate handling of special characters and content types

**Next Sub-Step:** UI Component Core Tests

---

**❌ Sub-Step 17.2.5.6: UI Component Core Tests**
**Tasks:**
- Set up JSDOM environment for UI testing
- Create tests for CommentDisplay rendering
- Implement tests for CommentFieldEnhancer
- Test basic UI state management

**Verification:**
1. Verify components render correctly with expected DOM structure
2. Confirm theme-awareness functions properly
3. Test UI state management for loading/error states
4. Validate event handler setup

**Next Sub-Step:** UI Component Interaction Tests

---

**❌ Sub-Step 17.2.5.7: UI Component Interaction Tests**
**Tasks:**
- Create tests for user interactions (clicks, drags, etc.)
- Implement tests for style and length selection
- Test comment insertion flow
- Create tests for UI positioning logic

**Verification:**
1. Verify click handlers function correctly
2. Confirm selection state changes appropriately
3. Test insertion triggers the correct service calls
4. Validate positioning behavior in different scenarios

**Next Sub-Step:** Test Coverage Analysis

---

**❌ Sub-Step 17.2.5.8: Test Coverage Analysis**
**Tasks:**
- Configure Jest for coverage reporting
- Run tests with coverage enabled
- Identify coverage gaps
- Create plan for addressing critical gaps

**Verification:**
1. Verify coverage report generation works correctly
2. Confirm coverage meets minimum threshold (70%)
3. Identify any critical functionality without coverage
4. Validate test suite organization and structure

**Next Sub-Step:** Configure test coverage reporting.

---

**❌ Sub-Step 17.2.6: Configure Test Coverage Reporting**
**Tasks:**
- Set up Jest coverage configuration
- Define coverage thresholds (aim for 70% minimum)
- Create npm scripts for coverage reporting
- Set up CI integration for test reports (if CI is used)
- Add coverage reports to .gitignore

**Verification:**
1. Running coverage command generates a coverage report
2. Coverage report shows percentage for statements, branches, functions, and lines
3. Coverage thresholds are properly configured
4. Coverage reports are generated in a useful format (HTML, JSON, etc.)

**Next Sub-Step:** Enhance ServiceFactory for better dependency management.

---

**❌ Sub-Step 17.3: Enhance ServiceFactory for Dependency Management**
**Tasks:**
- Create interfaces for all services managed by ServiceFactory
- Implement service registration mechanism to register implementations
- Add support for lazy initialization of services
- Implement proper lifecycle management (creation, caching, disposal)
- Add testing mode to inject mock implementations
- Update existing code to use the enhanced ServiceFactory

**Verification:**
1. Verify all services can be accessed through ServiceFactory
2. Test mock service registration for testing
3. Confirm lazy loading behavior works correctly
4. Check service lifecycle management functions properly
5. Ensure backward compatibility with existing code

**Next Sub-Step:** Refactor core services.

---

**❌ Sub-Step 17.4: Refactor CommentGenerationService**
**Tasks:**
- Create interfaces for new services:
  - IPromptGenerationService
  - IGeminiApiService
  - ICommentFormattingService
  - IImageProcessingService
- Implement each service with focused responsibilities
- Update ServiceFactory to provide new service implementations
- Modify existing code to use the new services
- Add comprehensive tests for each new service

**Verification:**
1. Run tests to verify refactored services maintain same behavior
2. Check that each service follows Single Responsibility Principle
3. Verify services use dependency injection through ServiceFactory
4. Confirm no functionality regressions in end-to-end testing
5. Test error handling in each service

**Next Sub-Step:** Refactor UI components.

---

**❌ Sub-Step 17.5: Refactor UI Components with Service-Like Behavior**
**Tasks:**
- Extract business logic from CommentFieldEnhancer into dedicated services
- Create PostContentExtractionService for separating UI from content parsing
- Break down large UI components into smaller, focused components
- Apply dependency injection pattern to UI components
- Ensure clear separation between UI and business logic
- Add tests for extracted services and UI components

**Verification:**
1. Test UI components with mock services to verify functionality
2. Check UI rendering in different contexts (light/dark mode)
3. Verify event handling works correctly after refactoring
4. Test performance of UI components after refactoring
5. Confirm UI behavior matches pre-refactoring baseline

**Next Step:** Add image content processing

---

### ❌ Step 18: Add Image Content Processing

**❌ Sub-Step 18.1: Image Detection and Extraction**
**Tasks:**
- Enhance the post content extraction logic to identify image elements in LinkedIn posts
- Implement methods to extract image URLs or base64 data from post DOM
- Handle different types of LinkedIn image posts (single image, carousel, etc.)
- Create fallback mechanisms for when image data cannot be extracted
- Implement validation to ensure extracted image data is valid
- Add logging for debugging image extraction process

**Verification:**
1. Visit LinkedIn posts containing images and verify images are correctly detected
2. Test with different image post types (single image, multiple images, carousel)
3. Check console logs to confirm proper image data extraction
4. Verify handling of posts that contain both text and images
5. Test error handling for invalid or inaccessible images

**Next Sub-Step:** API Integration for Image Processing.

---

**✅ Sub-Step 18.2: API Integration for Image Processing**
**Tasks:**
- Update the Gemini API service to handle image data in requests
- Implement request formatting for multimodal inputs (text + images)
- Add proper error handling for image processing API requests
- Optimize image data transmission (resizing, compression) if needed
- Create caching mechanisms for processed image results to improve performance
- Update API response parsing to handle image-aware responses

**Verification:**
1. Test API requests with posts containing images
2. Verify the API receives and processes image data correctly
3. Check handling of different image formats and sizes
4. Test error handling for API failures with image data
5. Verify response contains appropriate image-aware content
6. Measure and optimize performance for image processing requests

**Next Sub-Step:** Prompt Engineering for Image Context.

---

**✅ Sub-Step 18.3: Prompt Engineering for Image Context**
**Tasks:**
- Modify prompt templates to incorporate image context information
- Create specialized prompts for different image types (product images, people, infographics, etc.)
- Implement context-aware prompt generation that combines text and image insights
- Develop prompting strategies for handling multiple images in a single post
- Add instructions in prompts for balancing text content and image content
- Create fallback prompting strategies when image analysis is limited or unavailable

**Verification:**
1. Test generated prompts with various image types
2. Verify prompts effectively combine text and image context
3. Check generated comments for relevance to both text and image content
4. Test handling of posts with multiple images
5. Verify prompts degrade gracefully when image context is limited

**Next Sub-Step:** UI Updates and Testing for Image Processing.

---

**❌ Sub-Step 18.4: UI Updates and Testing for Image Processing**
**Tasks:**
- Update the comment generation UI to indicate when image content is being processed
- Add visual cues that show which images are being included in the analysis
- Implement loading states specific to image processing (which may take longer)
- Create UI elements to toggle image inclusion if needed
- Update error messages to handle image-specific processing failures
- Ensure the UI accurately reflects the additional context from images

**Verification:**
1. Test the complete workflow from image detection to comment generation
2. Verify UI provides clear feedback about image processing status
3. Check handling of posts with various combinations of text and images
4. Test different LinkedIn post layouts to ensure consistent behavior
5. Verify performance on slower connections where image processing may take longer
6. Test compatibility with both light and dark modes
7. Ensure the enhanced functionality doesn't disrupt existing features

**Next Step:** Enhance error handling

---

## Phase 4: Robustness & Polish

### ❌ Step 19: Enhance Error Handling
**Tasks:**
- Implement comprehensive error handling
- Add user-friendly error messages
- Create fallback mechanisms

**Verification:**
1. Test with various error scenarios (API issues, DOM changes, etc.)
2. Verify user-friendly error messages are displayed
3. Check that extension degrades gracefully when issues occur

**Next Step:** Implement performance optimizations

---

### ❌ Step 20: Implement Performance Optimizations
**Tasks:**
- Add debouncing for event listeners
- Optimize DOM operations
- Implement resource cleanup

**Verification:**
1. Use Chrome DevTools Performance tab to measure script execution time
2. Test extension on slower devices/connections
3. Verify smooth scrolling and responsiveness

**Next Step:** Add visual polish and feedback

---

### ❌ Step 21: Add Visual Polish and Feedback
**Tasks:**
- Refine UI animations and transitions
- Add loading indicators
- Enhance visual feedback for actions

**Verification:**
1. Test user flow and verify smooth transitions between states
2. Check loading indicators during API calls
3. Verify visual feedback for successful/failed actions

**Next Step:** Prepare for future enhancements

---

### ❌ Step 22: Prepare for Future Enhancements
**Tasks:**
- Refactor code for modularity
- Add extension points for future features
- Document code for future development

**Verification:**
1. Review code organization and architecture
2. Verify documentation is comprehensive
3. Test that existing functionality works with refactored code

**Next Step:** Finalize and package

---

### ❌ Step 23: Finalize and Package
**Tasks:**
- Perform end-to-end testing
- Optimize bundle size
- Prepare for Chrome Web Store submission

**Verification:**
1. Test complete user flows from installation to comment generation
2. Verify bundle size is optimized
3. Check Chrome Web Store requirements are met
4. Test on multiple operating systems and Chrome versions

**Next Step:** Release MVP version

---

## Development Approach

For each step in this plan:

1. **Development:** Implement the specified tasks in small, focused changes
2. **Verification:** Use the listed verification methods to confirm completion
3. **Review:** Evaluate if any adjustments are needed before proceeding
4. **Confirmation:** Explicitly confirm readiness to proceed to the next step

This incremental approach ensures that each component is fully functional before building on it, reducing the risk of compounding issues and making debugging simpler.