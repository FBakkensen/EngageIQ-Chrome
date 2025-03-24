# System Patterns

## System Architecture
The EngageIQ Chrome extension follows a modular architecture with clear separation of concerns:

1. **Content Scripts**: Run in the context of LinkedIn pages
   - Detect LinkedIn posts and comment fields
   - Inject UI components (Generate Comment button)
   - Handle DOM interactions and mutations
   - Extract post content (text and images)
   - Insert generated comments into LinkedIn editor

2. **Background Script**: Runs in the extension's background context
   - Manages communication between content scripts and services
   - Handles API key storage and validation
   - Processes Gemini API requests and responses
   - Manages user preferences storage

3. **Popup UI**: Provides quick access to extension features
   - Shows current status and API connection
   - Allows quick access to settings
   - Displays usage statistics

4. **Options Page**: Provides comprehensive configuration
   - API key management and validation
   - Default preferences for comment tone and length
   - Theme preferences
   - Advanced settings

## Key Technical Decisions
- **React & TypeScript**: Used for building maintainable UI components with type safety
- **Gemini AI API**: Used for generating contextually relevant comments
- **Content Script Isolation**: Main functionality runs in isolated context scripts
- **Service-based Architecture**: Specialized services with clear interfaces for maintainability
- **Factory Pattern**: Service instantiation via ServiceFactory to manage dependencies
- **Observer Pattern**: MutationObserver to detect LinkedIn DOM changes
- **Chrome Storage API**: For persisting API keys and user preferences
- **Tailwind CSS**: For consistent styling with utility classes

## Design Patterns in Use
- **Factory Pattern**: ServiceFactory creates and manages service instances
- **Observer Pattern**: MutationObserver monitors LinkedIn DOM changes
- **Dependency Injection**: Services receive dependencies through constructors
- **Adapter Pattern**: Adapting Gemini API responses to internal formats
- **Strategy Pattern**: Different strategies for generating comments based on tone and length
- **Command Pattern**: Encapsulating comment generation requests
- **Mediator Pattern**: Background script mediating between content script and API services

## Component Relationships
- **Content Script Entry Point**: Initializes and coordinates services
  - PostDetector identifies LinkedIn posts
  - CommentFieldDetector finds comment fields
  - ButtonInjector creates and inserts the Generate Comment button
  - MutationObserver monitors for dynamic content changes
  - MessageHandler communicates with background script

- **UI Components**:
  - GenerateCommentButton for initiating comment generation
  - CommentDisplayPopup for showing generated comments
  - ToneSelector for choosing comment tone
  - LengthSelector for selecting comment length
  - All use ThemeDetector to adapt to LinkedIn's theme

- **Service Hierarchy**:
  - ServiceFactory initializes and provides access to services
  - GeminiAPIService handles AI API communication
  - StorageService manages preferences and API keys
  - DOMUtils provides utility methods for LinkedIn DOM manipulation
  - LogService provides consistent logging throughout the extension

## Planned Refactoring
The codebase has been analyzed for refactoring according to SOLID principles to improve maintainability and extensibility. The service analysis and planning phase has been completed, and the following refactoring tasks have been identified:

- **Single Responsibility Principle**: Refactoring services to have a single, well-defined responsibility
  - Breaking down CommentGenerationService into specialized services:
    - IPromptGenerationService: Responsible for creating prompts based on post content
    - IGeminiApiService: Handles communication with Gemini AI API
    - ICommentFormattingService: Formats and structures generated comments
    - IImageProcessingService: Processes images for AI analysis

- **Open/Closed Principle**: Making services extensible without modification
  - Defining clear interfaces for all services
  - Using dependency injection to allow for different implementations
  - Creating a pluggable architecture for new features

- **Liskov Substitution Principle**: Ensuring implementations are substitutable for their interfaces
  - Creating proper inheritance hierarchies for services
  - Ensuring child classes respect the contracts of parent classes
  - Implementing thorough test cases to verify substitutability

- **Interface Segregation**: Creating focused interfaces rather than general-purpose ones
  - Breaking down large interfaces into smaller, more specific ones
  - Ensuring components only depend on interfaces they actually use
  - Analyzing and refactoring existing interfaces for better focus

- **Dependency Inversion**: Making high-level modules depend on abstractions
  - Enhancing ServiceFactory to better manage dependencies
  - Implementing proper lifecycle management for services
  - Moving from direct service instantiation to dependency injection

The next steps in the refactoring process include:
1. Establishing comprehensive test infrastructure to ensure refactoring preserves behavior
2. Enhancing the ServiceFactory for better dependency management
3. Refactoring the CommentGenerationService into specialized components
4. Refactoring UI components that contain business logic
