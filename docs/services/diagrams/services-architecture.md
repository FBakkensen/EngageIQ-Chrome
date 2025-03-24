# Current Service Architecture

This diagram represents the current service architecture of the EngageIQ Chrome Extension, showing the relationships and dependencies between services.

```mermaid
graph TD
    %% Service Categories
    subgraph background["Background Services"]
        apiKey["ApiKeyService"]
        commentGen["CommentGenerationService"]
        userPrefs["UserPreferencesService"]
    end

    subgraph content["Content Services"]
        serviceFactory["ServiceFactory"]
        msgHandler["MessageHandler"]
        postDetector["PostDetector"]
        commentInserter["CommentInserter"]
        domObserver["DOMObserver"]
        logger["Logger"]
        themeDetector["ThemeDetector"]
    end

    subgraph ui["UI Components"]
        commentDisplay["CommentDisplay"]
        commentFieldEnh["CommentFieldEnhancer"]
    end

    subgraph utils["Utility Services"]
        domUtils["DOMUtils"]
        errorHandler["ErrorHandler"]
    end

    %% Service Factory dependencies
    serviceFactory -->|creates| msgHandler
    serviceFactory -->|creates| postDetector
    serviceFactory -->|creates| commentInserter
    serviceFactory -->|creates| domObserver
    serviceFactory -->|creates| logger
    serviceFactory -->|creates| themeDetector
    serviceFactory -->|creates| commentDisplay

    %% Background service dependencies
    commentGen -->|uses| apiKey
    commentGen -->|uses| userPrefs
    commentGen -->|uses| errorHandler

    %% Content service dependencies
    msgHandler -->|uses| commentInserter
    msgHandler -->|uses| postDetector
    msgHandler -->|calls| commentGen
    postDetector -->|uses| domUtils
    postDetector -->|uses| logger
    commentInserter -->|uses| domUtils
    commentInserter -->|uses| logger
    domObserver -->|calls| postDetector
    
    %% UI component dependencies
    commentDisplay -->|uses| commentInserter
    commentDisplay -->|uses| themeDetector
    commentDisplay -->|uses| userPrefs
    commentFieldEnh -->|uses| msgHandler
    commentFieldEnh -->|uses| themeDetector
    commentFieldEnh -->|uses| serviceFactory
    commentFieldEnh -->|uses| domUtils

    %% Communication flows
    commentFieldEnh -.->|triggers| msgHandler
    msgHandler -.->|messages| commentGen
    commentGen -.->|responds with| commentDisplay
    commentDisplay -.->|inserts via| commentInserter
```

## Key Architecture Issues

1. **ServiceFactory Centralization**
   - ServiceFactory creates and manages all content services, creating a central dependency
   - No abstractions for many services, making testing difficult
   - UI components directly access ServiceFactory

2. **Mixed Responsibilities**
   - CommentGenerationService handles multiple responsibilities (prompt generation, API communication, formatting)
   - UI components have business logic embedded (CommentDisplay, CommentFieldEnhancer)
   - MessageHandler mixes communication and business logic

3. **Limited Interface Usage**
   - Only some services have interfaces (CommentInserter, PostDetector, CommentDisplay)
   - Static utility classes prevent proper testing (DOMUtils, ErrorHandler)
   - No dependency injection for most services

4. **Hard-Coded Dependencies**
   - Direct dependencies on Chrome API and DOM structure
   - Hard-coded selectors for LinkedIn elements
   - Limited extensibility for new functionality

## Proposed Architecture

A future architecture diagram will be created showing how the refactored services will interact with proper interfaces and cleaner separation of concerns. 