# Tech Context

## Technologies Used
- **TypeScript**: For type-safe JavaScript development
- **React**: For building component-based UI
- **Tailwind CSS**: For utility-first styling
- **PostCSS**: For CSS processing and transformations
- **MobX**: For state management
- **Vite**: For fast builds and development experience
- **Jest & Vitest**: For testing
- **Storybook**: For UI component development and testing
- **Chrome Extension API**: For extension functionality

## Development Setup
- **VS Code**: Primary IDE with TypeScript and React extensions
- **Node.js**: JavaScript runtime environment
- **npm**: Package manager
- **Chrome Extensions Developer Mode**: For testing the extension
- **Git**: For version control
- **GitHub**: For code hosting and collaboration

## Technical Constraints
- **Chrome API Limitations**: Working within the confines of Chrome's extension security model
- **Content Script Context**: Limited access to page context and isolation constraints
- **Cross-Origin Restrictions**: Security limitations when accessing content across domains
- **Storage Limitations**: Chrome's storage API size constraints
- **Performance Considerations**: Minimizing impact on page load and rendering performance
- **Browser Compatibility**: Ensuring compatibility with different Chrome versions

## Dependencies
- **Core Dependencies**:
  - react: UI library
  - react-dom: DOM-specific methods for React
  - mobx: State management
  - mobx-react-lite: MobX bindings for React

- **Type Definitions**:
  - @types/chrome: TypeScript definitions for Chrome API
  - @types/react: TypeScript definitions for React
  - @types/react-dom: TypeScript definitions for React DOM

- **Build Tools**:
  - @vitejs/plugin-react: Vite plugin for React
  - vite: Build tool and dev server
  - typescript: TypeScript compiler

- **Testing Tools**:
  - jest: Testing framework
  - ts-jest: TypeScript preprocessor for Jest
  - vitest: Next generation testing framework
  - @vitest/browser: Browser testing for Vitest
  - @vitest/coverage-v8: Coverage reporting for Vitest
  - playwright: Browser automation

- **UI Development**:
  - storybook: UI component workshop

- **Styling**:
  - tailwindcss: Utility-first CSS framework
  - postcss: CSS transformation tool
  - autoprefixer: PostCSS plugin to add vendor prefixes
