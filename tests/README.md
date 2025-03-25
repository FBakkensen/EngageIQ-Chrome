# EngageIQ Chrome Extension - Test Documentation

This directory contains tests for the EngageIQ Chrome Extension. The test structure mirrors the source code structure, with additional directories for mocks, utilities, and test setup.

## Running Tests

```bash
# Run all tests
npm test

# Run a specific test file
npx jest path/to/test.ts

# Run tests with coverage
npm test -- --coverage
```

## Test Directory Structure

The test directory structure mirrors the `src/` directory structure, with additional directories for test utilities and mocks. See `DIRECTORY_MAP.md` for a detailed directory tree.

## Test Naming Conventions

- Unit test files: `*.test.ts` or `*.test.tsx`
- Integration test files: `*.integration.test.ts`
- Test files should be placed in the same directory structure as the source code

## Test Environments

- UI components: JSDOM environment (configured in `setup-dom.js`)
- Services and utilities: Node environment (configured in `setup-node.js`)

## Mocking Strategies

- Chrome API: Mocked in `mocks/chrome/`
- DOM: LinkedIn DOM elements mocked in `mocks/dom/`
- API: Gemini API and other external APIs mocked in `mocks/api/`
- Services: Service implementations mocked in `mocks/services/`

## Test Utilities

- Factories: Factory functions for creating test data in `utils/factories/`
- Fixtures: Test data fixtures in `utils/fixtures/`
- Helpers: Helper functions for tests in `utils/helpers/`
- Test Renderers: Component rendering utilities in `utils/test-renderers/`

## Best Practices

1. Keep tests small and focused on a single unit of functionality
2. Use descriptive test names that explain what is being tested
3. Follow the Arrange-Act-Assert pattern
4. Mock external dependencies
5. Test both success and failure paths
6. Aim for high test coverage but focus on critical paths first
7. Use service interfaces for testing rather than implementations when possible 