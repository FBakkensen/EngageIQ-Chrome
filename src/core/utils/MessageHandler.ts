/**
 * Utility for handling message passing in Chrome extension
 */
import { ErrorHandler } from './ErrorHandler';

export class MessageHandler {
  /**
   * Sends a message to the background script and returns a promise with the response
   */
  static async sendMessage<T = any>(message: EngageIQ.MessageType): Promise<T> {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            ErrorHandler.handleError(chrome.runtime.lastError.message || 'Unknown error', 'MessageHandler');
            reject(chrome.runtime.lastError);
            return;
          }
          
          if (response && response.error) {
            reject(new Error(response.error));
            return;
          }
          
          resolve(response as T);
        });
      } catch (error) {
        ErrorHandler.handleError(error as Error, 'MessageHandler');
        reject(error);
      }
    });
  }

  /**
   * Sends a message to a specific tab
   */
  static async sendMessageToTab<T = any>(tabId: number, message: EngageIQ.MessageType): Promise<T> {
    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (chrome.runtime.lastError) {
            ErrorHandler.handleError(chrome.runtime.lastError.message || 'Unknown error', 'MessageHandler');
            reject(chrome.runtime.lastError);
            return;
          }
          
          if (response && response.error) {
            reject(new Error(response.error));
            return;
          }
          
          resolve(response as T);
        });
      } catch (error) {
        ErrorHandler.handleError(error as Error, 'MessageHandler');
        reject(error);
      }
    });
  }

  /**
   * Registers a message listener for content scripts
   */
  static registerContentScriptListener(handler: (
    message: EngageIQ.MessageType, 
    sender: chrome.runtime.MessageSender, 
    sendResponse: (response?: any) => void
  ) => boolean | void): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      try {
        return handler(message, sender, sendResponse);
      } catch (error) {
        ErrorHandler.handleError(error as Error, 'ContentScriptListener');
        sendResponse({ error: `Error processing message: ${(error as Error).message}` });
        return false;
      }
    });
  }
}