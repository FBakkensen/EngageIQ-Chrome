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
- GitHub Copilot will ask for confirmation before proceeding to the next step
- Each next step will be described in detail before implementation

## CSS & Styling
- Use the custom CSS utility classes defined in src/styles/global.css
- We're using PostCSS with Tailwind CSS for styling
- When making changes to CSS, ensure @tailwindcss/postcss is installed
- To fix CSS build issues: `npm install -D tailwindcss postcss autoprefixer @tailwindcss/postcss`

## Code Style Guidelines
- Use TypeScript with proper typing; avoid `any` except when required for Chrome API
- Follow React functional component pattern with React.FC type annotation
- Use import aliases with `@/` prefix (maps to src directory)
- Component file structure: imports → interface/types → component → exports
- Error handling: Use try/catch with descriptive error messages for async operations
- Naming: PascalCase for components/classes, camelCase for functions/variables
- State management: Use MobX for complex state; React hooks for component state
- File structure: group by feature in `src/features` for domain logic
- Keep Chrome API interactions in dedicated service files

## SOLID Principles
Follow these principles when developing new features or refactoring code:

### Single Responsibility Principle
- Each class/service should have only one reason to change
- Create specialized services for specific tasks
- Use the established directory structure:
  - `src/content/services/` for business logic
  - `src/content/ui/` for UI components
  - `src/content/utils/` for utility functions

### Open/Closed Principle
- Services should be open for extension but closed for modification
- Create interfaces for all service classes
- Place interfaces in `src/content/services/interfaces/`

### Liskov Substitution Principle
- Implementations should be substitutable for their base interfaces
- Child classes should not break expectations set by parent classes
- Methods should respect the interface contracts

### Interface Segregation Principle
- Create small, focused interfaces rather than general-purpose ones
- Components should only depend on interfaces they actually use
- Split large interfaces into smaller, more specific ones

### Dependency Inversion Principle
- High-level modules should not depend on low-level modules
- Both should depend on abstractions
- Use the `ServiceFactory` for dependency management
- Inject dependencies through constructors

### Supporting Services
- `Logger`: Use for consistent logging across components
- `ThemeDetector`: Use for theme-related functionality
- `DOMUtils`: Use for DOM manipulation utilities
- `ServiceFactory`: Use for creating and managing service instances