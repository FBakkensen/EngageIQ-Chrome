# EngageIQ Chrome Extension - Test Directory Map

This document provides a visual map of the test directory structure, along with explanations for each directory.

## Directory Structure

```
tests/
├── background/           # Tests for background service worker
│   └── index.test.ts     # Test for background script
├── content/              # Tests for content scripts
│   ├── services/         # Tests for content services
│   │   ├── interfaces/   # Tests for service interfaces
│   │   ├── CommentInserter.test.ts
│   │   ├── DOMObserver.test.ts
│   │   ├── Logger.test.ts
│   │   ├── MessageHandler.test.ts
│   │   ├── PostDetector.test.ts
│   │   ├── ServiceFactory.test.ts
│   │   └── ThemeDetector.test.ts
│   ├── ui/               # Tests for UI components in content
│   │   ├── CommentDisplay.test.ts
│   │   └── CommentFieldEnhancer.test.ts
│   └── utils/            # Tests for utility functions
│       └── DOMUtils.test.ts
├── components/           # Tests for shared components
├── core/                 # Tests for core functionality
├── features/             # Tests for feature modules
├── mocks/                # Mock implementations
│   ├── api/              # API mocks (Gemini, etc.)
│   ├── chrome/           # Chrome API mocks
│   ├── dom/              # LinkedIn DOM element mocks
│   └── services/         # Mock service implementations
├── options/              # Tests for options page
├── popup/                # Tests for popup page
├── styles/               # Tests for styling utilities
├── types/                # Tests for TypeScript types and interfaces
├── utils/                # Test utilities
│   ├── factories/        # Test factory functions
│   ├── fixtures/         # Test data fixtures
│   ├── helpers/          # Helper functions for tests
│   └── test-renderers/   # Component rendering utilities
├── setup-dom.js          # DOM setup for UI tests
├── setup-node.js         # Node setup for service tests
└── README.md             # Documentation on testing approach
```

## Directory Explanations

### Main Test Directories

- **background/**: Tests for the background service worker that handles extension lifecycle and API communication
- **content/**: Tests for content scripts that run on LinkedIn pages
  - **services/**: Tests for services that provide functionality to content scripts
  - **ui/**: Tests for UI components rendered in LinkedIn pages
  - **utils/**: Tests for utility functions used in content scripts
- **components/**: Tests for shared React components used across different parts of the extension
- **core/**: Tests for core functionality and shared services
- **features/**: Tests for feature modules
- **options/**: Tests for the options page UI and functionality
- **popup/**: Tests for the popup UI and functionality
- **styles/**: Tests for styling utilities and theme functionality
- **types/**: Tests for TypeScript types and interfaces

### Support Directories

- **mocks/**: Contains mock implementations for testing
  - **api/**: Mocks for external APIs like Gemini
  - **chrome/**: Mocks for Chrome extension APIs
  - **dom/**: Mocks for LinkedIn DOM elements
  - **services/**: Mock implementations of internal services
- **utils/**: Contains utilities for testing
  - **factories/**: Factory functions for creating test data
  - **fixtures/**: Test data fixtures
  - **helpers/**: Helper functions for tests
  - **test-renderers/**: Utilities for rendering components in tests

### Setup Files

- **setup-dom.js**: Setup file for tests that require a DOM environment (UI components)
- **setup-node.js**: Setup file for tests that run in a Node environment (services)

## Test File Conventions

- Test files are named after the source file they test, with `.test.ts` or `.test.tsx` suffix
- Test files are placed in the same directory structure as the source code they test
- Integration tests use the `.integration.test.ts` suffix

## Environment Configuration

- UI component tests use the JSDOM environment (configured in `setup-dom.js`)
- Service and utility tests use the Node environment (configured in `setup-node.js`)
- Tests that require Chrome API access use mocks defined in `mocks/chrome/` 