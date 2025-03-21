/**
 * Utility functions for DOM manipulation
 */
export class DOMUtils {
  /**
   * Create an element with styles
   * @param tag HTML element tag name
   * @param styles CSS styles as an object
   * @param attributes HTML attributes to set
   * @returns The created HTML element
   */
  static createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    styles?: Partial<CSSStyleDeclaration>,
    attributes?: Record<string, string>
  ): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);
    
    // Apply styles if provided
    if (styles) {
      Object.assign(element.style, styles);
    }
    
    // Apply attributes if provided
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }
    
    return element;
  }
  
  /**
   * Simple debounce implementation for event handlers
   * @param func The function to debounce
   * @param wait The wait time in milliseconds
   * @returns Debounced function
   */
  static debounce(func: Function, wait: number) {
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
  
  /**
   * Find closest element matching a selector
   * @param element The starting element
   * @param selectors Array of selectors to try
   * @returns The closest matching element or null
   */
  static closest(element: HTMLElement, selectors: string[]): HTMLElement | null {
    for (const selector of selectors) {
      const match = element.closest(selector);
      if (match) {
        return match as HTMLElement;
      }
    }
    return null;
  }
  
  /**
   * Position an element relative to another element
   * @param element The element to position
   * @param target The target element to position relative to
   * @param position The position ('top', 'bottom', 'left', 'right')
   * @param offset Optional offset in pixels
   */
  static positionElement(
    element: HTMLElement,
    target: HTMLElement,
    position: 'top' | 'bottom' | 'left' | 'right',
    offset: number = 8
  ): void {
    const targetRect = target.getBoundingClientRect();
    
    switch (position) {
      case 'top':
        element.style.top = `${window.scrollY + targetRect.top - element.offsetHeight - offset}px`;
        element.style.left = `${window.scrollX + targetRect.left}px`;
        break;
      case 'bottom':
        element.style.top = `${window.scrollY + targetRect.bottom + offset}px`;
        element.style.left = `${window.scrollX + targetRect.left}px`;
        break;
      case 'left':
        element.style.top = `${window.scrollY + targetRect.top}px`;
        element.style.left = `${window.scrollX + targetRect.left - element.offsetWidth - offset}px`;
        break;
      case 'right':
        element.style.top = `${window.scrollY + targetRect.top}px`;
        element.style.left = `${window.scrollX + targetRect.right + offset}px`;
        break;
    }
  }
}