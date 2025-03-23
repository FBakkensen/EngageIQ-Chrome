# System Patterns

## System Architecture
The EngageIQ Chrome extension follows a modular architecture with clear separation of concerns:

1. **Content Scripts**: Run in the context of web pages to inject and manage UI components
   - Detect appropriate posts/articles on the page
   - Inject comment UI components
   - Handle DOM interactions and observations

2. **Background Script**: Runs in the extension's background context
   - Manages communication between content scripts and other extension components
   - Handles data persistence and retrieval
   - Processes extension-wide events

3. **Popup UI**: Provides quick access to extension features
   - Shows status and configuration options
   - Allows quick actions without opening the full options page

4. **Options Page**: Provides comprehensive configuration
   - User preferences and settings
   - Advanced configuration options

## Key Technical Decisions
- **React & TypeScript**: Used for building maintainable UI components with type safety
- **MobX**: For state management in more complex UI components
- **Service-based Architecture**: Specialized services with clear interfaces for maintainability
- **Factory Pattern**: Service instantiation via ServiceFactory to manage dependencies
- **Observer Pattern**: DOMObserver to detect changes and trigger appropriate actions
- **Local Storage**: For persisting comments and user preferences
- **Tailwind CSS**: For consistent styling with utility classes

## Design Patterns in Use
- **Factory Pattern**: ServiceFactory creates and manages service instances
- **Observer Pattern**: DOMObserver monitors DOM changes
- **Dependency Injection**: Services receive dependencies through constructors
- **Interface Segregation**: Small, focused interfaces in the services/interfaces directory
- **Service Locator**: For obtaining service instances throughout the application
- **Strategy Pattern**: Different strategies for post detection and comment insertion

## Component Relationships
- **Content Script Entry Point**: Initializes and coordinates services
  - PostDetector identifies appropriate content
  - CommentInserter injects UI components
  - DOMObserver monitors for dynamic content changes
  - MessageHandler facilitates communication with background script

- **UI Components**:
  - CommentDisplay renders existing comments
  - CommentFieldEnhancer provides the comment input interface
  - Both use ThemeDetector to adapt to the website's theme

- **Service Hierarchy**:
  - ServiceFactory initializes and provides access to services
  - Logger provides consistent logging throughout the extension
  - DOMUtils provides utility methods for DOM manipulation
