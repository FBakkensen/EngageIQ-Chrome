/// <reference types="chrome"/>

import { ServiceFactory } from './services/ServiceFactory';

console.log('EngageIQ.ContentScript: Content script loaded');

/**
 * Initialize the LinkedIn integration
 */
function initializeLinkedInIntegration() {
  // Get the service factory instance
  const serviceFactory = ServiceFactory.getInstance();
  
  // Get a logger
  const logger = serviceFactory.getLogger('LinkedInIntegration');
  logger.info('Initializing');
  
  // Get required services
  const messageHandler = serviceFactory.getMessageHandler();
  const domObserver = serviceFactory.getDOMObserver();
  const postDetector = serviceFactory.getPostDetector();
  
  // Set up message handling
  messageHandler.setupMessageListener();
  
  // Start observing DOM changes
  domObserver.startObserving();
  
  // Initial scan for LinkedIn posts
  const postsDetected = postDetector.scanForLinkedInPosts();
  logger.info(`Initial scan detected ${postsDetected} LinkedIn posts`);
  
  // Initial scan for existing comment fields
  const commentFields = postDetector.scanForCommentFields();
  logger.info(`Initial scan detected ${commentFields} comment fields`);
  
  logger.info('Initialization complete');
}

// Initialize the application
initializeLinkedInIntegration();