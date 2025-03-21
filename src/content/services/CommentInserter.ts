import { ICommentInserter } from './interfaces/ICommentInserter';
import { Logger } from './Logger';
import { ThemeDetector } from './ThemeDetector';

/**
 * CommentInserter - Service for inserting comments into LinkedIn input fields
 */
export class CommentInserter implements ICommentInserter {
  private logger: Logger;
  private themeDetector: ThemeDetector;
  
  constructor() {
    this.logger = new Logger('CommentInserter');
    this.themeDetector = new ThemeDetector();
  }
  /**
   * Insert a comment into the field with enhanced handling for different editor states
   */
  insertComment(comment: string, fieldId?: string): boolean {
    this.logger.info('insertComment called with fieldId:', fieldId);
    
    if (!fieldId) {
      this.logger.warn('No field ID provided for comment insertion');
      return false;
    }
    
    const field = document.getElementById(fieldId);
    this.logger.info('Found field:', field);
    
    if (!field) {
      this.logger.warn(`Field with ID ${fieldId} not found`);
      return false;
    }
    
    console.log('⭐ CommentInserter: Field type check:', {
      isContentEditable: field.hasAttribute('contenteditable'),
      isInput: field instanceof HTMLInputElement,
      isTextArea: field instanceof HTMLTextAreaElement,
      tagName: field.tagName,
      className: field.className,
      existingContent: field.textContent ? field.textContent.substring(0, 30) + '...' : '(empty)'
    });
    
    // Create visual feedback container
    const feedbackContainer = this.createFeedbackElement(field);
    
    try {
      console.log('⭐ CommentInserter: Beginning comment insertion, comment length:', comment.length);
      
      // Focus the field first to ensure we can work with it
      field.focus();
      
      // Try to find the actual editor iframe or div
      // LinkedIn sometimes uses complex editor structures
      let actualEditor = field;
      
      // Look for special LinkedIn editor structures
      const editorContent = field.querySelector('.ql-editor');
      if (editorContent) {
        console.log('⭐ CommentInserter: Quill editor detected');
        actualEditor = editorContent as HTMLElement;
      }
      
      console.log('⭐ CommentInserter: Actual editor:', actualEditor);
      
      // Handle different types of input fields
      if (actualEditor.hasAttribute('contenteditable') || field.hasAttribute('contenteditable')) {
        console.log('⭐ CommentInserter: Using contenteditable insertion approach');
        
        try {
          // Try to append to existing content, not replace it
          if (actualEditor.textContent && actualEditor.textContent.trim().length > 0) {
            console.log('⭐ CommentInserter: Field has existing content, appending');
            
            // Set focus
            actualEditor.focus();
            
            // Use execCommand for insertion at cursor or end
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              console.log('⭐ CommentInserter: Active selection found, inserting at cursor');
              const range = selection.getRangeAt(0);
              range.deleteContents();
              range.insertNode(document.createTextNode(comment));
            } else {
              console.log('⭐ CommentInserter: No selection, creating one at the end');
              const range = document.createRange();
              range.selectNodeContents(actualEditor);
              range.collapse(false); // collapse to end
              selection?.removeAllRanges();
              selection?.addRange(range);
              
              if (document.queryCommandSupported('insertText')) {
                document.execCommand('insertText', false, comment);
              } else {
                // Fallback: append to textContent
                actualEditor.textContent = actualEditor.textContent + comment;
              }
            }
          } else {
            console.log('⭐ CommentInserter: Field is empty, setting content directly');
            // Field is empty, just set content directly
            actualEditor.textContent = comment;
          }
        } catch (error) {
          console.warn('⚠️ CommentInserter: Error in contenteditable insertion:', error);
          // Last resort: direct content replacement
          actualEditor.textContent = comment;
        }
        
        // Dispatch input event for LinkedIn to recognize changes
        console.log('⭐ CommentInserter: Dispatching input events');
        const inputEvent = new Event('input', { bubbles: true });
        actualEditor.dispatchEvent(inputEvent);
        
        try {
          // Special event for LinkedIn's React handlers
          const customEvent = new Event('reactchange', { bubbles: true });
          actualEditor.dispatchEvent(customEvent);
        } catch (e) {
          console.log('⚠️ CommentInserter: React change event not supported:', e);
        }
        
      } else if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement) {
        console.log('⭐ CommentInserter: Inserting into form field');
        // Store cursor position
        const start = field.selectionStart || 0;
        const end = field.selectionEnd || 0;
        
        try {
          if (field.value) {
            console.log('⭐ CommentInserter: Field has content, inserting at cursor position');
            const currentValue = field.value;
            field.value = currentValue.substring(0, start) + comment + currentValue.substring(end);
            
            // Move cursor to end of inserted text
            field.selectionStart = field.selectionEnd = start + comment.length;
          } else {
            console.log('⭐ CommentInserter: Empty field, setting value directly');
            field.value = comment;
          }
        } catch (error) {
          console.warn('⚠️ CommentInserter: Error in form field insertion:', error);
          // Direct value set as fallback
          field.value = comment;
        }
        
        // Trigger standard events for form controls
        const inputEvent = new Event('input', { bubbles: true });
        field.dispatchEvent(inputEvent);
        
        // Also trigger change for React handlers
        const changeEvent = new Event('change', { bubbles: true });
        field.dispatchEvent(changeEvent);
        
      } else {
        console.log('⭐ CommentInserter: Unknown field type, trying various methods');
        
        try {
          // Try several approaches
          if ('innerHTML' in field) {
            if (field.innerHTML && field.innerHTML.trim()) {
              field.innerHTML += comment;
            } else {
              field.innerHTML = comment;
            }
          } else if ('textContent' in field) {
            const htmlElement = field as HTMLElement;
            if (htmlElement.textContent && htmlElement.textContent.trim()) {
              htmlElement.textContent += comment;
            } else {
              htmlElement.textContent = comment;
            }
          } else if ('value' in field) {
            const inputField = field as any;
            if (inputField.value) {
              inputField.value += comment;
            } else {
              inputField.value = comment;
            }
          } else {
            console.warn('⚠️ CommentInserter: No suitable insertion method found for this field type');
            return false;
          }
        } catch (error) {
          console.error('⚠️ CommentInserter: All insertion methods failed:', error);
          return false;
        }
      }
      
      // Final focus to ensure LinkedIn recognizes the comment
      field.focus();
      
      // Show success feedback
      console.log('⭐ CommentInserter: Comment insertion successful');
      this.showInsertionFeedback(feedbackContainer, true);
      return true;
      
    } catch (error) {
      console.error('⚠️ CommentInserter: Fatal error in comment insertion:', error);
      this.showInsertionFeedback(feedbackContainer, false);
      return false;
    }
  }

  /**
   * Create a feedback element for comment insertion
   */
  private createFeedbackElement(field: HTMLElement): HTMLElement {
    // Remove any existing feedback elements first
    const existingFeedback = document.getElementById('engageiq-insertion-feedback');
    if (existingFeedback) {
      existingFeedback.remove();
    }
    
    // Create a feedback container
    const feedbackContainer = document.createElement('div');
    feedbackContainer.id = 'engageiq-insertion-feedback';
    
    // Position it near the comment field
    const fieldRect = field.getBoundingClientRect();
    feedbackContainer.style.cssText = `
      position: absolute;
      top: ${fieldRect.top - 30}px;
      left: ${fieldRect.left + fieldRect.width / 2 - 75}px;
      z-index: 9999;
      padding: 8px 12px;
      border-radius: 16px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      transform: translateY(-10px);
      opacity: 0;
      transition: opacity 0.2s, transform 0.2s;
      pointer-events: none;
    `;
    
    document.body.appendChild(feedbackContainer);
    return feedbackContainer;
  }

  /**
   * Show visual feedback for comment insertion
   */
  private showInsertionFeedback(container: HTMLElement, success: boolean): void {
    // Determine if LinkedIn is in dark mode using the ThemeDetector
    const isDarkMode = this.themeDetector.isDarkMode();
    
    // Set feedback styling based on success/failure and theme
    if (success) {
      container.style.backgroundColor = isDarkMode ? '#057642' : '#057642';
      container.style.color = 'white';
      container.textContent = 'Comment inserted ✓';
    } else {
      container.style.backgroundColor = isDarkMode ? '#b10c1d' : '#d11124';
      container.style.color = 'white';
      container.textContent = 'Insertion failed ✗';
    }
    
    // Show the feedback with animation
    setTimeout(() => {
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
    }, 10);
    
    // Hide after a delay
    setTimeout(() => {
      container.style.opacity = '0';
      container.style.transform = 'translateY(-10px)';
      
      // Remove element after animation completes
      setTimeout(() => container.remove(), 300);
    }, 2000);
  }
}