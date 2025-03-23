import { ICommentInserter } from './interfaces/ICommentInserter';
import { IPostDetector } from './interfaces/IPostDetector';
import { CommentDisplay } from '../ui/CommentDisplay';

/**
 * MessageHandler - Service for handling extension messages
 */
export class MessageHandler {
  private commentDisplay: CommentDisplay;
  
  constructor(
    private commentInserter: ICommentInserter,
    private postDetector: IPostDetector
  ) {
    this.commentDisplay = new CommentDisplay();
  }
  
  /**
   * Set up message listener
   */
  setupMessageListener(): void {
    // Listen for messages from the browser extension system
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      console.log('⭐ MessageHandler: Received message:', message);
      
      if ('type' in message) {
        switch (message.type) {
          case 'COMMENT_GENERATED':
            console.log('⭐ MessageHandler: Received COMMENT_GENERATED message', message.payload);
            // Use promise-based approach for async function
            this.handleCommentGenerated(message.payload)
              .then(() => sendResponse({ success: true }))
              .catch(error => {
                console.error('Error handling comment generation:', error);
                sendResponse({ success: false, error: String(error) });
              });
            break;
            
          case 'INSERT_COMMENT':
            const insertResult = this.commentInserter.insertComment(
              message.payload.comment, 
              message.payload.elementId
            );
            sendResponse({ success: insertResult });
            break;
            
          case 'GET_LINKEDIN_POST_STATUS':
            // Trigger fresh scans
            const postsCount = this.postDetector.scanForLinkedInPosts();
            // Get number of processed comment fields
            const commentFieldsCount = this.postDetector.getCommentFieldsCount();
            
            sendResponse({ 
              success: true,
              postsDetected: postsCount,
              commentFieldsDetected: commentFieldsCount,
              url: window.location.href,
              isLinkedInPage: this.isLinkedInPage()
            });
            break;
          
          default:
            sendResponse({ error: 'Unknown message type' });
        }
      }
      
      return true; // Keep the message channel open for async response
    });
    
    // Also set up a custom event listener for direct in-page communication
    document.addEventListener('engageiq:insert-comment', (event: Event) => {
      console.log('⭐ MessageHandler: Received custom insert-comment event');
      const customEvent = event as CustomEvent;
      
      if (customEvent.detail) {
        const { comment, elementId } = customEvent.detail;
        console.log('⭐ MessageHandler: Inserting comment via custom event', { 
          commentLength: comment?.length,
          elementId 
        });
        
        this.commentInserter.insertComment(comment, elementId);
      }
    });
    
    console.log('⭐ MessageHandler: All message listeners set up');
  }
  
  /**
   * Check if the current page is a LinkedIn page
   */
  private isLinkedInPage(): boolean {
    const hostname = window.location.hostname;
    return hostname.includes('linkedin.com');
  }
  
  /**
   * Handle generated comments
   */
  private async handleCommentGenerated(payload: { comments: EngageIQ.CommentResponse, fieldId: string }): Promise<void> {
    console.log('⭐ MessageHandler: Comment generated:', payload);
    
    // Check if we have comments and a field ID
    if (!payload.comments || !payload.fieldId) {
      console.warn('⚠️ MessageHandler: Invalid payload for comment generation:', payload);
      return;
    }
    
    // Show the comments UI
    await this.commentDisplay.showCommentsUI(payload.comments, payload.fieldId);
  }
}