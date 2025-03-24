# Logger Analysis

## Service Overview
The `Logger` service provides consistent logging functionality across the extension. It wraps the browser's console methods with additional context like prefixes and log levels.

**File Location:** `src/content/services/Logger.ts`  
**Line Count:** 33 lines  
**Interface:** None  

## Responsibilities
- Provide consistent logging across the extension
- Add context (prefixes) to log messages
- Support different log levels (info, warn, error)
- Conditionally enable/disable logging based on environment
- Format log output for better readability

## Dependencies
- **Browser Console API**: For actual logging output

## SOLID Violations

### Single Responsibility Principle (SRP) - LOW
The service is well-focused on logging functionality.

### Open/Closed Principle (OCP) - MODERATE
- Limited extensibility for different log formats or destinations
- Adding new logging functionality requires modifying the service
- No plugin mechanism for log processors or formatters

### Dependency Inversion Principle (DIP) - MODERATE
- No interface defined, making it difficult to substitute for testing
- Direct dependency on browser console
- No abstraction for log output destination

## Specific Code Issues

### Issue 1: No Interface Definition
The service lacks an interface:

```typescript
// No interface, just concrete implementation
export class Logger {
  private prefix: string;
  
  constructor(prefix: string) {
    this.prefix = prefix;
  }
  
  // Logging methods...
}
```

### Issue 2: Direct Console Dependency
Direct coupling to browser console:

```typescript
info(message: string, ...args: any[]): void {
  console.info(`[${this.prefix}] ${message}`, ...args);
}

warn(message: string, ...args: any[]): void {
  console.warn(`[${this.prefix}] ${message}`, ...args);
}

error(message: string, ...args: any[]): void {
  console.error(`[${this.prefix}] ${message}`, ...args);
}
```

### Issue 3: Limited Configurability
Lack of configuration options:

```typescript
constructor(prefix: string) {
  this.prefix = prefix;
  // No options for:
  // - Log level filtering
  // - Output format
  // - Destination
  // - Timestamp format
}
```

## Refactoring Recommendations

### 1. Create Interface and Implementation
Create an interface for the logger:

```typescript
export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3
}

export interface ILogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  setLevel(level: LogLevel): void;
}

export class Logger implements ILogger {
  // Implementation
}
```

### 2. Implement Log Output Abstraction
Create an abstraction for log output:

```typescript
export interface ILogOutput {
  write(level: LogLevel, prefix: string, message: string, args: any[]): void;
}

export class ConsoleLogOutput implements ILogOutput {
  write(level: LogLevel, prefix: string, message: string, args: any[]): void {
    const formattedMessage = `[${prefix}] ${message}`;
    
    switch (level) {
      case LogLevel.Debug:
        console.debug(formattedMessage, ...args);
        break;
      case LogLevel.Info:
        console.info(formattedMessage, ...args);
        break;
      case LogLevel.Warn:
        console.warn(formattedMessage, ...args);
        break;
      case LogLevel.Error:
        console.error(formattedMessage, ...args);
        break;
    }
  }
}

// Can be extended for other output destinations (file, remote logging, etc.)
```

### 3. Add Log Level Filtering
Implement log level filtering:

```typescript
export class Logger implements ILogger {
  private level: LogLevel;
  
  constructor(
    private prefix: string,
    private output: ILogOutput,
    level: LogLevel = LogLevel.Info
  ) {
    this.prefix = prefix;
    this.output = output;
    this.level = level;
  }
  
  setLevel(level: LogLevel): void {
    this.level = level;
  }
  
  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.Info) {
      this.output.write(LogLevel.Info, this.prefix, message, args);
    }
  }
  
  // Other logging methods with similar checks
}
```

### 4. Implement Log Message Formatting
Create customizable log formatting:

```typescript
export interface ILogFormatter {
  format(level: LogLevel, prefix: string, message: string): string;
}

export class DefaultLogFormatter implements ILogFormatter {
  format(level: LogLevel, prefix: string, message: string): string {
    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level].toUpperCase();
    return `[${timestamp}] [${prefix}] [${levelStr}] ${message}`;
  }
}

// Use formatter in logger
export class Logger implements ILogger {
  constructor(
    private prefix: string,
    private output: ILogOutput,
    private formatter: ILogFormatter,
    level: LogLevel = LogLevel.Info
  ) {
    // Implementation
  }
  
  // Use formatter in logging methods
}
```

## Implementation Plan
1. Create ILogger interface
2. Implement log output abstraction
3. Add log level filtering
4. Create log message formatter
5. Update existing code to use the new logger
6. Add unit tests

## Estimated Effort
- **Level**: Low
- **Time**: 0.5 days
- **Risk**: Low
- **Testing Needs**: Unit tests for various log configurations 