import { Logger } from '../services/Logger';
// Import CommentLength type from CommentDisplay
import { CommentLength } from './CommentDisplay';

/**
 * CommentFieldEnhancer - Enhances LinkedIn comment fields with EngageIQ functionality
 */
export class CommentFieldEnhancer {
  private logger: Logger;
  private isGenerating: boolean = false;
  private isButtonClicking: boolean = false; // Track when button is being clicked
  
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
    // First try to find the tooltip within any span element
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
      
      this.isGenerating = true;
      this.logger.info('ENHANCEMENT: Generate button clicked for field', field.id);
      
      // Force the button to stay visible
      button.style.display = 'block';
      
      // Show loading state
      this.showButtonLoadingState(button);
      
      // Prevent button from being hidden during generation
      button.setAttribute('data-generating', 'true');
      
      // Extract post content
      const postContent = this.extractPostContent(field);
      
      // Get user's length preference
      let lengthPreference: CommentLength = 'medium'; // Default
      try {
        const response = await chrome.runtime.sendMessage({ 
          type: 'GET_COMMENT_LENGTH_PREFERENCE' 
        });
        
        if (response && response.preference) {
          lengthPreference = response.preference;
          this.logger.info('Using length preference:', lengthPreference);
        }
      } catch (error) {
        this.logger.error('Error loading length preference:', error);
      }
      
      // Send message to background script to generate comment
      try {
        chrome.runtime.sendMessage({
          type: 'GENERATE_COMMENT',
          payload: {
            fieldId: field.id,
            postContent,
            options: {
              tone: 'all',
              length: lengthPreference
            }
          }
        }, (response) => {
          // Check for Chrome runtime errors
          if (chrome.runtime.lastError) {
            this.logger.error('Chrome runtime error:', chrome.runtime.lastError);
            // Handle context invalidation error - safely check for message property
            if (chrome.runtime.lastError && 
                typeof chrome.runtime.lastError === 'object' && 
                'message' in chrome.runtime.lastError && 
                chrome.runtime.lastError.message && 
                chrome.runtime.lastError.message.includes('Extension context invalidated')) {
              this.showContextInvalidationError(button);
              return;
            }
            // Reset loading state on other errors
            this.resetButtonLoadingState(button);
            return;
          }
          
          this.logger.info('Generate comment response:', response);
          
          if (response && response.error) {
            // Reset loading state on error
            this.resetButtonLoadingState(button);
          }
          
          // For debugging - we should now receive a COMMENT_GENERATED message from background script
          this.logger.info('Waiting for COMMENT_GENERATED message...');
        });
      } catch (error) {
        this.logger.error('Error sending message to background script:', error);
        // Check if this is a context invalidation error
        if (error instanceof Error && error.message.includes('Extension context invalidated')) {
          this.showContextInvalidationError(button);
        } else {
          // Reset loading state on other errors
          this.resetButtonLoadingState(button);
        }
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
    // Capture the button's DOM state BEFORE we modify it
    const buttonRect = button.getBoundingClientRect();
    const originalDisplay = window.getComputedStyle(button).display;
    const originalVisibility = window.getComputedStyle(button).visibility;
    const originalOpacity = window.getComputedStyle(button).opacity;
    const originalBackgroundColor = window.getComputedStyle(button).backgroundColor;
    
    this.logger.info('BUTTON DEBUG - Before loading state', {
      id: button.id,
      clientRect: `${buttonRect.width}x${buttonRect.height} @ (${buttonRect.left},${buttonRect.top})`,
      computedDisplay: originalDisplay,
      computedVisibility: originalVisibility,
      computedOpacity: originalOpacity,
      computedBgColor: originalBackgroundColor,
      isInDom: !!document.getElementById(button.id),
      isVisible: button.offsetParent !== null,
      hasChildren: button.childNodes.length,
      innerText: button.innerText,
      textContent: button.textContent
    });
    
    // Store original position for later restoration
    const originalTop = button.style.top;
    const originalLeft = button.style.left;
    
    this.isGenerating = true;
    
    try {
      // CRITICAL FIX: Clone the button and replace it to break any hidden parents/effects
      const parentElement = button.parentElement;
      const oldButton = button;
      const newButton = button.cloneNode(true) as HTMLElement;
      
      // Ensure the clone has the same ID and data attributes
      newButton.id = button.id;
      newButton.setAttribute('data-field-id', button.getAttribute('data-field-id') || '');
      
      // Replace old button with clone directly in the document.body
      document.body.appendChild(newButton);
      if (parentElement) {
        try {
          parentElement.removeChild(oldButton);
        } catch (e) {
          // Ignore if already removed
        }
      }
      
      // Use the cloned button for the rest of the operation
      button = newButton;
      
      // Use a highly visible loading spinner (white on blue)
      const loadingDataURI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAzOCAzOCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxkZWZzPgogICAgICAgIDxsaW5lYXJHcmFkaWVudCB4MT0iOC4wNDIlIiB5MT0iMCUiIHgyPSI2NS42ODIlIiB5Mj0iMjMuODY1JSIgaWQ9ImEiPgogICAgICAgICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiIG9mZnNldD0iMCUiLz4KICAgICAgICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iI2ZmZiIgc3RvcC1vcGFjaXR5PSIuNjMxIiBvZmZzZXQ9IjYzLjE0NiUiLz4KICAgICAgICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iI2ZmZiIgb2Zmc2V0PSIxMDAlIi8+CiAgICAgICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDwvZGVmcz4KICAgIDxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMSAxKSI+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0zNiAxOGMwLTkuOTQtOC4wNi0xOC0xOC0xOCIgaWQ9Ik92YWwtMiIgc3Ryb2tlPSJ1cmwoI2EpIiBzdHJva2Utd2lkdGg9IjIiPgogICAgICAgICAgICAgICAgPGFuaW1hdGVUcmFuc2Zvcm0KICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iCiAgICAgICAgICAgICAgICAgICAgdHlwZT0icm90YXRlIgogICAgICAgICAgICAgICAgICAgIGZyb209IjAgMTggMTgiCiAgICAgICAgICAgICAgICAgICAgdG89IjM2MCAxOCAxOCIKICAgICAgICAgICAgICAgICAgICBkdXI9IjAuOXMiCiAgICAgICAgICAgICAgICAgICAgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIC8+CiAgICAgICAgICAgIDwvcGF0aD4KICAgICAgICAgICAgPGNpcmNsZSBmaWxsPSIjZmZmIiBjeD0iMzYiIGN5PSIxOCIgcj0iMSI+CiAgICAgICAgICAgICAgICA8YW5pbWF0ZVRyYW5zZm9ybQogICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZU5hbWU9InRyYW5zZm9ybSIKICAgICAgICAgICAgICAgICAgICB0eXBlPSJyb3RhdGUiCiAgICAgICAgICAgICAgICAgICAgZnJvbT0iMCAxOCAxOCIKICAgICAgICAgICAgICAgICAgICB0bz0iMzYwIDE4IDE4IgogICAgICAgICAgICAgICAgICAgIGR1cj0iMC45cyIKICAgICAgICAgICAgICAgICAgICByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIgLz4KICAgICAgICAgICAgPC9jaXJjbGU+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4=';
      
      // Completely reset HTML content
      button.innerHTML = `<img src="${loadingDataURI}" alt="Loading..." style="width:20px; height:20px; display:block;">`;
      
      // Position at the exact same coordinates as the original
      button.style.top = originalTop;
      button.style.left = originalLeft;
      
      // Apply super aggressive styles to ensure visibility
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center'; 
      button.style.backgroundColor = '#0a66c2';
      button.style.borderRadius = '50%';
      button.style.width = '34px'; // Slightly larger
      button.style.height = '34px'; // Slightly larger
      button.style.padding = '0';
      button.style.border = 'none';
      button.style.position = 'fixed'; // Use fixed instead of absolute
      button.style.zIndex = '99999'; // Ultra high z-index
      button.style.boxShadow = '0 0 8px rgba(0,0,0,0.5)'; // More visible shadow
      button.style.opacity = '1';
      button.style.visibility = 'visible';
      button.style.pointerEvents = 'auto'; // Allow interactions with the button
      button.style.transform = 'none'; // Reset any transforms
      
      // Force browser repaints
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      button.offsetHeight;
      document.body.offsetHeight;
      
      // Instead of using an interval, just make a one-time check in a few hundred ms
      let checkCount = 0;
      const MAX_CHECKS = 5;
      const checkButtonVisibility = () => {
        if (checkCount >= MAX_CHECKS) return;
        checkCount++;
        
        if (!document.body.contains(button)) {
          document.body.appendChild(button);
          button.style.visibility = 'visible';
          button.style.display = 'flex';
          button.style.opacity = '1';
          
          this.logger.info('BUTTON DEBUG - Restored hidden button to DOM');
        }
        
        // Check if button is invisible and force visibility only if needed
        const currentDisplay = window.getComputedStyle(button).display;
        const currentVisibility = window.getComputedStyle(button).visibility;
        const currentOpacity = window.getComputedStyle(button).opacity;
        
        const isHidden = currentDisplay === 'none' || currentVisibility === 'hidden' || 
                        parseFloat(currentOpacity) < 0.5;
        
        if (isHidden) {
          button.style.display = 'flex';
          button.style.visibility = 'visible';
          button.style.opacity = '1';
          
          this.logger.info('BUTTON DEBUG - Fixed hidden button', {
            display: currentDisplay,
            visibility: currentVisibility,
            opacity: currentOpacity
          });
          
          // Schedule another check in case it gets hidden again
          const timeoutId = setTimeout(checkButtonVisibility, 500);
          button.setAttribute('data-visibility-timeout', timeoutId.toString());
        }
      };
      
      // Initial check after a brief delay
      const initialTimeoutId = setTimeout(checkButtonVisibility, 100);
      button.setAttribute('data-visibility-timeout', initialTimeoutId.toString());
      
      // Now check the button's state AFTER our changes
      const afterRect = button.getBoundingClientRect();
      const afterDisplay = window.getComputedStyle(button).display;
      const afterVisibility = window.getComputedStyle(button).visibility;
      const afterOpacity = window.getComputedStyle(button).opacity;
      
      this.logger.info('BUTTON DEBUG - After loading state', {
        id: button.id,
        clientRect: `${afterRect.width}x${afterRect.height} @ (${afterRect.left},${afterRect.top})`,
        computedDisplay: afterDisplay,
        computedVisibility: afterVisibility,
        computedOpacity: afterOpacity,
        isInDom: !!document.getElementById(button.id),
        isVisible: button.offsetParent !== null,
        hasChildren: button.childNodes.length,
        innerHTML: button.innerHTML.substring(0, 50) + '...',
        hasImage: !!button.querySelector('img'),
        imageWidth: button.querySelector('img')?.width,
        imageHeight: button.querySelector('img')?.height,
        isClone: true
      });
      
    } catch (error) {
      this.logger.error('Error setting loading state:', error);
      
      // Absolute fallback
      button.innerHTML = '⟳';
      button.style.fontSize = '20px';
      button.style.fontWeight = 'bold';
      button.style.color = 'white';
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      button.style.backgroundColor = '#0a66c2';
      button.style.position = 'fixed';
      button.style.zIndex = '99999';
      button.style.visibility = 'visible';
      button.style.opacity = '1';
    }
  }
  
  /**
   * Reset loading state on the button
   */
  private resetButtonLoadingState(button: HTMLElement): void {
    // Clear any running timeouts
    const timeoutId = button.getAttribute('data-visibility-timeout');
    if (timeoutId) {
      clearTimeout(parseInt(timeoutId, 10));
    }
    
    // Check if the button exists in the DOM
    if (!document.body.contains(button)) {
      this.logger.info('Button not in DOM during reset, skipping');
      this.isGenerating = false;
      return;
    }
    
    // If the button was cloned, it may not have proper structure
    // Let's create a completely fresh button to replace it
    const fieldId = button.getAttribute('data-field-id');
    if (!fieldId) {
      this.logger.info('Button has no field ID during reset, skipping');
      this.isGenerating = false;
      return;
    }
    
    // Find the associated field
    const field = document.getElementById(fieldId);
    if (!field) {
      this.logger.info('Field not found during button reset, removing button');
      document.body.removeChild(button);
      this.isGenerating = false;
      return;
    }
    
    // Create a fresh button
    const newButton = this.createGenerateButton(field);
    
    // Position it in the same place
    this.positionButton(newButton, field);
    
    // Attach event listeners
    this.attachEventListeners(newButton, field);
    
    // Set up focus events
    this.attachFieldFocusEvents(newButton, field);
    
    // Listen for messages
    this.setupMessageListener(newButton);
    
    // Remove the old button
    try {
      document.body.removeChild(button);
    } catch (e) {
      // Ignore if already removed
    }
    
    // Reset the generating state
    this.isGenerating = false;
    
    this.logger.info('Successfully reset button with a fresh instance');
  }
  
  /**
   * Setup message listener for comment generation completion
   */
  private setupMessageListener(button: HTMLElement): void {
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
      if (message.type === 'COMMENT_GENERATED' || message.type === 'COMMENT_GENERATION_ERROR') {
        // Field ID for this button
        const fieldId = button.getAttribute('data-field-id');
        
        // Check if this is for our field
        if (message.payload && message.payload.fieldId === fieldId) {
          this.logger.info('Comment generation completed for field:', fieldId);
          this.resetButtonLoadingState(button);
        }
      }
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
      text,
      url: window.location.href
    };
  }
}