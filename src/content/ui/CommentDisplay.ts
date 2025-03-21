import { ICommentDisplay } from '../services/interfaces/ICommentDisplay';
import { ThemeDetector } from '../services/ThemeDetector';
import { Logger } from '../services/Logger';
// import { DOMUtils } from '../utils/DOMUtils';

/**
 * CommentDisplay - UI component for displaying generated comments
 */
export class CommentDisplay implements ICommentDisplay {
  private logger: Logger;
  private themeDetector: ThemeDetector;
  
  constructor() {
    this.logger = new Logger('CommentDisplay');
    this.themeDetector = new ThemeDetector();
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
      // Send message to insert comment
      chrome.runtime.sendMessage({
        type: 'INSERT_COMMENT',
        payload: {
          comment,
          elementId: fieldId
        }
      }, (response) => {
        console.log('⭐ CommentDisplay: Insert comment response:', response);
        if (response.success) {
          commentsUI.remove();
        }
      });
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
}