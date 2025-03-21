import { Logger } from './Logger';

/**
 * DOMObserver - Service for observing DOM changes in LinkedIn
 */
export class DOMObserver {
  private observer: MutationObserver;
  // @ts-ignore (Intentionally unused - would be used in full implementation)
  private processedFields: Set<HTMLElement>;
  private logger: Logger;
  
  constructor(
    private onPostsDetected: () => void,
    private onCommentFieldsDetected: () => void
  ) {
    this.processedFields = new Set<HTMLElement>();
    this.logger = new Logger('DOMObserver');
    
    // Create mutation observer
    this.observer = new MutationObserver(
      this.debounce((mutations: MutationRecord[]) => {
        this.logger.info('Detected DOM changes:', mutations.length);
        this.onPostsDetected();
        this.onCommentFieldsDetected();
      }, 500)
    );
  }
  
  /**
   * Start observing DOM changes
   */
  startObserving(): void {
    // Observe the entire body
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    this.logger.info('Started observing DOM changes');
    
    // Also observe scroll events as LinkedIn loads content dynamically when scrolling
    window.addEventListener('scroll', this.debounce(() => {
      this.logger.info('Scroll event detected, scanning for new content');
      this.onPostsDetected();
    }, 1000));
    
    // Watch for LinkedIn's view changes that might trigger new content
    window.addEventListener('pushstate', this.debounce(() => {
      this.logger.info('Navigation detected (pushstate), scanning for new content');
      setTimeout(() => {
        this.onPostsDetected();
        this.onCommentFieldsDetected();
      }, 1000); // Wait for the DOM to update
    }, 500));
    
    // Also listen for click events on LinkedIn's navigation items that don't trigger pushstate
    document.addEventListener('click', this.debounce((e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const navItem = target.closest('a[href^="/"], button[data-control-name]');
      
      if (navItem) {
        this.logger.info('Navigation action detected, scheduling scan');
        setTimeout(() => {
          this.onPostsDetected();
          this.onCommentFieldsDetected();
        }, 1500); // Wait longer for navigation to complete
      }
    }, 500));
  }
  
  /**
   * Stop observing DOM changes
   */
  stopObserving(): void {
    this.observer.disconnect();
    this.logger.info('Stopped observing DOM changes');
  }
  
  /**
   * Simple debounce implementation for event handlers
   */
  private debounce(func: Function, wait: number) {
    let timeout: number | null = null;
    return (...args: any[]) => {
      const later = () => {
        timeout = null;
        func(...args);
      };
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = window.setTimeout(later, wait);
    };
  }
}