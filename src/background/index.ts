/// <reference types="chrome"/>

import { ApiKeyService } from '../core/services/ApiKeyService';
import { CommentGenerationService } from '../core/services/CommentGenerationService';
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
  _sender, 
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
              const { postContent, options } = message.payload;
              const comments = await CommentGenerationService.generateComments(postContent, options);
              sendResponse({ success: true, comments });
            } catch (error) {
              ErrorHandler.handleError(error as Error, 'CommentGeneration');
              sendResponse({ 
                error: `Comment generation failed: ${(error as Error).message}`,
                errorDetails: (error as Error).message 
              });
            }
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