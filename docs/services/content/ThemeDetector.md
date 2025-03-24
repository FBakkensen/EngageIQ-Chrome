# ThemeDetector Analysis

## Service Overview
The `ThemeDetector` service detects whether LinkedIn is using a light or dark theme. It provides this information to other services for ensuring visual consistency of UI elements.

**File Location:** `src/content/services/ThemeDetector.ts`  
**Line Count:** 29 lines  
**Interface:** None  

## Responsibilities
- Detect LinkedIn's current theme (light or dark)
- Provide theme information to other services
- Update theme detection when the theme changes
- Listen for theme changes in the DOM
- Provide CSS class names appropriate for the current theme

## Dependencies
- **DOMUtils**: Indirectly for DOM operations
- **Browser DOM API**: For detecting theme-related elements

## SOLID Violations

### Single Responsibility Principle (SRP) - LOW
The service is well-focused on theme detection.

### Open/Closed Principle (OCP) - LOW
Limited extensibility, but the service has a narrow focus.

### Dependency Inversion Principle (DIP) - MODERATE
- No interface defined, making it difficult to substitute for testing
- No dependency injection mechanism

## Specific Code Issues

### Issue 1: No Interface Definition
The service lacks an interface:

```typescript
// No interface, just concrete implementation
export class ThemeDetector {
  private isDarkTheme: boolean = false;
  
  constructor() {
    this.detectTheme();
    // Setup detection on document loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.detectTheme());
    }
  }
  
  // Methods...
}
```

### Issue 2: Hard-Coded Theme Detection
Hard-coded logic for theme detection:

```typescript
/**
 * Detect the current LinkedIn theme
 */
private detectTheme(): void {
  // Check for dark theme by looking for specific dark mode class or attribute
  const bodyClasses = document.body.classList;
  this.isDarkTheme = bodyClasses.contains('theme--dark') || 
                    document.documentElement.getAttribute('data-theme') === 'dark';
  
  console.log(`Theme detected: ${this.isDarkTheme ? 'dark' : 'light'}`);
}
```

### Issue 3: Limited Theme Change Detection
No automatic updating when theme changes:

```typescript
// No MutationObserver or event listeners for theme changes
// Only detects on initial load
constructor() {
  this.detectTheme();
  // Setup detection on document loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => this.detectTheme());
  }
}
```

## Refactoring Recommendations

### 1. Create Interface and Implementation
Create an interface for the theme detector:

```typescript
export enum Theme {
  Light = 'light',
  Dark = 'dark'
}

export interface IThemeDetector {
  getCurrentTheme(): Theme;
  isDarkTheme(): boolean;
  isLightTheme(): boolean;
  getThemeClass(lightClass: string, darkClass: string): string;
  onThemeChange(callback: (theme: Theme) => void): void;
}

export class ThemeDetector implements IThemeDetector {
  // Implementation
}
```

### 2. Implement Theme Change Detection
Add active monitoring for theme changes:

```typescript
export class ThemeDetector implements IThemeDetector {
  private currentTheme: Theme = Theme.Light;
  private observers: ((theme: Theme) => void)[] = [];
  private mutationObserver: MutationObserver;
  
  constructor() {
    this.detectTheme();
    
    // Setup MutationObserver to detect theme changes
    this.mutationObserver = new MutationObserver(() => {
      const previousTheme = this.currentTheme;
      this.detectTheme();
      
      if (previousTheme !== this.currentTheme) {
        this.notifyObservers();
      }
    });
    
    // Start observing once DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.startObserving());
    } else {
      this.startObserving();
    }
  }
  
  private startObserving(): void {
    this.mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });
    this.mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
  
  private notifyObservers(): void {
    for (const observer of this.observers) {
      observer(this.currentTheme);
    }
  }
  
  onThemeChange(callback: (theme: Theme) => void): void {
    this.observers.push(callback);
  }
}
```

### 3. Implement Strategy Pattern for Theme Detection
Use strategy pattern for different theme detection approaches:

```typescript
export interface IThemeDetectionStrategy {
  detectTheme(): Theme;
}

export class LinkedInThemeDetectionStrategy implements IThemeDetectionStrategy {
  detectTheme(): Theme {
    const bodyClasses = document.body.classList;
    const isDark = bodyClasses.contains('theme--dark') || 
                 document.documentElement.getAttribute('data-theme') === 'dark';
    return isDark ? Theme.Dark : Theme.Light;
  }
}

export class MediaQueryThemeDetectionStrategy implements IThemeDetectionStrategy {
  detectTheme(): Theme {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? Theme.Dark
      : Theme.Light;
  }
}

export class ThemeDetector implements IThemeDetector {
  constructor(private detectionStrategy: IThemeDetectionStrategy) {
    // Implementation using strategy
  }
}
```

### 4. Add Theme Event System
Create an event-based system for theme changes:

```typescript
export interface ThemeChangeEvent {
  previousTheme: Theme;
  currentTheme: Theme;
  timestamp: number;
}

export class ThemeDetector implements IThemeDetector {
  // Add event methods
  
  addEventListener(callback: (event: ThemeChangeEvent) => void): void {
    // Implementation
  }
  
  removeEventListener(callback: (event: ThemeChangeEvent) => void): void {
    // Implementation
  }
}
```

## Implementation Plan
1. Create IThemeDetector interface
2. Implement MutationObserver for theme changes
3. Create theme detection strategies
4. Add theme change event system
5. Update existing code to use the new detector
6. Add unit tests

## Estimated Effort
- **Level**: Low
- **Time**: 0.5 days
- **Risk**: Low
- **Testing Needs**: Unit tests with simulated theme changes 