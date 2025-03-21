/**
 * Error handling utilities for the extension
 */

export interface IErrorHandler {
  handleError(error: Error | string, context?: string): void;
  reportError(error: Error | string, context?: string): Promise<void>;
  shouldReportError(errorMessage: string): boolean;
}

/**
 * Central error handling service for the extension
 */
export const ErrorHandler: IErrorHandler = {
  /**
   * Handles errors by logging and optionally reporting
   */
  handleError(error: Error | string, context: string = 'General'): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error(`EngageIQ Error [${context}]:`, errorMessage);
    
    if (errorStack) {
      console.debug('Error stack:', errorStack);
    }
    
    // In production, you might want to report errors to a service
    if (this.shouldReportError(errorMessage)) {
      this.reportError(error, context).catch(e => {
        console.error('Error reporting failed:', e);
      });
    }
  },
  
  /**
   * Reports errors to a service (stub implementation)
   */
  async reportError(error: Error | string, context: string = 'General'): Promise<void> {
    // This would connect to an error reporting service in production
    // For now, just log to console
    console.debug(`[Would report error] ${context}: ${typeof error === 'string' ? error : error.message}`);
  },
  
  /**
   * Determines if an error should be reported
   */
  shouldReportError(errorMessage: string): boolean {
    // Exclude common errors that don't need reporting
    const ignorePatterns = [
      'extension context invalidated',
      'API key not configured',
      'The message port closed'
    ];
    
    return !ignorePatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }
};