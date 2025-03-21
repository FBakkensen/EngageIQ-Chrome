/**
 * Type definitions for EngageIQ Chrome Extension
 */

/**
 * Message types for communication between extension components
 */
declare namespace EngageIQ {
  /**
   * API configuration
   */
  interface ApiConfig {
    apiKey: string;
    isValid: boolean;
  }

  /**
   * Comment generation options
   */
  interface CommentOptions {
    tone: 'supportive' | 'insightful' | 'curious' | 'professional';
    length: 'very_short' | 'short' | 'medium' | 'long' | 'very_long';
  }

  /**
   * Post content for processing
   */
  interface PostContent {
    text: string;
    author?: string;
    images?: string[];
    url?: string;
  }

  /**
   * Generated comment response
   */
  interface CommentResponse {
    supportive: string;
    insightful: string;
    curious: string;
    professional: string;
  }

  /**
   * Message types for extension communication
   */
  type MessageType = 
    | { type: 'GET_API_KEY' }
    | { type: 'SET_API_KEY', payload: string }
    | { type: 'VALIDATE_API_KEY', payload: string }
    | { type: 'GENERATE_COMMENT', payload: { postContent: PostContent, options: CommentOptions } }
    | { type: 'COMMENT_GENERATED', payload: CommentResponse }
    | { type: 'INSERT_COMMENT', payload: { comment: string, elementId?: string } }
    | { type: 'BUTTON_CLICKED', payload: { postId: string } }
    | { type: 'GET_LINKEDIN_STATUS' }
    | { type: 'GET_LINKEDIN_POST_STATUS' }
    | { type: 'ERROR', payload: { message: string, context: string } };
    
  /**
   * Response types for messages
   */
  interface ApiKeyResponse {
    apiKey: string;
    isValid: boolean;
  }
  
  interface ApiKeyUpdateResponse {
    success: boolean;
    isValid: boolean;
  }
  
  interface ApiKeyValidationResponse {
    isValid: boolean;
  }
  
  interface CommentGenerationResponse {
    success: boolean;
    comments: CommentResponse;
    error?: string;
    errorDetails?: string;
  }
  
  interface ErrorResponse {
    error: string;
    errorDetails?: string;
  }
  
  interface LinkedInStatusResponse {
    linkedinTabExists: boolean;
    activeTab: chrome.tabs.Tab | null;
  }
  
  interface LinkedInPostStatusResponse {
    success: boolean;
    postsDetected: number;
    commentFieldsDetected: number;
    url: string;
    isLinkedInPage: boolean;
    error?: string;
  }
  
  interface LinkedInPostStatusResponse {
    success: boolean;
    postsDetected: number;
    commentFieldsDetected: number;
    url: string;
    isLinkedInPage: boolean;
    error?: string;
  }
}