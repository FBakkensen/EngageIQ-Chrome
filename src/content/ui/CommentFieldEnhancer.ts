import { Logger } from '../services/Logger';

/**
 * CommentFieldEnhancer - Enhances LinkedIn comment fields with EngageIQ functionality
 */
export class CommentFieldEnhancer {
  private logger: Logger;
  
  constructor() {
    this.logger = new Logger('CommentFieldEnhancer');
  }
  
  /**
   * Enhance a comment field with EngageIQ features
   * @param field The comment field to enhance
   * @returns The ID of the enhanced field
   */
  enhanceCommentField(field: HTMLElement): string {
    this.logger.info('ENHANCEMENT: Enhancing comment field', {
      tagName: field.tagName,
      className: field.className,
      id: field.id,
      role: field.getAttribute('role'),
      ariaLabel: field.getAttribute('aria-label'),
      placeholder: field.getAttribute('placeholder')
    });
    
    // Ensure the field has an ID
    if (!field.id) {
      field.id = `engageiq-field-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    }
    
    // Check if this field already has a button
    const existingButton = document.querySelector(`button[data-field-id="${field.id}"]`);
    if (existingButton) {
      this.logger.info('ENHANCEMENT: Field already has a button, skipping enhancement', {
        existingButtonId: existingButton.id,
        fieldId: field.id
      });
      return field.id;
    }
    
    // Debug parent-child relationships for nested fields
    let parent = field.parentElement;
    let parentChain = [];
    while (parent && parentChain.length < 3) {
      parentChain.push({
        tagName: parent.tagName,
        className: parent.className,
        id: parent.id
      });
      parent = parent.parentElement;
    }
    
    this.logger.info('ENHANCEMENT: Field parents:', parentChain);
    
    // Check if field is inside an existing processed field
    for (const processedField of document.querySelectorAll('[id^="engageiq-field-"]')) {
      if (processedField !== field && processedField.contains(field)) {
        this.logger.info('ENHANCEMENT: Field is inside already processed field, skipping', {
          fieldId: field.id,
          processedFieldId: processedField.id
        });
        return field.id;
      }
    }
    
    // Create "Generate Comment" button
    const button = this.createGenerateButton(field);
    
    // Position the button near the comment field
    this.positionButton(button, field);
    
    // Attach event listeners
    this.attachEventListeners(button, field);
    
    this.logger.info('ENHANCEMENT: Field enhanced with ID:', field.id);
    return field.id;
  }
  
  /**
   * Create a generate comment button
   */
  private createGenerateButton(field: HTMLElement): HTMLElement {
    const button = document.createElement('button');
    button.className = 'engageiq-generate-button';
    button.textContent = 'Generate Comment';
    button.setAttribute('data-field-id', field.id);
    
    // Style the button to match LinkedIn's design
    button.style.cssText = `
      background-color: #0a66c2;
      color: white;
      border: none;
      border-radius: 16px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
      position: absolute;
      z-index: 1000;
    `;
    
    // Hover effects
    button.addEventListener('mouseover', () => {
      button.style.backgroundColor = '#004182';
    });
    
    button.addEventListener('mouseout', () => {
      button.style.backgroundColor = '#0a66c2';
    });
    
    return button;
  }
  
  /**
   * Position the button relative to the comment field
   */
  private positionButton(button: HTMLElement, field: HTMLElement): void {
    const fieldRect = field.getBoundingClientRect();
    
    // Position at top-right of the field
    button.style.top = `${window.scrollY + fieldRect.top - 40}px`;
    button.style.left = `${window.scrollX + fieldRect.right - 150}px`;
    
    // Append to document body for absolute positioning
    document.body.appendChild(button);
  }
  
  /**
   * Attach event listeners to the button
   */
  private attachEventListeners(button: HTMLElement, field: HTMLElement): void {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      this.logger.info('Generate button clicked for field:', field.id);
      
      // Extract post content
      const postContent = this.extractPostContent(field);
      
      // Send message to background script to generate comment
      chrome.runtime.sendMessage({
        type: 'GENERATE_COMMENT',
        payload: {
          fieldId: field.id,
          postContent,
          options: {
            tone: 'all',
            length: 'medium'
          }
        }
      }, (response) => {
        this.logger.info('Generate comment response:', response);
        
        // For debugging - we should now receive a COMMENT_GENERATED message from background script
        this.logger.info('Waiting for COMMENT_GENERATED message...');
      });
    });
  }
  
  /**
   * Extract content from the post containing this comment field
   */
  private extractPostContent(field: HTMLElement): any {
    // Find closest post containing this comment field
    const post = field.closest('.feed-shared-update-v2') || 
                field.closest('article') || 
                field.closest('.ember-view.occludable-update');
    
    if (!post) {
      this.logger.info('Could not find post for comment field');
      return { text: 'Unknown post content' };
    }
    
    // Extract text content (simplified)
    const textElement = post.querySelector('.feed-shared-update-v2__description-wrapper') || 
                      post.querySelector('.update-components-text');
    
    const text = textElement ? textElement.textContent?.trim() : 'No text content found';
    
    // Extract author info
    const authorElement = post.querySelector('.feed-shared-actor__name') || 
                         post.querySelector('.update-components-actor__name');
    
    const author = authorElement ? authorElement.textContent?.trim() : 'Unknown author';
    
    this.logger.info('Extracted post content:', { author, text });
    
    return {
      author,
      text,
      url: window.location.href
    };
  }
}