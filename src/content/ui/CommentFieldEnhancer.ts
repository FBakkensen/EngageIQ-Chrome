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
    
    // Make button visible by default
    button.style.display = 'block';
    
    // Add focus and blur event listeners to manage button
    this.attachFieldFocusEvents(button, field);
    
    this.logger.info('ENHANCEMENT: Field enhanced with ID:', field.id);
    return field.id;
  }
  
  /**
   * Create a generate comment button
   */
  private createGenerateButton(field: HTMLElement): HTMLElement {
    const button = document.createElement('button');
    button.id = `engageiq-button-${field.id}`;
    button.className = 'engageiq-generate-button';
    button.textContent = 'Generate Comment';
    button.setAttribute('data-field-id', field.id);
    
    // Style the button to match LinkedIn's design with improved visibility
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
      z-index: 9999;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    
    // Hover effects
    button.addEventListener('mouseover', () => {
      button.style.backgroundColor = '#004182';
    });
    
    button.addEventListener('mouseout', () => {
      button.style.backgroundColor = '#0a66c2';
    });
    
    this.logger.info('ENHANCEMENT: Created button with ID:', button.id);
    return button;
  }
  
  /**
   * Position the button relative to the comment field
   */
  private positionButton(button: HTMLElement, field: HTMLElement): void {
    // Get the field's dimensions and position
    const fieldRect = field.getBoundingClientRect();
    this.logger.info('ENHANCEMENT: Field dimensions', {
      top: fieldRect.top,
      right: fieldRect.right,
      bottom: fieldRect.bottom,
      left: fieldRect.left,
      width: fieldRect.width,
      height: fieldRect.height
    });
    
    // Position at top-right of the field with adjusted positioning
    const topPosition = window.scrollY + fieldRect.top;
    const leftPosition = window.scrollX + fieldRect.left + fieldRect.width - 150;
    
    button.style.top = `${topPosition}px`;
    button.style.left = `${leftPosition}px`;
    
    this.logger.info('ENHANCEMENT: Button positioned at', {
      top: button.style.top,
      left: button.style.left
    });
    
    // Append to document body for absolute positioning
    document.body.appendChild(button);
    
    // Verify button is in DOM
    setTimeout(() => {
      const buttonInDOM = document.getElementById(button.id);
      this.logger.info('ENHANCEMENT: Button in DOM check:', !!buttonInDOM);
    }, 100);
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
   * Attach focus and blur event listeners to manage button visibility
   */
  private attachFieldFocusEvents(button: HTMLElement, field: HTMLElement): void {
    // Track which element was last focused to correctly manage button visibility
    let isFieldOrButtonFocused = false;
    
    // Show button when field is focused or clicked
    field.addEventListener('focus', () => {
      this.logger.info('Field focused:', field.id);
      isFieldOrButtonFocused = true;
      this.updateButtonPosition(button, field);
      button.style.display = 'block';
    });
    
    field.addEventListener('click', () => {
      this.logger.info('Field clicked:', field.id);
      isFieldOrButtonFocused = true;
      this.updateButtonPosition(button, field);
      button.style.display = 'block';
    });
    
    // Hide button when field loses focus
    field.addEventListener('blur', () => {
      this.logger.info('Field lost focus:', field.id);
      isFieldOrButtonFocused = false;
      
      // Small delay to check if focus moved to the button
      setTimeout(() => {
        // Only hide if neither the field nor button have focus
        if (!isFieldOrButtonFocused) {
          this.logger.info('Hiding button after field blur');
          button.style.display = 'none';
        }
      }, 200);
    });
    
    // Keep button visible when it's focused
    button.addEventListener('focus', () => {
      this.logger.info('Button focused');
      isFieldOrButtonFocused = true;
      button.style.display = 'block';
    });
    
    // Hide button when it loses focus
    button.addEventListener('blur', () => {
      this.logger.info('Button lost focus');
      isFieldOrButtonFocused = false;
      
      // Small delay to check if focus moved to the field
      setTimeout(() => {
        // Only hide if neither the field nor button have focus
        if (!isFieldOrButtonFocused) {
          this.logger.info('Hiding button after button blur');
          button.style.display = 'none';
        }
      }, 200);
    });
    
    // Add click handler to the button that updates its state
    button.addEventListener('click', () => {
      // Button was clicked, keep track of this interaction
      this.logger.info('Button clicked');
      isFieldOrButtonFocused = true;
    });
    
    // Add global document click handler to hide button when clicking elsewhere
    document.addEventListener('click', (e) => {
      // If click is outside both the field and button, hide the button
      if (e.target !== field && e.target !== button && !field.contains(e.target as Node) && !button.contains(e.target as Node)) {
        this.logger.info('Document clicked outside field and button');
        isFieldOrButtonFocused = false;
        button.style.display = 'none';
      }
    });
  }
  
  /**
   * Update button position in case the field has moved
   */
  private updateButtonPosition(button: HTMLElement, field: HTMLElement): void {
    const fieldRect = field.getBoundingClientRect();
    button.style.top = `${window.scrollY + fieldRect.top}px`;
    button.style.left = `${window.scrollX + fieldRect.left + fieldRect.width - 150}px`;
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