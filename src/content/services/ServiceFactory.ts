import { CommentInserter } from './CommentInserter';
import { CommentDisplay } from '../ui/CommentDisplay';
import { DOMObserver } from './DOMObserver';
import { PostDetector } from './PostDetector';
import { MessageHandler } from './MessageHandler';
import { Logger } from './Logger';
import { ThemeDetector } from './ThemeDetector';

import { ICommentInserter } from './interfaces/ICommentInserter';
import { ICommentDisplay } from './interfaces/ICommentDisplay';
import { IPostDetector } from './interfaces/IPostDetector';

/**
 * Service factory for creating and managing service instances
 */
export class ServiceFactory {
  private static instance: ServiceFactory;
  
  // Service instances
  private commentInserter: ICommentInserter;
  private commentDisplay: ICommentDisplay;
  private postDetector: IPostDetector;
  private messageHandler: MessageHandler;
  private domObserver: DOMObserver;
  private logger: Logger;
  private themeDetector: ThemeDetector;
  
  private constructor() {
    // Create logger for the factory
    this.logger = new Logger('ServiceFactory');
    this.logger.info('Initializing service factory');
    
    // Create services
    this.themeDetector = new ThemeDetector();
    this.commentInserter = new CommentInserter();
    this.commentDisplay = new CommentDisplay();
    this.postDetector = new PostDetector();
    
    // Create the message handler with dependencies
    this.messageHandler = new MessageHandler(
      this.commentInserter as CommentInserter,
      this.postDetector as PostDetector
    );
    
    // Create DOM observer with callbacks
    this.domObserver = new DOMObserver(
      // Posts detected callback
      () => this.postDetector.scanForLinkedInPosts(),
      // Comment fields detected callback
      () => this.postDetector.scanForCommentFields()
    );
    
    this.logger.info('Service factory initialized');
  }
  
  /**
   * Get the single instance of the service factory
   */
  public static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }
  
  /**
   * Get the comment inserter service
   */
  getCommentInserter(): ICommentInserter {
    return this.commentInserter;
  }
  
  /**
   * Get the comment display service
   */
  getCommentDisplay(): ICommentDisplay {
    return this.commentDisplay;
  }
  
  /**
   * Get the post detector service
   */
  getPostDetector(): IPostDetector {
    return this.postDetector;
  }
  
  /**
   * Get the message handler service
   */
  getMessageHandler(): MessageHandler {
    return this.messageHandler;
  }
  
  /**
   * Get the DOM observer service
   */
  getDOMObserver(): DOMObserver {
    return this.domObserver;
  }
  
  /**
   * Get the logger service
   * @param prefix The prefix for the logger
   */
  getLogger(prefix: string): Logger {
    return new Logger(prefix);
  }
  
  /**
   * Get the theme detector service
   */
  getThemeDetector(): ThemeDetector {
    return this.themeDetector;
  }
}