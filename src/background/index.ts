/// <reference types="chrome"/>

console.log('EngageIQ background service worker loaded');

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
  console.log('Received message:', message);
  
  // Handle message processing here
  
  return true; // Keep the message channel open for async response
});
