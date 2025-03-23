import { ICommentDisplay } from '../services/interfaces/ICommentDisplay';
import { ThemeDetector } from '../services/ThemeDetector';
import { Logger } from '../services/Logger';
// import { DOMUtils } from '../utils/DOMUtils';

/**
 * Type definition for comment length options
 */
export type CommentLength = 'very_short' | 'short' | 'medium' | 'long' | 'very_long';

/**
 * CommentDisplay - UI component for displaying generated comments
 */
export class CommentDisplay implements ICommentDisplay {
  private logger: Logger;
  private themeDetector: ThemeDetector;
  private selectedLength: CommentLength = 'medium'; // Default length
  
  constructor() {
    this.logger = new Logger('CommentDisplay');
    this.themeDetector = new ThemeDetector();
    
    // Load user preference
    this.loadLengthPreference();
  }
  
  /**
   * Load comment length preference from storage
   */
  private async loadLengthPreference(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ 
        type: 'GET_COMMENT_LENGTH_PREFERENCE' 
      });
      
      if (response && response.preference) {
        this.selectedLength = response.preference;
        this.logger.info('Loaded length preference:', this.selectedLength);
      }
    } catch (error) {
      this.logger.error('Error loading length preference:', error);
    }
  }
  
  /**
   * Save comment length preference to storage
   */
  private async saveLengthPreference(length: CommentLength): Promise<void> {
    try {
      await chrome.runtime.sendMessage({ 
        type: 'SET_COMMENT_LENGTH_PREFERENCE',
        payload: length
      });
      this.logger.info('Saved length preference:', length);
    } catch (error) {
      this.logger.error('Error saving length preference:', error);
    }
  }
  
  /**
   * Show the comments UI for a field
   * @param comments Generated comments
   * @param fieldId ID of the comment field
   */
  showCommentsUI(comments: any, fieldId: string): void {
    this.logger.info('Showing comments UI for', { comments, fieldId });
    
    // Find the field
    const field = document.getElementById(fieldId);
    if (!field) {
      console.warn('⚠️ CommentDisplay: Field not found:', fieldId);
      return;
    }
    
    // Determine if we're in dark mode
    const isDarkMode = this.themeDetector.isDarkMode();
    
    // Create the comments UI container
    const commentsUI = document.createElement('div');
    commentsUI.className = 'engageiq-comments-ui';
    commentsUI.style.cssText = `
      position: absolute;
      width: 360px;
      max-width: 90vw;
      background-color: ${isDarkMode ? '#1d2226' : 'white'};
      color: ${isDarkMode ? '#f5f5f5' : '#1d2226'};
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      padding: 16px;
      max-height: 80vh;
      overflow-y: auto;
      font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
    `;
    
    // Position the comments UI
    const fieldRect = field.getBoundingClientRect();
    commentsUI.style.top = `${window.scrollY + fieldRect.bottom + 8}px`;
    commentsUI.style.left = `${window.scrollX + fieldRect.left}px`;
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'AI Comment Suggestions';
    title.style.cssText = `
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    `;
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: ${isDarkMode ? '#f5f5f5' : '#1d2226'};
    `;
    closeButton.addEventListener('click', () => commentsUI.remove());
    
    header.appendChild(title);
    header.appendChild(closeButton);
    commentsUI.appendChild(header);
    
    // Add length preference selector
    const lengthPreferenceSection = this.createLengthPreferenceSelector(isDarkMode, fieldId, commentsUI);
    commentsUI.appendChild(lengthPreferenceSection);
    
    // Create content
    const content = document.createElement('div');
    
    // Add each comment
    for (const tone in comments) {
      const commentCard = this.createCommentCard(comments[tone], tone, isDarkMode, fieldId, commentsUI);
      content.appendChild(commentCard);
    }
    
    commentsUI.appendChild(content);
    
    // Add keyboard handling
    this.setupKeyboardNavigation(commentsUI);
    
    // Add to DOM
    document.body.appendChild(commentsUI);
  }
  
  /**
   * Create length preference selector UI
   * @param isDarkMode Whether dark mode is active
   * @param fieldId The ID of the comment field
   * @param commentsUI The comments UI container element
   * @returns HTMLElement containing the length preference UI
   */
  private createLengthPreferenceSelector(isDarkMode: boolean, fieldId: string, commentsUI: HTMLElement): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid ${isDarkMode ? '#424242' : '#e0e0e0'};
    `;
    
    // Label
    const label = document.createElement('div');
    label.textContent = 'Comment Length:';
    label.style.cssText = `
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 8px;
      color: ${isDarkMode ? '#dfdfdf' : '#666'};
    `;
    container.appendChild(label);
    
    // Length options container
    const optionsContainer = document.createElement('div');
    optionsContainer.style.cssText = `
      display: flex;
      justify-content: space-between;
      gap: 8px;
    `;
    
    const lengthOptions: CommentLength[] = ['very_short', 'short', 'medium', 'long', 'very_long'];
    
    // Create each length option button
    lengthOptions.forEach(length => {
      const option = document.createElement('button');
      const displayName = this.formatLengthName(length);
      option.textContent = displayName;
      
      const isSelected = length === this.selectedLength;
      
      // Apply proper styling for the selected option
      this.applyButtonStyle(option, isSelected, isDarkMode);
      
      option.addEventListener('click', () => {
        const previousLength = this.selectedLength;
        this.selectedLength = length;
        
        // Only regenerate if the selection actually changed
        if (previousLength !== length) {
          // Update visual selection first for immediate feedback
          const buttons = optionsContainer.querySelectorAll('button');
          buttons.forEach(btn => {
            const isCurrentButton = btn === option;
            this.applyButtonStyle(btn, isCurrentButton, isDarkMode);
          });
          
          // Save the user's preference
          this.saveLengthPreference(length);
          
          // Generate new comments with the selected length
          this.regenerateComments(fieldId, commentsUI);
        }
      });
      
      optionsContainer.appendChild(option);
    });
    
    container.appendChild(optionsContainer);
    return container;
  }
  
  /**
   * Apply styling to a button based on selection state
   * @param button The button element to style
   * @param isSelected Whether the button is selected
   * @param isDarkMode Whether dark mode is active
   */
  private applyButtonStyle(button: HTMLButtonElement, isSelected: boolean, isDarkMode: boolean): void {
    button.style.backgroundColor = isSelected 
      ? (isDarkMode ? '#0073b1' : '#0a66c2') 
      : (isDarkMode ? '#283339' : '#f5f5f5');
    button.style.color = isSelected 
      ? 'white' 
      : (isDarkMode ? '#a5a5a5' : '#666');
    button.style.borderColor = isSelected 
      ? (isDarkMode ? '#0073b1' : '#0a66c2') 
      : (isDarkMode ? '#424242' : '#e0e0e0');
    button.style.border = `1px solid ${button.style.borderColor}`;
    button.style.borderRadius = '16px';
    button.style.padding = '5px 0';
    button.style.fontSize = '12px';
    button.style.fontWeight = '500';
    button.style.cursor = 'pointer';
    button.style.flex = '1';
    button.style.textAlign = 'center';
    button.style.transition = 'all 0.2s ease';
  }
  
  /**
   * Format length name for display
   * @param length The length option to format
   * @returns Formatted display name
   */
  private formatLengthName(length: CommentLength): string {
    return length.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  }
  
  /**
   * Create a card for a single comment
   */
  private createCommentCard(
    comment: string, 
    tone: string, 
    isDarkMode: boolean, 
    fieldId: string,
    commentsUI: HTMLElement
  ): HTMLElement {
    const card = document.createElement('div');
    card.style.cssText = `
      background-color: ${isDarkMode ? '#283339' : '#f5f5f5'};
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
    `;
    
    // Tone label
    const toneLabel = document.createElement('div');
    toneLabel.textContent = this.formatToneName(tone);
    toneLabel.style.cssText = `
      font-size: 12px;
      font-weight: 600;
      color: ${isDarkMode ? '#a5a5a5' : '#666'};
      margin-bottom: 8px;
      text-transform: capitalize;
    `;
    
    // Comment text
    const commentText = document.createElement('div');
    commentText.textContent = comment;
    commentText.style.cssText = `
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 12px;
      white-space: pre-wrap;
    `;
    
    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      justify-content: space-between;
      gap: 8px;
    `;
    
    // Copy button
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    copyButton.style.cssText = `
      background-color: transparent;
      border: 1px solid ${isDarkMode ? '#0073b1' : '#0a66c2'};
      color: ${isDarkMode ? '#0073b1' : '#0a66c2'};
      border-radius: 16px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      flex: 1;
    `;
    
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(comment).then(() => {
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
          copyButton.textContent = originalText;
        }, 2000);
      });
    });
    
    // Use button
    const useButton = document.createElement('button');
    useButton.textContent = 'Use This Comment';
    useButton.style.cssText = `
      background-color: ${isDarkMode ? '#0073b1' : '#0a66c2'};
      color: white;
      border: none;
      border-radius: 16px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      flex: 2;
    `;
    
    useButton.addEventListener('click', () => {
      // Use the local message handler instead of sending to background script
      try {
        console.log('⭐ CommentDisplay: Inserting comment directly');
        
        // Use custom event to communicate within content script
        const insertEvent = new CustomEvent('engageiq:insert-comment', {
          detail: {
            comment,
            elementId: fieldId
          },
          bubbles: true
        });
        document.dispatchEvent(insertEvent);
        
        // Close the comment UI
        commentsUI.remove();
      } catch (error) {
        console.error('⭐ CommentDisplay: Error inserting comment:', error);
      }
    });
    
    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(useButton);
    
    card.appendChild(toneLabel);
    card.appendChild(commentText);
    card.appendChild(buttonContainer);
    
    return card;
  }
  
  /**
   * Format tone name for display
   */
  private formatToneName(tone: string): string {
    return tone.charAt(0).toUpperCase() + tone.slice(1) + ' tone';
  }
  
  /**
   * Set up keyboard navigation for the comments UI
   */
  private setupKeyboardNavigation(commentsUI: HTMLElement): void {
    document.addEventListener('keydown', (e) => {
      // Check if our UI is open
      if (!document.body.contains(commentsUI)) {
        return;
      }
      
      // Handle escape key to close
      if (e.key === 'Escape') {
        commentsUI.remove();
      }
    });
  }

  /**
   * Regenerate comments with a new length preference
   * @param fieldId ID of the comment field
   * @param commentsUI The current comments UI container
   */
  private regenerateComments(fieldId: string, commentsUI: HTMLElement): void {
    this.logger.info('Regenerating comments with new length preference', { 
      length: this.selectedLength,
      fieldId 
    });
    
    // Show loading state
    this.showLoadingState(commentsUI);
    
    // Extract post content from the field (or its closest parent post)
    const field = document.getElementById(fieldId);
    if (!field) {
      this.logger.warn('Field not found for regeneration', { fieldId });
      return;
    }
    
    // Find closest post containing this comment field (simplified extraction)
    const post = field.closest('.feed-shared-update-v2') || 
                field.closest('article') || 
                field.closest('.ember-view.occludable-update');
    
    if (!post) {
      this.logger.info('Could not find post for comment field');
      return;
    }
    
    // Extract basic post content (simplified)
    const textElement = post.querySelector('.feed-shared-update-v2__description-wrapper') || 
                      post.querySelector('.update-components-text');
    
    const postText = textElement ? textElement.textContent?.trim() : 'No text content found';
    
    // Extract author info
    const authorElement = post.querySelector('.feed-shared-actor__name') || 
                         post.querySelector('.update-components-actor__name');
    
    const author = authorElement ? authorElement.textContent?.trim() : 'Unknown author';
    
    const postContent = {
      author,
      text: postText,
      url: window.location.href
    };
    
    // Send message to background script to generate comment with new length
    chrome.runtime.sendMessage({
      type: 'GENERATE_COMMENT',
      payload: {
        fieldId: fieldId,
        postContent,
        options: {
          tone: 'all',
          length: this.selectedLength
        }
      }
    }, (response) => {
      this.logger.info('Regenerated comment response:', response);
      
      // Remove the current UI since we'll show a new one when we get the COMMENT_GENERATED message
      commentsUI.remove();
    });
  }
  
  /**
   * Show loading state in the comments UI
   * @param commentsUI The comments UI container
   */
  private showLoadingState(commentsUI: HTMLElement): void {
    // Find the content area or create one if it doesn't exist
    let content = commentsUI.querySelector('div:not(:first-child)');
    if (!content) {
      content = document.createElement('div');
      commentsUI.appendChild(content);
    }
    
    // Clear existing content
    content.innerHTML = '';
    
    // Add loading indicator
    const loadingElement = document.createElement('div');
    loadingElement.textContent = 'Generating new suggestions...';
    loadingElement.style.cssText = `
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 14px;
    `;
    
    // Add spinner
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      border: 3px solid #f3f3f3;
      border-top: 3px solid #0a66c2;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      animation: spin 2s linear infinite;
      margin: 10px auto;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    loadingElement.prepend(spinner);
    content.appendChild(loadingElement);
  }
}