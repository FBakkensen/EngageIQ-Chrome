# Tech Context

## Technologies Used
- **TypeScript**: For type-safe JavaScript development
- **React**: For building component-based UI elements
- **Tailwind CSS**: For utility-first styling with consistent design
- **PostCSS**: For CSS processing and transformations
- **Chrome Extension API**: For extension functionality and browser integration
- **Gemini AI API**: For generating comment suggestions
- **MutationObserver**: For tracking LinkedIn DOM changes
- **Drag & Drop API**: For the movable floating popup
- **Chrome Storage API**: For secure data persistence
- **Rollup**: For bundling the extension

## Development Setup
- **VS Code**: Primary IDE with TypeScript and React extensions
- **Node.js**: JavaScript runtime environment
- **npm**: Package manager for dependencies
- **Chrome Extensions Developer Mode**: For testing the extension
- **Git**: For version control
- **Lint & Format Tools**: ESLint and Prettier for code quality
- **Chrome DevTools**: For debugging and performance analysis

## Technical Constraints
- **LinkedIn DOM Structure**: Complex and frequently changing DOM requiring robust selectors
- **Content Script Context**: Limited access to page context and isolation constraints
- **Cross-Origin Restrictions**: Security limitations when accessing external resources
- **Chrome API Limitations**: Working within Chrome's extension security model
- **Storage Limitations**: Chrome's storage API size constraints
- **Gemini API Quotas**: Rate limiting on API requests
- **Performance Considerations**: Minimizing impact on LinkedIn browsing experience
- **Browser Compatibility**: Ensuring compatibility with different Chrome versions

## Dependencies
- **Core Dependencies**:
  - react: UI library for components
  - react-dom: DOM-specific methods for React
  - @google/generative-ai: SDK for Google's Gemini AI API
  - draggable: Library for creating draggable UI elements

- **Type Definitions**:
  - @types/chrome: TypeScript definitions for Chrome API
  - @types/react: TypeScript definitions for React
  - @types/react-dom: TypeScript definitions for React DOM

- **Build Tools**:
  - rollup: Module bundler
  - typescript: TypeScript compiler
  - rollup-plugin-chrome-extension: Rollup plugin for Chrome extensions
  - @rollup/plugin-typescript: TypeScript support for Rollup
  - @rollup/plugin-node-resolve: Node module resolution for Rollup

- **Testing Tools**:
  - jest: Testing framework
  - ts-jest: TypeScript preprocessor for Jest
  - @testing-library/react: Testing utilities for React components

- **Styling**:
  - tailwindcss: Utility-first CSS framework
  - postcss: CSS transformation tool
  - autoprefixer: PostCSS plugin to add vendor prefixes
  - cssnano: CSS minification tool
