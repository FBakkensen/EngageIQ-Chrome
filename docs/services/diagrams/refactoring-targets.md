# Refactoring Targets: Before and After

This document visualizes the key refactoring targets in the EngageIQ Chrome Extension, showing the current architecture compared to the proposed refactored architecture.

## CommentGenerationService Refactoring

The `CommentGenerationService` will be split into smaller, focused services with clear responsibilities.

### Before

```mermaid
graph TD
    commentGen["CommentGenerationService"]
    apiKey["ApiKeyService"]
    userPrefs["UserPreferencesService"]
    errorHandler["ErrorHandler"]
    
    commentGen -->|validates via| apiKey
    commentGen -->|gets preferences from| userPrefs
    commentGen -->|logs errors via| errorHandler
    
    subgraph responsibilities["Mixed Responsibilities"]
        prompt["Prompt Engineering"]
        api["API Communication"]
        parsing["Response Parsing"]
        formatting["Comment Formatting"]
        errors["Error Handling"]
    end
    
    commentGen --- prompt
    commentGen --- api
    commentGen --- parsing
    commentGen --- formatting
    commentGen --- errors
```

### After

```mermaid
graph TD
    %% New Service Interfaces
    IPromptGen["IPromptGenerationService"]
    IAiApi["IAiApiService"]
    ICommentFormat["ICommentFormattingService"]
    IImageProc["IImageProcessingService"]
    
    %% Concrete Implementations
    promptGen["PromptGenerationService"]
    geminiApi["GeminiApiService"]
    commentFormat["CommentFormattingService"]
    imageProc["ImageProcessingService"]
    
    %% Existing Services
    apiKey["IApiKeyService"]
    userPrefs["IUserPreferencesService"]
    errorHandler["IErrorHandler"]
    
    %% Implementations
    promptGen -.->|implements| IPromptGen
    geminiApi -.->|implements| IAiApi
    commentFormat -.->|implements| ICommentFormat
    imageProc -.->|implements| IImageProc
    
    %% Service Dependencies
    geminiApi -->|uses| apiKey
    promptGen -->|uses| userPrefs
    promptGen -->|uses| imageProc
    
    %% Coordinator
    commentGenCoord["CommentGenerationCoordinator"]
    
    commentGenCoord -->|uses| IPromptGen
    commentGenCoord -->|uses| IAiApi
    commentGenCoord -->|uses| ICommentFormat
    commentGenCoord -->|uses| IImageProc
    commentGenCoord -->|uses| errorHandler
```

## UI Component Refactoring

The UI components will be refactored to separate business logic from UI rendering.

### Before

```mermaid
graph TD
    %% UI Components
    commentDisplay["CommentDisplay"]
    commentFieldEnh["CommentFieldEnhancer"]
    
    %% Dependencies
    serviceFactory["ServiceFactory"]
    commentInserter["CommentInserter"]
    themeDetector["ThemeDetector"]
    msgHandler["MessageHandler"]
    
    %% Direct Dependencies
    commentDisplay -->|direct dependency| serviceFactory
    commentDisplay -->|uses| commentInserter
    commentDisplay -->|uses| themeDetector
    
    commentFieldEnh -->|direct dependency| serviceFactory
    commentFieldEnh -->|uses| msgHandler
    commentFieldEnh -->|uses| themeDetector
    
    %% Mixed Responsibilities
    subgraph displayMixed["CommentDisplay Mixed Responsibilities"]
        displayUI["UI Rendering"]
        displayState["State Management"]
        displayBusiness["Business Logic"]
    end
    
    subgraph enhancerMixed["CommentFieldEnhancer Mixed Responsibilities"]
        enhancerUI["UI Rendering"]
        enhancerState["State Management"]
        enhancerBusiness["Business Logic"]
    end
    
    commentDisplay --- displayMixed
    commentFieldEnh --- enhancerMixed
```

### After

```mermaid
graph TD
    %% UI Components
    commentDisplayComp["CommentDisplayComponent"]
    commentFieldEnhComp["CommentFieldEnhancerComponent"]
    
    %% Service Interfaces
    ICommentDisplaySvc["ICommentDisplayService"]
    ICommentFieldEnhSvc["ICommentFieldEnhancerService"]
    
    %% State Management
    IDisplayState["ICommentDisplayStateManager"]
    IEnhancerState["IButtonStateManager"]
    
    %% Service Implementations
    commentDisplaySvc["CommentDisplayService"]
    commentFieldEnhSvc["CommentFieldEnhancerService"]
    
    %% Implementations
    commentDisplaySvc -.->|implements| ICommentDisplaySvc
    commentFieldEnhSvc -.->|implements| ICommentFieldEnhSvc
    
    %% Dependencies
    ICommentInserter["ICommentInserter"]
    IThemeDetector["IThemeDetector"]
    IMessageHandler["IMessageHandler"]
    
    %% Component Dependencies
    commentDisplayComp -->|uses| ICommentDisplaySvc
    commentDisplayComp -->|uses| IDisplayState
    
    commentFieldEnhComp -->|uses| ICommentFieldEnhSvc
    commentFieldEnhComp -->|uses| IEnhancerState
    
    %% Service Dependencies
    commentDisplaySvc -->|uses| ICommentInserter
    commentDisplaySvc -->|uses| IThemeDetector
    
    commentFieldEnhSvc -->|uses| IMessageHandler
    commentFieldEnhSvc -->|uses| IThemeDetector
```

## ServiceFactory Refactoring

The ServiceFactory will be redesigned to support dependency injection and interfaces.

### Before

```mermaid
graph TD
    %% ServiceFactory
    serviceFactory["ServiceFactory"]
    
    %% Services
    commentInserter["CommentInserter"]
    commentDisplay["CommentDisplay"]
    postDetector["PostDetector"]
    msgHandler["MessageHandler"]
    domObserver["DOMObserver"]
    logger["Logger"]
    themeDetector["ThemeDetector"]
    
    %% Direct Creation
    serviceFactory -->|creates| commentInserter
    serviceFactory -->|creates| commentDisplay
    serviceFactory -->|creates| postDetector
    serviceFactory -->|creates| msgHandler
    serviceFactory -->|creates| domObserver
    serviceFactory -->|creates| logger
    serviceFactory -->|creates| themeDetector
    
    %% Singleton
    serviceFactory -.->|singleton| serviceFactory
    
    %% Hard-coded Dependencies
    msgHandler -->|depends on| commentInserter
    msgHandler -->|depends on| postDetector
    domObserver -->|depends on| postDetector
```

### After

```mermaid
graph TD
    %% ServiceFactory Interface
    IServiceFactory["IServiceFactory"]
    
    %% Service Interfaces
    ICommentInserter["ICommentInserter"]
    ICommentDisplay["ICommentDisplay"]
    IPostDetector["IPostDetector"]
    IMessageHandler["IMessageHandler"]
    IDOMObserver["IDOMObserver"]
    ILogger["ILogger"]
    IThemeDetector["IThemeDetector"]
    
    %% ServiceFactory Implementation
    serviceFactory["ServiceFactory"]
    serviceFactory -.->|implements| IServiceFactory
    
    %% Registration
    IServiceFactory -->|registers/creates| ICommentInserter
    IServiceFactory -->|registers/creates| ICommentDisplay
    IServiceFactory -->|registers/creates| IPostDetector
    IServiceFactory -->|registers/creates| IMessageHandler
    IServiceFactory -->|registers/creates| IDOMObserver
    IServiceFactory -->|registers/creates| ILogger
    IServiceFactory -->|registers/creates| IThemeDetector
    
    %% Testing Support
    mockFactory["MockServiceFactory"]
    mockFactory -.->|implements| IServiceFactory
    
    %% Service Registration
    register["Service Registration"]
    IServiceFactory -->|provides| register
    
    %% Reset Support
    reset["Factory Reset"]
    IServiceFactory -->|supports| reset
```

These diagrams visualize the key architectural changes that will be implemented as part of the refactoring process, showing how the current monolithic services will be broken down into smaller, more focused components with proper interfaces and dependency injection. 