/// <reference types="chrome"/>

import { ApiKeyService } from '../core/services/ApiKeyService';
import { CommentGenerationService } from '../core/services/CommentGenerationService';
import { UserPreferencesService } from '../core/services/UserPreferencesService';
import { ErrorHandler } from '../core/utils/ErrorHandler';

console.log('EngageIQ background service worker loaded');

/**
 * Initialize the extension
 */
async function initializeExtension() {
  console.log('Initializing EngageIQ extension...');
  
  // Check if API key is configured
  try {
    const apiKey = await ApiKeyService.getApiKey();
    if (apiKey) {
      console.log('API key found');
      
      // Validate key on startup
      const isValid = await ApiKeyService.validateApiKey(apiKey);
      console.log('API key validation status:', isValid ? 'valid' : 'invalid');
    } else {
      console.log('No API key configured');
    }
  } catch (error) {
    ErrorHandler.handleError(error as Error, 'Initialization');
  }
}

// Run initialization
initializeExtension().catch(error => {
  ErrorHandler.handleError(error as Error, 'Initialization');
});

/**
 * Message handler for extension communication
 */
chrome.runtime.onMessage.addListener((
  message: EngageIQ.MessageType, 
  sender, 
  sendResponse
) => {
  console.log('Received message:', message);
  
  // Handle different message types
  (async () => {
    try {
      if ('type' in message) {
        switch (message.type) {
          case 'GET_API_KEY': {
            const apiKey = await ApiKeyService.getApiKey();
            const isValid = await ApiKeyService.validateApiKey(apiKey);
            sendResponse({ apiKey, isValid });
            break;
          }
          
          case 'SET_API_KEY': {
            if (!message.payload) {
              // Handle clearing the API key
              await ApiKeyService.clearApiKey();
              sendResponse({ success: true, isValid: false });
            } else {
              // Handle saving the API key
              await ApiKeyService.saveApiKey(message.payload);
              const isValid = await ApiKeyService.validateApiKey(message.payload);
              sendResponse({ success: true, isValid });
            }
            break;
          }
          
          case 'VALIDATE_API_KEY': {
            const isValid = await ApiKeyService.validateApiKey(message.payload);
            sendResponse({ isValid });
            break;
          }
          
          case 'GENERATE_COMMENT': {
            try {
              const { postContent, options, fieldId } = message.payload;
              
              // Log some details about the request
              console.log('Generating comment with the following data:');
              console.log('Post text:', postContent.text?.substring(0, 100) + (postContent.text?.length > 100 ? '...' : ''));
              console.log('Post type:', postContent.postType);
              console.log('Options:', JSON.stringify(options));
              console.log('Field ID:', fieldId);
              
              // Generate comments
              const comments = await CommentGenerationService.generateComments(postContent, options);
              
              // Log success (but not the actual comments to avoid cluttering logs)
              console.log('Comment generation successful with Gemini API');
              
              // Send the COMMENT_GENERATED message back to the content script
              if (sender && sender.tab && sender.tab.id) {
                chrome.tabs.sendMessage(sender.tab.id, {
                  type: 'COMMENT_GENERATED',
                  payload: {
                    comments,
                    fieldId
                  }
                });
                console.log('Sent COMMENT_GENERATED message to content script');
              } else {
                console.error('Cannot send COMMENT_GENERATED message: sender tab information missing');
              }
              
              // Also send back the direct response
              sendResponse({ success: true, comments });
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              
              // Categorize the error type for better user feedback
              const isApiKeyError = errorMessage.includes('API key') || errorMessage.includes('key');
              const isNetworkError = errorMessage.includes('network') || errorMessage.includes('fetch');
              const isRateLimitError = errorMessage.includes('rate') || errorMessage.includes('quota') || 
                                      errorMessage.includes('429');
              
              // Handle specific error types
              let userFriendlyMessage = 'Comment generation failed';
              
              if (isApiKeyError) {
                userFriendlyMessage = 'API key issue: Please check your Gemini API key in the extension options';
              } else if (isNetworkError) {
                userFriendlyMessage = 'Network error: Could not connect to Gemini API';
              } else if (isRateLimitError) {
                userFriendlyMessage = 'Rate limit exceeded: Please try again later';
              }
              
              // Log the error
              ErrorHandler.handleError(error as Error, 'CommentGeneration');
              
              // Send response with appropriate error message
              sendResponse({ 
                success: false,
                error: userFriendlyMessage,
                errorDetails: errorMessage,
                errorType: isApiKeyError ? 'API_KEY' : 
                           isNetworkError ? 'NETWORK' : 
                           isRateLimitError ? 'RATE_LIMIT' : 'OTHER'
              });
            }
            break;
          }
          
          case 'GET_COMMENT_LENGTH_PREFERENCE': {
            const preference = await UserPreferencesService.getCommentLengthPreference();
            sendResponse({ preference });
            break;
          }
          
          case 'SET_COMMENT_LENGTH_PREFERENCE': {
            console.log('Saving comment length preference:', message.payload);
            try {
              await UserPreferencesService.saveCommentLengthPreference(message.payload);
              console.log('Successfully saved length preference');
              sendResponse({ success: true });
            } catch (error) {
              console.error('Error saving length preference:', error);
              sendResponse({ 
                success: false, 
                error: `Failed to save preference: ${error instanceof Error ? error.message : String(error)}` 
              });
            }
            break;
          }
          
          case 'RESET_COMMENT_LENGTH_PREFERENCE': {
            await UserPreferencesService.resetCommentLengthPreference();
            sendResponse({ success: true });
            break;
          }
          
          case 'GET_LINKEDIN_STATUS': {
            // Check for LinkedIn tabs
            chrome.tabs.query({ url: "*://*.linkedin.com/*" }, (tabs) => {
              sendResponse({ 
                linkedinTabExists: tabs.length > 0,
                activeTab: tabs.length > 0 ? tabs[0] : null
              });
            });
            break;
          }
          
          default:
            sendResponse({ error: 'Unknown message type' });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      ErrorHandler.handleError(error as Error, 'MessageProcessing');
      sendResponse({ error: `Error processing message: ${errorMessage}` });
    }
  })();
  
  return true; // Keep the message channel open for async response
});

// Listen for extension installation or update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
    // Could open options page for initial setup
    chrome.runtime.openOptionsPage();
  } else if (details.reason === 'update') {
    console.log(`Extension updated from ${details.previousVersion} to ${chrome.runtime.getManifest().version}`);
  }
});

// Extension lifecycle events
chrome.runtime.onSuspend.addListener(() => {
  console.log('Extension suspending...');
  // Perform cleanup if needed
});