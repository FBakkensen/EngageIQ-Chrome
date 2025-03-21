# EngageIQ Chrome Extension Development Guide

## Build & Test Commands
- `npm run dev`: Start development server
- `npm run build`: Build production bundle
- `npm run watch`: Build and watch for changes
- `npm test`: Run all tests
- `npx jest path/to/test.ts`: Run a single test file
- `npm run storybook`: Run Storybook UI development environment

## Development Workflow
- Develop in very small, incremental steps
- After each step, verify completion before continuing
- Verification methods will be provided for each step
- Claude will ask for confirmation before proceeding to the next step
- Each next step will be described in detail before implementation

## Code Style Guidelines
- Use TypeScript with proper typing; avoid `any` except when required for Chrome API
- Follow React functional component pattern with React.FC type annotation
- Use import aliases with `@/` prefix (maps to src directory)
- Component file structure: imports → interface/types → component → exports
- Error handling: Use try/catch with descriptive error messages for async operations
- Naming: PascalCase for components/classes, camelCase for functions/variables
- Styles: Use Tailwind CSS utility classes
- State management: Use MobX for complex state; React hooks for component state
- File structure: group by feature in `src/features` for domain logic
- Keep Chrome API interactions in dedicated service files