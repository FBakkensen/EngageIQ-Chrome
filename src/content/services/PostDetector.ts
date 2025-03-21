import { CommentFieldEnhancer } from '../ui/CommentFieldEnhancer';
import { Logger } from './Logger';
import { IPostDetector } from './interfaces/IPostDetector';

/**
 * PostDetector - Service for detecting LinkedIn posts and comment fields
 */
export class PostDetector implements IPostDetector {
  private processedFields: Set<HTMLElement> = new Set();
  private commentFieldEnhancer: CommentFieldEnhancer;
  private logger: Logger;
  
  constructor() {
    this.commentFieldEnhancer = new CommentFieldEnhancer();
    this.logger = new Logger('PostDetector');
  }
  
  /**
   * Scan for LinkedIn posts
   * @returns Number of posts detected
   */
  scanForLinkedInPosts(): number {
    this.logger.info('Scanning for LinkedIn posts');
    
    // Track detected posts
    const detectedPosts = new Set<HTMLElement>();
    
    // Different selectors for LinkedIn posts based on various feed layouts
    const postSelectors = [
      // Feed posts
      '.feed-shared-update-v2',
      '.update-components-update',
      'article.feed-shared-update',
      // Individual post page
      '.ember-view.occludable-update',
      // Articles
      '.article-content',
      // Newer LinkedIn layouts
      'div[data-urn]',
      'div[data-id].feed-shared-update-v2__description-wrapper'
    ];
    
    // Try each selector
    postSelectors.forEach(selector => {
      try {
        const posts = document.querySelectorAll<HTMLElement>(selector);
        this.logger.info(`Found ${posts.length} posts with selector "${selector}"`);
        
        posts.forEach(post => {
          detectedPosts.add(post);
        });
      } catch (e) {
        this.logger.warn(`Error finding posts with selector "${selector}":`, e);
      }
    });
    
    this.logger.info(`Total unique posts detected: ${detectedPosts.size}`);
    return detectedPosts.size;
  }
  
  /**
   * Scan for LinkedIn comment fields
   * @returns Number of comment fields detected
   */
  scanForCommentFields(): number {
    this.logger.info('Scanning for LinkedIn comment fields');
    
    // Feed comment fields (most common)
    const feedCommentSelectors = [
      // Main feed comment input field 
      '.comments-comment-box__form',
      // Comment input field with content editable - more specific
      '[contenteditable="true"][aria-label*="comment"]',
      '[contenteditable="true"][aria-label*="Add a comment"]',
      '[contenteditable="true"][aria-label*="Leave a comment"]',
      '[contenteditable="true"][aria-label*="Reply"]',
      // Alternative comment field structure
      '.comments-comment-texteditor__contenteditable',
      // Post update comment field
      '.update-components-text-editor__container [contenteditable="true"]',
      // Newer LinkedIn comment fields
      '.comments-comment-box [contenteditable="true"]',
      '.comments-comment-texteditor [contenteditable="true"]',
      // Comment form identifiers
      'form.comments-comment-box__form [contenteditable="true"]',
      // Language-agnostic selectors (works across LinkedIn locales)
      'div[role="textbox"][contenteditable="true"]',
      // Even broader matches for contenteditable areas in likely comment areas
      '.comments-comment-box textarea',
      '.artdeco-text-input--input'
    ];
    
    this.logger.info('Looking for comment fields with selectors:', feedCommentSelectors.join(', '));
    
    // Track newly found fields in this scan
    let newFieldsFound = 0;
    
    // Scan for all potential comment fields
    feedCommentSelectors.forEach(selector => {
      try {
        const commentFields = document.querySelectorAll<HTMLElement>(selector);
        this.logger.info(`Found ${commentFields.length} fields with selector "${selector}"`);
        
        commentFields.forEach((field) => {
          // Get detailed field information for logging
          const fieldInfo = {
            tagName: field.tagName,
            className: field.className,
            id: field.id,
            role: field.getAttribute('role') || 'none',
            ariaLabel: field.getAttribute('aria-label') || 'none',
            isHidden: field.offsetParent === null,
            isQlClipboard: field.classList.contains('ql-clipboard'),
            isQlBlank: field.classList.contains('ql-blank'),
            alreadyProcessed: this.processedFields.has(field),
            path: this.getElementPath(field)
          };
          
          this.logger.info(`DETECTION: Field detected with selector "${selector}"`, fieldInfo);
          
          // Skip if already processed
          if (this.processedFields.has(field)) {
            this.logger.info('DETECTION: Skipping already processed field', {id: field.id});
            return;
          }
          
          // Skip clipboard elements - LinkedIn uses these internally but they aren't actual comment fields
          if (field.classList.contains('ql-clipboard')) {
            this.logger.info('DETECTION: Skipping clipboard element', {className: field.className});
            return;
          }
          
          // Skip hidden elements
          if (field.offsetParent === null) {
            this.logger.info('DETECTION: Skipping hidden element', {id: field.id});
            return;
          }
          
          // Skip fields that are not in the viewport or nearby
          const rect = field.getBoundingClientRect();
          const isNearViewport = 
            rect.top > -500 && 
            rect.left > -500 && 
            rect.right < (window.innerWidth + 500) && 
            rect.bottom < (window.innerHeight + 500);
            
          if (!isNearViewport) {
            this.logger.info('DETECTION: Skipping element not near viewport', {
              id: field.id,
              position: {top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right}
            });
            return;
          }
          
          this.logger.info(`DETECTION: Found new comment field with selector "${selector}"`);
          
          // Add to processed set
          this.processedFields.add(field);
          newFieldsFound++;
          
          // Enhance the field (in a real implementation, would add buttons, etc.)
          this.enhanceCommentField(field);
        });
      } catch (e) {
        this.logger.warn(`Error finding comment fields with selector "${selector}":`, e);
      }
    });
    
    this.logger.info(`Found ${newFieldsFound} new comment fields`);
    return this.processedFields.size;
  }
  
  /**
   * Get the number of processed comment fields
   */
  getCommentFieldsCount(): number {
    return this.processedFields.size;
  }
  
  /**
   * Enhance a comment field with EngageIQ functionality
   * @param field The comment field to enhance
   */
  private enhanceCommentField(field: HTMLElement): void {
    // Use the CommentFieldEnhancer to enhance the field
    const fieldId = this.commentFieldEnhancer.enhanceCommentField(field);
    this.logger.info(`Enhanced comment field: ${fieldId}`);
  }
  
  /**
   * Get a simplified DOM path for an element
   * @param element The element to get the path for
   * @returns A string representation of the element's path
   */
  private getElementPath(element: HTMLElement): string {
    let path = [];
    let currentElem = element;
    
    while (currentElem && currentElem !== document.body) {
      let selector = currentElem.tagName.toLowerCase();
      
      if (currentElem.id) {
        selector += `#${currentElem.id}`;
      } else if (currentElem.className) {
        const classes = Array.from(currentElem.classList).join('.');
        if (classes) {
          selector += `.${classes}`;
        }
      }
      
      path.unshift(selector);
      currentElem = currentElem.parentElement as HTMLElement;
      
      // Limit path length to prevent excessive logging
      if (path.length > 4) {
        path.unshift('...');
        break;
      }
    }
    
    return path.join(' > ');
  }
}