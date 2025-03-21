/**
 * Logger service for consistent logging across the extension
 */
export class Logger {
  constructor(private prefix: string) {}
  
  /**
   * Log an informational message
   * @param message The message to log
   * @param data Optional data to include
   */
  info(message: string, data?: any): void {
    console.log(`⭐ EngageIQ.${this.prefix}: ${message}`, data !== undefined ? data : '');
  }
  
  /**
   * Log a warning message
   * @param message The message to log
   * @param data Optional data to include
   */
  warn(message: string, data?: any): void {
    console.warn(`⚠️ EngageIQ.${this.prefix}: ${message}`, data !== undefined ? data : '');
  }
  
  /**
   * Log an error message
   * @param message The message to log
   * @param data Optional data to include
   */
  error(message: string, data?: any): void {
    console.error(`❌ EngageIQ.${this.prefix}: ${message}`, data !== undefined ? data : '');
  }
}