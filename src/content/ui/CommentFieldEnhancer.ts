import { Logger } from '../services/Logger';
// Import CommentLength type from CommentDisplay
import { CommentLength } from './CommentDisplay';
import { ThemeDetector } from '../services/ThemeDetector';

/**
 * CommentFieldEnhancer - Enhances LinkedIn comment fields with EngageIQ functionality
 */
export class CommentFieldEnhancer {
  private logger: Logger;
  private isGenerating: boolean = false;
  private isButtonClicking: boolean = false; // Track when button is being clicked
  private processedMessages: Set<string> = new Set(); // Track processed messages
  
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
    
    // Make button hidden by default
    button.style.display = 'none';
    
    // Add focus and blur event listeners to manage button
    this.attachFieldFocusEvents(button, field);
    
    // Attach event listeners for click and other interactions
    this.attachEventListeners(button, field);
    
    // Listen for comment generation completion
    this.setupMessageListener(button);
    
    // Show the button if the field already has focus
    if (document.activeElement === field || field.contains(document.activeElement)) {
      button.style.display = 'block';
    }
    
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
    button.setAttribute('aria-label', 'Generate Comment with AI');
    button.setAttribute('data-field-id', field.id);
    button.setAttribute('tabindex', '0'); // Make it focusable
    
    // Create icon container with tooltip instead of text
    const buttonContent = document.createElement('div');
    buttonContent.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 100%;
      height: 100%;
    `;
    
    // Create the button tooltip - initially hidden
    const tooltip = document.createElement('span');
    tooltip.textContent = 'Generate Comment';
    tooltip.style.cssText = `
      position: absolute;
      background-color: rgba(0, 0, 0, 0.75);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s, visibility 0.2s;
      pointer-events: none;
      top: -30px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
    `;
    
    // Create a simple circular button with "AI" text 
    const circleIcon = document.createElement('div');
    circleIcon.style.cssText = `
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 10px;
      color: #0a66c2;
      font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
    `;
    
    // Use a span for the text to better isolate it
    const aiText = document.createElement('span');
    aiText.textContent = 'AI';
    aiText.style.cssText = `
      display: block;
      line-height: 1;
    `;
    
    circleIcon.appendChild(aiText);
    
    // Add hover effect for tooltip
    button.addEventListener('mouseenter', () => {
      tooltip.style.opacity = '1';
      tooltip.style.visibility = 'visible';
    });
    
    button.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
      tooltip.style.visibility = 'hidden';
    });
    
    // Append elements
    buttonContent.appendChild(circleIcon);
    buttonContent.appendChild(tooltip);
    button.appendChild(buttonContent);
    
    // Style the button to match LinkedIn's design with improved visibility
    button.style.cssText = `
      background-color: #0a66c2;
      color: white;
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      padding: 0;
      cursor: pointer;
      transition: all 0.2s ease;
      position: absolute;
      z-index: 9999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      pointer-events: auto;
    `;
    
    // Hover effects
    button.addEventListener('mouseover', () => {
      button.style.backgroundColor = '#004182';
      button.style.transform = 'scale(1.1)';
      button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
    });
    
    button.addEventListener('mouseout', () => {
      button.style.backgroundColor = '#0a66c2';
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    });
    
    // Add active press effect
    button.addEventListener('mousedown', () => {
      button.style.transform = 'scale(0.95)';
      button.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)';
    });
    
    button.addEventListener('mouseup', () => {
      button.style.transform = 'scale(1.1)';
      button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
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
    
    // Position at bottom-right of the field, outside the typing area
    const topPosition = window.scrollY + fieldRect.bottom + 5; // 5px below the field
    const leftPosition = window.scrollX + fieldRect.left + fieldRect.width - 40; // 40px from right edge
    
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
   * Ensure tooltip is properly hidden when button is displayed
   */
  private resetTooltipState(button: HTMLElement): void {
    // Remove any error tooltips
    const errorTooltip = button.querySelector('.engageiq-error-tooltip');
    if (errorTooltip) {
      button.removeChild(errorTooltip);
    }
    
    // Find and hide the regular tooltip
    let tooltip = button.querySelector('span') as HTMLElement;
    
    // If not found, look for any span within a div inside the button
    if (!tooltip || tooltip.textContent !== 'Generate Comment') {
      const buttonContent = button.querySelector('div');
      if (buttonContent) {
        tooltip = buttonContent.querySelector('span[style*="position: absolute"]') as HTMLElement;
      }
    }
    
    // If a tooltip was found, hide it
    if (tooltip) {
      tooltip.style.opacity = '0';
      tooltip.style.visibility = 'hidden';
    }
  }
  
  /**
   * Attach event listeners to the Generate Comment button
   */
  private attachEventListeners(button: HTMLElement, field: HTMLElement): void {
    // Add mousedown handler to set clicking state
    button.addEventListener('mousedown', () => {
      this.isButtonClicking = true;
      button.classList.add('engageiq-button-clicking');
      
      // Set a timeout to reset this state if the click handler doesn't fire
      setTimeout(() => {
        this.isButtonClicking = false;
        button.classList.remove('engageiq-button-clicking');
      }, 1000);
    });
    
    button.addEventListener('click', async (e) => {
      // Prevent the default action
      e.preventDefault();
      
      // Stop the event from propagating to prevent focus loss
      e.stopPropagation();
      
      // Reset clicking state
      this.isButtonClicking = false;
      button.classList.remove('engageiq-button-clicking');
      
      if (this.isGenerating) {
        this.logger.info('Currently generating, ignoring click');
        return;
      }
      
      // Clear any existing error tooltips before starting
      const existingErrorTooltip = button.querySelector('.engageiq-error-tooltip');
      if (existingErrorTooltip) {
        button.removeChild(existingErrorTooltip);
      }
      
      // Set generating state and show loading
      this.isGenerating = true;
      this.logger.info('ENHANCEMENT: Generate button clicked for field', field.id);
      
      // Force the button to stay visible and set generating state
      button.style.display = 'block';
      button.setAttribute('data-generating', 'true');
      
      // Show loading state
      this.showButtonLoadingState(button);
      
      try {
        // Extract post content
        const postContent = this.extractPostContent(field);
        
        // Get user's length preference
        let lengthPreference: CommentLength = 'medium';
        
        try {
          // Try to get saved preference from storage
          const { lengthPreference: savedPref } = await chrome.storage.sync.get('lengthPreference');
          if (savedPref) {
            lengthPreference = savedPref as CommentLength;
          }
        } catch (error) {
          this.logger.warn('Error getting length preference', error);
        }
        
        // Track if we've received a response to avoid duplicate processing
        let responseReceived = false;
        
        // Send message to background script
        chrome.runtime.sendMessage({
          type: 'GENERATE_COMMENT',
          payload: {
            postContent,
            lengthPreference,
            fieldId: field.id
          }
        }, (response) => {
          // Prevent duplicate response handling
          if (responseReceived) {
            return;
          }
          responseReceived = true;
          
          // Check for Chrome extension context invalidation
          const lastError = chrome.runtime.lastError;
          if (lastError) {
            this.logger.error('Error sending message:', lastError);
            
            // Safely handle error
            if (document.body.contains(button)) {
              this.showContextInvalidationError(button);
            }
            
            // Reset state
            this.isGenerating = false;
            return;
          }
          
          this.logger.info('Message sent to background script', response);
          
          // Handle immediate error response
          if (response && typeof response === 'object' && 'error' in response) {
            // Show error tooltip directly from here too, in case the message listener misses it
            if (document.body.contains(button)) {
              this.resetButtonLoadingState(button);
              this.showGenerationError(button, new Error(response.error || 'Unknown error'));
            }
            
            // Reset state
            this.isGenerating = false;
          }
        });
        
        // Set timeout to handle case where message response doesn't come back
        setTimeout(() => {
          if (this.isGenerating && document.body.contains(button)) {
            this.logger.warn('Generation timed out after 30 seconds');
            this.resetButtonLoadingState(button);
            this.showGenerationError(button, new Error('Request timed out'));
            this.isGenerating = false;
          }
        }, 30000);
        
      } catch (error) {
        // Handle any errors during setup
        this.logger.error('Error during comment generation setup:', error);
        
        if (document.body.contains(button)) {
          this.resetButtonLoadingState(button);
          this.showGenerationError(button, error);
        }
        
        this.isGenerating = false;
      }
    });
  }
  
  /**
   * Show context invalidation error to user
   */
  private showContextInvalidationError(button: HTMLElement): void {
    // Reset button first
    this.resetButtonLoadingState(button);
    
    // Create error tooltip
    const tooltip = document.createElement('div');
    tooltip.textContent = 'Extension needs a refresh. Please reload the page.';
    tooltip.style.cssText = `
      position: absolute;
      background-color: #d32f2f;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      max-width: 200px;
      z-index: 99999;
      top: -40px;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    
    // Add refresh button
    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Reload Page';
    refreshButton.style.cssText = `
      background-color: white;
      color: #d32f2f;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      margin-top: 6px;
      font-size: 12px;
      cursor: pointer;
      font-weight: bold;
    `;
    
    refreshButton.addEventListener('click', () => {
      window.location.reload();
    });
    
    tooltip.appendChild(document.createElement('br'));
    tooltip.appendChild(refreshButton);
    
    // Add arrow
    const arrow = document.createElement('div');
    arrow.style.cssText = `
      position: absolute;
      width: 0;
      height: 0;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid #d32f2f;
    `;
    
    tooltip.appendChild(arrow);
    button.style.position = 'relative';
    button.appendChild(tooltip);
    
    // Auto-remove tooltip after 10 seconds
    setTimeout(() => {
      if (button.contains(tooltip)) {
        button.removeChild(tooltip);
      }
    }, 10000);
  }
  
  /**
   * Show loading state on the button
   */
  private showButtonLoadingState(button: HTMLElement): void {
    // Use simpler attribute-based tracking
    button.setAttribute('data-loading', 'true');
    
    // Get field ID for this button
    const fieldId = button.getAttribute('data-field-id');
    
    // Set flag to prevent multiple operations
    this.isGenerating = true;
    
    // Ensure the animation style exists
    this.ensureSpinnerAnimationExists();
    
    // Get theme-appropriate colors
    const themeDetector = new ThemeDetector();
    const isDarkMode = themeDetector.isDarkMode();
    const buttonColor = isDarkMode ? '#0073b1' : '#0a66c2';
    
    // Set consistent styling
    button.style.backgroundColor = buttonColor;
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.opacity = '1';
    button.style.visibility = 'visible';
    
    // Create simple SVG spinner - more reliable than image loading
    const svgSpinner = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgSpinner.setAttribute('width', '20');
    svgSpinner.setAttribute('height', '20');
    svgSpinner.setAttribute('viewBox', '0 0 24 24');
    svgSpinner.setAttribute('class', 'engageiq-spinner');
    svgSpinner.style.animation = 'engageiq-spin 1s linear infinite';
    
    // Create spinning circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '10');
    circle.setAttribute('stroke', 'white');
    circle.setAttribute('stroke-width', '2');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke-dasharray', '40');
    circle.setAttribute('stroke-dashoffset', '20');
    
    // Include accessibility attributes
    svgSpinner.setAttribute('role', 'status');
    svgSpinner.setAttribute('aria-label', 'Loading');
    
    // Assemble and replace content
    svgSpinner.appendChild(circle);
    button.innerHTML = '';
    button.appendChild(svgSpinner);
    
    // Log state changes for debugging
    this.logger.info(`Button (${fieldId}) entered loading state`);
  }
  
  /**
   * Reset loading state on the button
   */
  private resetButtonLoadingState(button: HTMLElement): void {
    // First check if button is still in the DOM
    if (!document.body.contains(button)) {
      this.logger.info('Button not in DOM during reset, skipping');
      // Don't reset isGenerating here, let message handler handle it
      return;
    }
    
    try {
      // Get field ID for this button
      const fieldId = button.getAttribute('data-field-id');
      
      // Clear loading state flag
      button.removeAttribute('data-loading');
      button.removeAttribute('data-generating');
      
      // Reset button content to original state
      const field = document.getElementById(fieldId || '');
      if (field) {
        // Create a fresh button that replaces the current one
        const newButton = this.createGenerateButton(field);
        
        // Store original position
        const originalTop = button.style.top;
        const originalLeft = button.style.left;
        
        // Position it at the exact same coordinates
        newButton.style.top = originalTop;
        newButton.style.left = originalLeft;
        
        // Attach all event listeners
        this.attachEventListeners(newButton, field);
        this.attachFieldFocusEvents(newButton, field);
        this.setupMessageListener(newButton);
        
        // Replace the old button
        if (button.parentElement) {
          try {
            button.parentElement.replaceChild(newButton, button);
          } catch (e) {
            // If replacement fails, add the new button to document body
            document.body.appendChild(newButton);
            // Safely remove old button if it still exists
            if (document.body.contains(button)) {
              document.body.removeChild(button);
            }
          }
        } else {
          // If button is detached, add the new one to document
          document.body.appendChild(newButton);
          // Safely remove old button if it still exists
          if (document.body.contains(button)) {
            document.body.removeChild(button);
          }
        }
        
        // Show or hide based on field focus
        if (document.activeElement === field || field.contains(document.activeElement)) {
          newButton.style.display = 'block';
        } else {
          newButton.style.display = 'none';
        }
        
        // Log success
        this.logger.info(`Button (${fieldId}) reset from loading state successfully`);
      } else {
        // No field found, just hide the button
        button.style.display = 'none';
        this.logger.info(`Button reset failed: field ${fieldId} not found`);
      }
    } catch (error) {
      // Log any errors during reset
      this.logger.error('Error during button reset:', error);
      
      // Try to hide the button as a fallback
      try {
        button.style.display = 'none';
      } catch (e) {
        // Ignore errors on fallback
      }
    }
  }
  
  /**
   * Ensure spinner animation exists in the document
   */
  private ensureSpinnerAnimationExists(): void {
    if (!document.getElementById('engageiq-spinner-animation')) {
      const style = document.createElement('style');
      style.id = 'engageiq-spinner-animation';
      style.textContent = `
        @keyframes engageiq-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  /**
   * Setup message listener for comment generation completion
   */
  private setupMessageListener(button: HTMLElement): void {
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
      // First check if this is one of our message types
      if (message.type !== 'COMMENT_GENERATED' && message.type !== 'COMMENT_GENERATION_ERROR') {
        return true;
      }
      
      // Make sure we have a payload and fieldId
      if (!message.payload || !message.payload.fieldId) {
        return true;
      }
      
      // Create a message ID to prevent duplicate processing
      const messageId = `${message.type}-${message.payload.fieldId}-${Date.now()}`;
      
      // Check if we've processed a similar message recently (within 500ms)
      const isSimilarMessageProcessed = Array.from(this.processedMessages)
        .some(id => {
          // Split ID to get components
          const [type, fieldId, timestamp] = id.split('-');
          
          // Check if this is for the same field and same message type
          if (type === message.type && fieldId === message.payload.fieldId) {
            // Check if the message was processed recently (within 500ms)
            const messageTime = parseInt(timestamp);
            return (Date.now() - messageTime) < 500;
          }
          return false;
        });
      
      if (isSimilarMessageProcessed) {
        this.logger.info('Duplicate message detected, skipping:', message.payload.fieldId);
        return true;
      }
      
      // Add this message to our processed set
      this.processedMessages.add(messageId);
      
      // Clean up old messages (keep only 10 most recent)
      if (this.processedMessages.size > 20) {
        const messageArray = Array.from(this.processedMessages);
        const recentMessages = messageArray.slice(-10);
        this.processedMessages = new Set(recentMessages);
      }
      
      // Get the field ID for our button
      const buttonFieldId = button.getAttribute('data-field-id');
      
      // If this message is not for our field, ignore it
      if (buttonFieldId !== message.payload.fieldId) {
        return true;
      }
      
      this.logger.info('Comment generation completed for field:', message.payload.fieldId);
      
      // Try to find the button - it might have been recreated
      const buttonSelector = `button[data-field-id="${message.payload.fieldId}"]`;
      let targetButton: HTMLElement | null = null;
      
      if (document.body.contains(button)) {
        targetButton = button;
      } else {
        targetButton = document.querySelector(buttonSelector) as HTMLElement;
        if (!targetButton) {
          // Button doesn't exist, create a new one if field exists
          const field = document.getElementById(message.payload.fieldId);
          if (field) {
            targetButton = this.createGenerateButton(field);
            this.positionButton(targetButton, field);
            this.attachEventListeners(targetButton, field);
            this.attachFieldFocusEvents(targetButton, field);
            this.setupMessageListener(targetButton);
            
            // Show button if field has focus
            if (document.activeElement === field || field.contains(document.activeElement)) {
              targetButton.style.display = 'block';
            }
          }
        }
      }
      
      if (targetButton) {
        // Reset loading state
        this.resetButtonLoadingState(targetButton);
        
        // Show error if applicable (only if no error is already showing)
        if (message.type === 'COMMENT_GENERATION_ERROR' && 
            message.payload.error && 
            !targetButton.querySelector('.engageiq-error-tooltip')) {
          this.showGenerationError(targetButton, message.payload.error);
        }
      }
      
      // Reset generating flag
      this.isGenerating = false;
      
      return true; // Keep the message channel open for async response
    });
  }
  
  /**
   * Attach focus and blur events to manage button visibility
   */
  private attachFieldFocusEvents(button: HTMLElement, field: HTMLElement): void {
    const handleShowButton = (e: Event) => {
      // Stop propagation to ensure consistent behavior
      e.stopPropagation();
      
      // Immediately make button visible
      button.style.display = 'block';
      
      // Log for debugging
      this.logger.info('Field focused, showing button');
      
      // Ensure tooltip is hidden when button reappears
      this.resetTooltipState(button);
    };
    
    const handleHideButton = (e: FocusEvent) => {
      // Stop event propagation
      e.stopPropagation();
      
      // Use a small delay to allow the click event to fire
      setTimeout(() => {
        // Don't hide the button if it's currently generating a comment
        if (button.getAttribute('data-generating') === 'true') {
          return;
        }
        
        // Don't hide if we're currently clicking the button
        if (this.isButtonClicking || button.classList.contains('engageiq-button-clicking')) {
          return;
        }
        
        // Don't hide if the relatedTarget (element receiving focus) is the button itself
        if (e.relatedTarget === button || (e.relatedTarget && button.contains(e.relatedTarget as Node))) {
          return;
        }
        
        // Log for debugging
        this.logger.info('Field lost focus, hiding button');
        
        // Hide the button when field loses focus
        button.style.display = 'none';
      }, 150); // Slightly longer delay to ensure click has time to register
    };
    
    // Show button when the field or any element inside it is focused
    field.addEventListener('focusin', handleShowButton);
    
    // Hide button when focus leaves the field
    field.addEventListener('focusout', handleHideButton);
    
    // Force button visibility on mousedown
    button.addEventListener('mousedown', (e) => {
      // Prevent defaults and stop propagation
      e.preventDefault();
      e.stopPropagation();
      
      // Log for debugging
      this.logger.info('Button mousedown, ensuring visibility');
      
      // Force button visible state
      this.isButtonClicking = true;
      button.classList.add('engageiq-button-clicking');
      button.style.display = 'block';
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
      text: text || 'No text content found', // Ensure text is never undefined
      url: window.location.href,
      postType: 'post' // Add a default post type 
    };
  }
  
  /**
   * Show error message when generation fails
   */
  private showGenerationError(button: HTMLElement, error: unknown): void {
    this.logger.error('Comment generation error:', error);
    
    // Create error tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'engageiq-error-tooltip';
    tooltip.textContent = 'Failed to generate comment. Please try again.';
    
    // Style the tooltip
    tooltip.style.cssText = `
      position: absolute;
      background-color: #d32f2f;
      color: white;
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 12px;
      max-width: 200px;
      z-index: 99999;
      top: -40px;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      animation: engageiq-fade-in 0.3s ease-out forwards;
    `;
    
    // Add arrow
    const arrow = document.createElement('div');
    arrow.style.cssText = `
      position: absolute;
      width: 0;
      height: 0;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid #d32f2f;
    `;
    
    // Ensure proper positioning
    button.style.position = 'relative';
    
    // Add elements to DOM
    tooltip.appendChild(arrow);
    button.appendChild(tooltip);
    
    // Create animation style if needed
    if (!document.getElementById('engageiq-fade-animation')) {
      const style = document.createElement('style');
      style.id = 'engageiq-fade-animation';
      style.textContent = `
        @keyframes engageiq-fade-in {
          0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Auto-remove tooltip after 5 seconds
    setTimeout(() => {
      if (button.contains(tooltip)) {
        tooltip.style.animation = 'none';
        tooltip.style.opacity = '0';
        tooltip.style.transition = 'opacity 0.3s ease-out';
        
        setTimeout(() => {
          if (button.contains(tooltip)) {
            button.removeChild(tooltip);
          }
        }, 300);
      }
    }, 5000);
  }
}