/// <reference types="chrome"/>

console.log('EngageIQ content script loaded');

/**
 * Utility to detect and enhance LinkedIn comment fields
 */
class LinkedInIntegration {
  // Track processed comment fields
  private processedFields: Set<HTMLElement> = new Set();
  // Track comment UI elements
  private commentUIElements: Map<HTMLElement, HTMLElement> = new Map();
  // Store the current post content for comment generation
  private currentPostContent: EngageIQ.PostContent | null = null;
  // Track button states
  private isGenerating: boolean = false;

  /**
   * Initialize the integration
   */
  init() {
    console.log('LinkedIn integration initialized');
    
    // Listen for messages from extension
    this.setupMessageListener();
    
    // Set up observer to detect dynamically loaded content
    this.setupMutationObserver();
    
    // Initial scan for existing comment fields
    this.scanForCommentFields();
  }
  
  /**
   * Listen for messages from the extension
   */
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      console.log('Content script received message:', message);
      
      if ('type' in message) {
        switch (message.type) {
          case 'COMMENT_GENERATED':
            this.handleCommentGenerated(message.payload);
            sendResponse({ success: true });
            break;
            
          case 'INSERT_COMMENT':
            this.insertComment(message.payload.comment, message.payload.elementId);
            sendResponse({ success: true });
            break;
            
          default:
            sendResponse({ error: 'Unknown message type' });
        }
      }
      
      return true; // Keep the message channel open for async response
    });
  }
  
  /**
   * Set up mutation observer to detect new elements
   */
  setupMutationObserver() {
    const observer = new MutationObserver(
      this.debounce((_mutations) => {
        this.scanForCommentFields();
      }, 500)
    );
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('Mutation observer set up');
  }
  
  /**
   * Scan for LinkedIn comment fields
   * LinkedIn has several patterns for comment fields depending on the view
   */
  scanForCommentFields() {
    console.log('EngageIQ: Scanning for LinkedIn comment fields');
    
    // Feed comment fields (most common)
    const feedCommentSelectors = [
      // Main feed comment input field
      '.comments-comment-box__form',
      // Comment input field with content editable
      '[contenteditable="true"][aria-label*="comment"]',
      // Alternative comment field structure
      '.comments-comment-texteditor__contenteditable',
      // Post update comment field
      '.update-components-text-editor__container [contenteditable="true"]',
      // Newer LinkedIn comment fields
      '.comments-comment-box [contenteditable="true"]',
      '.comments-comment-texteditor [contenteditable="true"]',
      // Even broader matches for contenteditable areas in likely comment areas
      '.comments-comment-box textarea',
      '.artdeco-text-input--input'
    ];
    
    console.log('EngageIQ: Looking for comment fields with selectors:', feedCommentSelectors.join(', '));
    
    // Scan for all potential comment fields
    feedCommentSelectors.forEach(selector => {
      const commentFields = document.querySelectorAll(selector);
      console.log(`EngageIQ: Found ${commentFields.length} fields with selector "${selector}"`);
      
      commentFields.forEach((field, index) => {
        const htmlField = field as HTMLElement;
        
        // Skip if already processed
        if (this.processedFields.has(htmlField)) {
          return;
        }
        
        console.log(`EngageIQ: Processing new comment field ${index} with selector "${selector}":`, htmlField);
        console.log(`EngageIQ: Field classes: "${htmlField.className}"`);
        
        // Additional heuristic: Check if this is really a comment field by looking for comment-related keywords
        const isLikelyCommentField = 
          // Check element attributes
          (htmlField.getAttribute('aria-label')?.toLowerCase().includes('comment') ||
           htmlField.getAttribute('placeholder')?.toLowerCase().includes('comment') ||
           // Check parent elements for comment-related classes
           htmlField.closest('.comments-comment-box') ||
           htmlField.closest('[data-control-name*="comment"]') ||
           // Check if inside a form that looks like a comment form
           htmlField.closest('form.comments-comment-box__form'));
           
        if (!isLikelyCommentField) {
          console.log(`EngageIQ: Field ${index} does not appear to be a comment field, skipping`);
          return;
        }
        
        this.setupCommentField(htmlField);
        this.processedFields.add(htmlField);
      });
    });
    
    // If no fields found with specific selectors, try a more aggressive approach
    if (this.processedFields.size === 0) {
      console.log('EngageIQ: No comment fields found with specific selectors, trying broader approach');
      
      // Look for any contenteditable near comments sections
      const commentSections = document.querySelectorAll('.comments-comments-list, [data-test-id*="comments-list"]');
      console.log(`EngageIQ: Found ${commentSections.length} comment sections`);
      
      commentSections.forEach((section, index) => {
        const editableFields = section.querySelectorAll('[contenteditable="true"], textarea');
        console.log(`EngageIQ: Found ${editableFields.length} editable fields in comment section ${index}`);
        
        editableFields.forEach(field => {
          const htmlField = field as HTMLElement;
          if (!this.processedFields.has(htmlField)) {
            console.log('EngageIQ: Processing comment field from broader search:', htmlField);
            this.setupCommentField(htmlField);
            this.processedFields.add(htmlField);
          }
        });
      });
    }
    
    console.log(`EngageIQ: Total comment fields processed: ${this.processedFields.size}`);
  }
  
  /**
   * Set up a detected comment field
   */
  setupCommentField(field: HTMLElement) {
    console.log('EngageIQ: Setting up comment field', field);
    console.log('EngageIQ: Field tag name:', field.tagName);
    console.log('EngageIQ: Field type:', field.getAttribute('type'));
    console.log('EngageIQ: Field class:', field.className);
    console.log('EngageIQ: Field contentEditable:', field.contentEditable);
    console.log('EngageIQ: Field aria-label:', field.getAttribute('aria-label'));
    
    // Find the closest container for positioning the button
    const container = this.findCommentContainer(field);
    
    if (!container) {
      console.warn('EngageIQ: Could not find container for comment field');
      
      // Use parent as fallback container
      if (field.parentElement) {
        console.log('EngageIQ: Using parent element as fallback container');
        this.setupCommentFieldWithContainer(field, field.parentElement);
      } else {
        console.warn('EngageIQ: No parent element available, cannot set up comment field');
      }
      return;
    }
    
    // Set up the field with the found container
    this.setupCommentFieldWithContainer(field, container);
  }
  
  /**
   * Set up a comment field with a specific container
   */
  private setupCommentFieldWithContainer(field: HTMLElement, container: HTMLElement) {
    console.log('EngageIQ: Setting up comment field with container:', container);
    console.log('EngageIQ: Container class:', container.className);
    
    // Track when field is clicked/focused
    const onFieldActivation = () => {
      console.log('EngageIQ: Comment field activated (focus/click)');
      
      // Extract post content when field is focused
      try {
        this.currentPostContent = this.extractPostContent(field);
        console.log('EngageIQ: Post content extracted:', this.currentPostContent);
        
        // Show the generate button if we have post content
        if (this.currentPostContent) {
          this.showGenerateButton(field, container);
        } else {
          console.warn('EngageIQ: No post content extracted, not showing button');
        }
      } catch (error) {
        console.error('EngageIQ: Error extracting post content:', error);
      }
    };
    
    // Add event listeners for both focus and click (some LinkedIn implementations respond better to one vs the other)
    console.log('EngageIQ: Adding event listeners to comment field');
    field.addEventListener('focus', onFieldActivation);
    field.addEventListener('click', onFieldActivation);
    
    // Also listen for parents being clicked in case the actual field is complex
    if (container !== field) {
      container.addEventListener('click', (e) => {
        // Only process if the target isn't our UI
        if (!(e.target as HTMLElement).closest('[data-engageiq-ui="true"]')) {
          console.log('EngageIQ: Container clicked, focusing field');
          field.focus();
        }
      });
    }
    
    // Check if field is already focused/active
    if (document.activeElement === field) {
      console.log('EngageIQ: Field is already active, extracting content immediately');
      onFieldActivation();
    }
    
    console.log('EngageIQ: Comment field setup complete');
  }
  
  /**
   * Find the comment container element for a given field
   */
  findCommentContainer(field: HTMLElement): HTMLElement | null {
    // Try various parent selectors based on LinkedIn's DOM structure
    const possibleContainers = [
      '.comments-comment-box',
      '.comments-comment-texteditor',
      '.update-components-text-editor'
    ];
    
    let container: HTMLElement | null = null;
    
    // Search up the DOM tree
    let currentElement: HTMLElement | null = field;
    while (currentElement && !container) {
      for (const selector of possibleContainers) {
        if (currentElement.matches(selector)) {
          container = currentElement;
          break;
        }
      }
      
      currentElement = currentElement.parentElement;
      
      // Limit search depth
      if (currentElement && currentElement.tagName === 'BODY') {
        break;
      }
    }
    
    // If no specific container found, use parent
    if (!container && field.parentElement) {
      container = field.parentElement;
    }
    
    return container;
  }
  
  /**
   * Show the generate comment button
   */
  showGenerateButton(field: HTMLElement, container: HTMLElement) {
    // Check if button already exists for this field
    if (this.commentUIElements.has(field)) {
      return;
    }
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'engageiq-button-container';
    buttonContainer.setAttribute('data-engageiq-ui', 'true');
    buttonContainer.style.cssText = `
      position: absolute;
      bottom: 10px;
      right: 60px;
      z-index: 1000;
      display: flex;
      align-items: center;
    `;
    
    // Create round generate button
    const generateButton = document.createElement('button');
    generateButton.className = 'engageiq-generate-button';
    generateButton.setAttribute('data-field-id', this.generateFieldId(field));
    generateButton.style.cssText = `
      background-color: #0a66c2;
      color: white;
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
    `;
    
    // Use the extension's icon
    const iconUrl = chrome.runtime.getURL('icons/icon16.png');
    generateButton.innerHTML = `
      <img src="${iconUrl}" width="16" height="16" alt="EngageIQ" style="object-fit: contain;" />
    `;
    
    // Add tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'engageiq-tooltip';
    tooltip.style.cssText = `
      position: absolute;
      top: -30px;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
    `;
    tooltip.textContent = 'Generate AI Comment';
    generateButton.appendChild(tooltip);
    
    // Show/hide tooltip on hover
    generateButton.addEventListener('mouseover', () => {
      generateButton.style.transform = 'scale(1.1)';
      generateButton.style.backgroundColor = '#004182';
      tooltip.style.opacity = '1';
    });
    
    generateButton.addEventListener('mouseout', () => {
      generateButton.style.transform = 'scale(1)';
      generateButton.style.backgroundColor = '#0a66c2';
      tooltip.style.opacity = '0';
    });
    
    generateButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleGenerateClick(field);
    });
    
    // Add button to container
    buttonContainer.appendChild(generateButton);
    
    // Add container to the comment field container
    container.style.position = 'relative';
    container.appendChild(buttonContainer);
    
    // Store reference to the button container
    this.commentUIElements.set(field, buttonContainer);
  }
  
  /**
   * Generate a unique ID for the field
   */
  generateFieldId(field: HTMLElement): string {
    // Create unique ID if not already present
    if (!field.id) {
      field.id = `engageiq-field-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    }
    return field.id;
  }
  
  /**
   * Handle click on generate button
   */
  handleGenerateClick(field: HTMLElement) {
    if (this.isGenerating || !this.currentPostContent) {
      return;
    }
    
    // Set generating state
    this.isGenerating = true;
    
    // Update button UI to show loading state
    const fieldId = this.generateFieldId(field);
    const button = document.querySelector(`[data-field-id="${fieldId}"]`);
    if (button) {
      // Replace icon with spinner
      button.innerHTML = `
        <svg class="engageiq-spinner" width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="white" fill="none" stroke-width="3" stroke-dasharray="30 10" />
        </svg>
      `;
      
      // Add spinning animation
      const style = document.createElement('style');
      style.innerHTML = `
        .engageiq-spinner {
          animation: engageiq-spin 1s linear infinite;
        }
        @keyframes engageiq-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
      
      // Update tooltip if it exists
      const tooltip = button.querySelector('.engageiq-tooltip');
      if (tooltip) {
        tooltip.textContent = 'Generating...';
        (tooltip as HTMLElement).style.opacity = '1';
      }
    }
    
    // Request comment generation from background script
    chrome.runtime.sendMessage({
      type: 'GENERATE_COMMENT',
      payload: {
        postContent: this.currentPostContent,
        options: {
          tone: 'professional', // Default tone
          length: 'medium' // Default length
        }
      }
    }, (response: EngageIQ.CommentGenerationResponse) => {
      this.isGenerating = false;
      
      if (response.error) {
        console.error('Error generating comments:', response.error);
        this.showErrorUI(field, response.error);
        return;
      }
      
      if (response.success && response.comments) {
        this.showCommentsUI(field, response.comments);
      }
    });
  }
  
  /**
   * Show error UI
   */
  showErrorUI(field: HTMLElement, errorMessage: string) {
    const fieldId = this.generateFieldId(field);
    const button = document.querySelector(`[data-field-id="${fieldId}"]`);
    if (button) {
      // Update button to show error state
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22ZM12 20C16.418 20 20 16.418 20 12C20 7.582 16.418 4 12 4C7.582 4 4 7.582 4 12C4 16.418 7.582 20 12 20ZM11 15H13V17H11V15ZM11 7H13V13H11V7Z" fill="white"/>
        </svg>
      `;
      
      // Change button background to indicate error
      (button as HTMLElement).style.backgroundColor = '#e53935';
      
      // Create tooltip with error
      const tooltip = document.createElement('div');
      tooltip.className = 'engageiq-error-tooltip';
      tooltip.style.cssText = `
        position: absolute;
        bottom: 40px;
        right: 0;
        background-color: #fff;
        border: 1px solid #d0d0d0;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 12px;
        color: #d93025;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        max-width: 250px;
        z-index: 1001;
      `;
      tooltip.textContent = errorMessage || 'Error generating comment';
      
      // Add close button
      const closeButton = document.createElement('div');
      closeButton.style.cssText = `
        position: absolute;
        top: 6px;
        right: 6px;
        cursor: pointer;
        font-size: 10px;
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: #f5f5f5;
      `;
      closeButton.innerHTML = '✕';
      closeButton.addEventListener('click', () => {
        tooltip.remove();
      });
      
      tooltip.appendChild(closeButton);
      
      // Add to parent of button
      const buttonContainer = button.closest('.engageiq-button-container');
      if (buttonContainer) {
        buttonContainer.appendChild(tooltip);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          tooltip.remove();
          // Reset button
          const iconUrl = chrome.runtime.getURL('icons/icon16.png');
          button.innerHTML = `
            <img src="${iconUrl}" width="16" height="16" alt="EngageIQ" style="object-fit: contain;" />
          `;
          (button as HTMLElement).style.backgroundColor = '#0a66c2';
          (button as HTMLElement).style.transform = 'scale(1)';
        }, 5000);
      }
    }
  }
  
  /**
   * Show comments UI with generated options
   */
  showCommentsUI(field: HTMLElement, comments: EngageIQ.CommentResponse) {
    // Remove any existing comment UI
    const fieldId = this.generateFieldId(field);
    const existingUI = document.querySelector(`.engageiq-comments-ui[data-field-id="${fieldId}"]`);
    if (existingUI) {
      existingUI.remove();
    }
    
    // Reset generate button
    const button = document.querySelector(`[data-field-id="${fieldId}"]`);
    if (button) {
      const iconUrl = chrome.runtime.getURL('icons/icon16.png');
      button.innerHTML = `
        <img src="${iconUrl}" width="16" height="16" alt="EngageIQ" style="object-fit: contain;" />
      `;
      
      // Add back the tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'engageiq-tooltip';
      tooltip.style.cssText = `
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
      `;
      tooltip.textContent = 'Generate AI Comment';
      button.appendChild(tooltip);
    }
    
    // Create comments UI container
    const commentsUI = document.createElement('div');
    commentsUI.className = 'engageiq-comments-ui';
    commentsUI.setAttribute('data-field-id', fieldId);
    commentsUI.style.cssText = `
      position: absolute;
      bottom: 50px;
      right: 0;
      background-color: white;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      width: 350px;
      max-height: 400px;
      overflow-y: auto;
      z-index: 1001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    `;
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 12px 16px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    const title = document.createElement('h3');
    title.style.cssText = `
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    `;
    title.textContent = 'AI Comment Suggestions';
    
    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
      background: none;
      border: none;
      cursor: pointer;
      color: #666;
      padding: 4px;
      font-size: 18px;
      line-height: 1;
    `;
    closeButton.innerHTML = '✕';
    closeButton.addEventListener('click', () => {
      commentsUI.remove();
    });
    
    header.appendChild(title);
    header.appendChild(closeButton);
    commentsUI.appendChild(header);
    
    // Create comment options
    const commentOptions = document.createElement('div');
    commentOptions.style.cssText = `
      padding: 12px 16px;
    `;
    
    // Map of tone to icon
    const toneIcons = {
      supportive: '👍',
      insightful: '💡',
      curious: '🤔',
      professional: '👔'
    };
    
    // Create a card for each comment type
    Object.entries(comments).forEach(([tone, comment]) => {
      const card = document.createElement('div');
      card.className = 'engageiq-comment-card';
      card.style.cssText = `
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        border: 1px solid #e0e0e0;
      `;
      
      // Add hover effect
      card.addEventListener('mouseover', () => {
        card.style.backgroundColor = '#f0f7ff';
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = '0 4px 8px rgba(0,0,0,0.05)';
      });
      
      card.addEventListener('mouseout', () => {
        card.style.backgroundColor = '#f9f9f9';
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
      });
      
      // Add click to insert
      card.addEventListener('click', () => {
        this.insertComment(comment, fieldId);
        commentsUI.remove();
      });
      
      // Create header with tone
      const cardHeader = document.createElement('div');
      cardHeader.style.cssText = `
        display: flex;
        align-items: center;
        margin-bottom: 8px;
      `;
      
      const icon = document.createElement('span');
      icon.style.cssText = `
        margin-right: 8px;
        font-size: 16px;
      `;
      icon.textContent = toneIcons[tone as keyof typeof toneIcons] || '💬';
      
      const toneLabel = document.createElement('span');
      toneLabel.style.cssText = `
        font-size: 12px;
        font-weight: 600;
        color: #0a66c2;
        text-transform: capitalize;
      `;
      toneLabel.textContent = tone.replace('_', ' ');
      
      cardHeader.appendChild(icon);
      cardHeader.appendChild(toneLabel);
      
      // Create comment text
      const commentText = document.createElement('p');
      commentText.style.cssText = `
        margin: 0;
        font-size: 13px;
        line-height: 1.4;
        color: #333;
      `;
      commentText.textContent = comment;
      
      // Create action button
      const useButton = document.createElement('button');
      useButton.style.cssText = `
        background-color: transparent;
        color: #0a66c2;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        margin-top: 8px;
        cursor: pointer;
        font-weight: 600;
      `;
      useButton.textContent = 'Use this comment';
      useButton.addEventListener('mouseover', () => {
        useButton.style.backgroundColor = '#e8f0fe';
      });
      useButton.addEventListener('mouseout', () => {
        useButton.style.backgroundColor = 'transparent';
      });
      
      // Add elements to card
      card.appendChild(cardHeader);
      card.appendChild(commentText);
      card.appendChild(useButton);
      
      // Add card to options container
      commentOptions.appendChild(card);
    });
    
    commentsUI.appendChild(commentOptions);
    
    // Add footer with credits
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 8px 16px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #666;
    `;
    
    const credits = document.createElement('span');
    credits.textContent = 'Powered by EngageIQ';
    
    const regenerateButton = document.createElement('button');
    regenerateButton.style.cssText = `
      background: none;
      border: none;
      color: #0a66c2;
      font-size: 11px;
      cursor: pointer;
      font-weight: 600;
    `;
    regenerateButton.textContent = 'Regenerate';
    regenerateButton.addEventListener('click', () => {
      commentsUI.remove();
      this.handleGenerateClick(field);
    });
    
    footer.appendChild(credits);
    footer.appendChild(regenerateButton);
    commentsUI.appendChild(footer);
    
    // Find where to add the UI
    const buttonContainer = button?.closest('.engageiq-button-container');
    if (buttonContainer?.parentElement) {
      buttonContainer.parentElement.appendChild(commentsUI);
    }
  }
  
  /**
   * Insert a comment into the field
   */
  insertComment(comment: string, fieldId?: string) {
    if (!fieldId) {
      console.warn('No field ID provided for comment insertion');
      return;
    }
    
    const field = document.getElementById(fieldId);
    if (!field) {
      console.warn(`Field with ID ${fieldId} not found`);
      return;
    }
    
    // Handle different types of input fields
    if (field.hasAttribute('contenteditable')) {
      // ContentEditable field (most LinkedIn comment fields)
      field.textContent = comment;
      
      // Trigger input event to notify LinkedIn
      const inputEvent = new Event('input', { bubbles: true });
      field.dispatchEvent(inputEvent);
    } else if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement) {
      // Text input field
      field.value = comment;
      
      // Trigger input event
      const inputEvent = new Event('input', { bubbles: true });
      field.dispatchEvent(inputEvent);
    }
    
    // Focus the field after insertion
    field.focus();
  }
  
  /**
   * Extract post content for context
   */
  extractPostContent(commentField: HTMLElement): EngageIQ.PostContent | null {
    // Find the post container
    console.log('EngageIQ: Extracting post content for comment field', commentField);
    let postContainer = this.findPostContainer(commentField);
    
    if (!postContainer) {
      console.warn('EngageIQ: Could not find post container for comment field');
      
      // Log all parent elements to help debug
      console.log('EngageIQ: Parent elements:');
      let parent = commentField.parentElement;
      let depth = 0;
      while (parent && depth < 5) {
        console.log(`EngageIQ: Parent level ${depth}:`, parent);
        console.log(`EngageIQ: Classes: "${parent.className}"`);
        parent = parent.parentElement;
        depth++;
      }
      
      return {
        text: "Could not extract post content",
        author: "Unknown"
      };
    }
    
    console.log('EngageIQ: Found post container:', postContainer);
    console.log('EngageIQ: Post container classes:', postContainer.className);
    
    // Extract post text
    const postTextElements = postContainer.querySelectorAll('.feed-shared-update-v2__description-wrapper, .feed-shared-text');
    let postText = '';
    
    console.log(`EngageIQ: Found ${postTextElements.length} text elements in the post`);
    
    postTextElements.forEach((element, index) => {
      const text = element.textContent?.trim();
      if (text) {
        console.log(`EngageIQ: Text element ${index}:`, text.substring(0, 50) + (text.length > 50 ? '...' : ''));
        postText += text + ' ';
      }
    });
    
    // If no post text found, try more general selectors
    if (!postText) {
      console.log('EngageIQ: No post text found with primary selectors, trying alternative selectors');
      const alternativeTextElements = postContainer.querySelectorAll('p, div[dir="ltr"], .update-components-text');
      alternativeTextElements.forEach((element, index) => {
        // Skip elements that are likely not part of the main post content
        if (element.closest('.comments-comment-item') || 
            element.closest('form') ||
            element.getAttribute('data-engageiq-ui') === 'true') {
          return;
        }
        
        const text = element.textContent?.trim();
        if (text) {
          console.log(`EngageIQ: Alternative text element ${index}:`, text.substring(0, 50) + (text.length > 50 ? '...' : ''));
          postText += text + ' ';
        }
      });
    }
    
    // Extract author name
    let authorName = 'LinkedIn User';
    const authorElements = postContainer.querySelectorAll('.feed-shared-actor__name, .update-components-actor__name');
    
    console.log(`EngageIQ: Found ${authorElements.length} author elements`);
    
    if (authorElements.length > 0) {
      authorName = authorElements[0].textContent?.trim() || authorName;
      console.log('EngageIQ: Author name:', authorName);
    } else {
      // Try alternative author selectors
      const alternativeAuthorElements = postContainer.querySelectorAll('a[href*="/in/"], .update-components-actor');
      if (alternativeAuthorElements.length > 0) {
        const potentialAuthor = alternativeAuthorElements[0].textContent?.trim();
        if (potentialAuthor) {
          authorName = potentialAuthor;
          console.log('EngageIQ: Author name from alternative selector:', authorName);
        }
      }
    }
    
    // Check for image content
    const imageElements = postContainer.querySelectorAll('img.feed-shared-image, .update-components-image img');
    const images: string[] = [];
    
    console.log(`EngageIQ: Found ${imageElements.length} image elements`);
    
    imageElements.forEach((img, index) => {
      const src = (img as HTMLImageElement).src;
      if (src) {
        console.log(`EngageIQ: Image ${index} source:`, src.substring(0, 50) + (src.length > 50 ? '...' : ''));
        images.push(src);
      }
    });
    
    // Get post URL if possible
    let url = '';
    const linkElements = postContainer.querySelectorAll('.feed-shared-control-menu__trigger, .update-components-action-menu');
    if (linkElements.length > 0) {
      console.log('EngageIQ: Found potential link element for post URL');
      // The post ID might be in a related attribute
      url = window.location.href; // Fallback to current page URL
      console.log('EngageIQ: Using current page URL:', url);
    }
    
    const postContent = {
      text: postText || 'LinkedIn post',
      author: authorName,
      images: images.length > 0 ? images : undefined,
      url: url || undefined
    };
    
    console.log('EngageIQ: Extracted post content:', postContent);
    
    return postContent;
  }
  
  /**
   * Find the post container for a comment field
   */
  findPostContainer(commentField: HTMLElement): HTMLElement | null {
    console.log('EngageIQ: Finding post container for comment field');
    
    // Try various parent selectors based on LinkedIn's DOM structure
    const possibleContainers = [
      '.feed-shared-update-v2',
      '.update-components-update',
      '.feed-shared-update',
      '.comments-comment-item', // For replies on comments
      '.occludable-update', // Feed items
      '.scaffold-finite-scroll__content', // Newer LinkedIn feed structure
      '.ember-view.occludable-update'
    ];
    
    console.log('EngageIQ: Checking for container selectors:', possibleContainers.join(', '));
    
    // Search up the DOM tree
    let currentElement: HTMLElement | null = commentField;
    const maxLevels = 10; // Prevent searching too far up
    let level = 0;
    
    while (currentElement && level < maxLevels) {
      // Log the element we're checking
      console.log(`EngageIQ: Checking level ${level}:`, currentElement);
      console.log(`EngageIQ: Classes: "${currentElement.className}"`);
      
      // Check if current element matches any of our selectors
      for (const selector of possibleContainers) {
        if (currentElement.matches(selector)) {
          console.log(`EngageIQ: Found matching container with selector: ${selector}`, currentElement);
          return currentElement;
        }
      }
      
      // Check if any direct ancestor matches
      for (const selector of possibleContainers) {
        const matchingAncestor = currentElement.closest(selector);
        if (matchingAncestor) {
          console.log(`EngageIQ: Found matching ancestor with selector: ${selector}`, matchingAncestor);
          return matchingAncestor as HTMLElement;
        }
      }
      
      // Move up the tree
      currentElement = currentElement.parentElement;
      level++;
    }
    
    // Try a more aggressive approach with broader selectors
    console.log('EngageIQ: No container found with primary selectors, trying broader search');
    
    const broaderSelectors = [
      'article',
      '.feed-shared-update',
      '.update-components-update',
      '.occludable-update',
      'div[data-urn]',
      'div[data-id]'
    ];
    
    let rootElement = commentField;
    // Get a higher-level parent to start broader search
    for (let i = 0; i < 3 && rootElement.parentElement; i++) {
      rootElement = rootElement.parentElement;
    }
    
    // Try the broader selectors
    for (const selector of broaderSelectors) {
      const elements = document.querySelectorAll(selector);
      console.log(`EngageIQ: Found ${elements.length} elements with selector: ${selector}`);
      
      // Find the closest container by proximity in the DOM
      for (const element of elements) {
        if (element.contains(commentField)) {
          console.log(`EngageIQ: Found containing element with broader selector: ${selector}`, element);
          return element as HTMLElement;
        }
      }
    }
    
    console.log('EngageIQ: No post container found');
    return null;
  }
  
  /**
   * Handle comment generation response
   */
  handleCommentGenerated(comments: EngageIQ.CommentResponse) {
    console.log('Received generated comments:', comments);
  }
  
  /**
   * Utility function to debounce frequent events
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    
    return function executedFunction(...args: Parameters<T>) {
      const later = () => {
        timeout = null;
        func(...args);
      };
      
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize the LinkedIn integration when DOM is fully loaded
window.addEventListener('load', () => {
  const integration = new LinkedInIntegration();
  integration.init();
});