/**
 * ServiceFactory Mock
 * 
 * Mock implementation of the ServiceFactory for testing
 */

/**
 * Basic service interfaces for mocking
 */
export interface ICommentInserter {
  insertComment: jest.Mock;
}

export interface ICommentDisplay {
  show: jest.Mock;
  hide: jest.Mock;
}

export interface IPostDetector {
  scanForLinkedInPosts: jest.Mock;
  scanForCommentFields: jest.Mock;
}

export interface IMessageHandler {
  handleMessage: jest.Mock;
}

export interface IDOMObserver {
  observe: jest.Mock;
  disconnect: jest.Mock;
}

export interface ILogger {
  info: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
  debug: jest.Mock;
}

export interface IThemeDetector {
  isDarkTheme: jest.Mock;
  isLightTheme: jest.Mock;
}

/**
 * Mock implementation of ServiceFactory
 * Follows the singleton pattern of the real ServiceFactory
 */
export class ServiceFactoryMock {
  private static instance: ServiceFactoryMock | null = null;
  
  // Mock service instances
  private commentInserter: ICommentInserter = {
    insertComment: jest.fn()
  };
  
  private commentDisplay: ICommentDisplay = {
    show: jest.fn(),
    hide: jest.fn()
  };
  
  private postDetector: IPostDetector = {
    scanForLinkedInPosts: jest.fn(),
    scanForCommentFields: jest.fn()
  };
  
  private messageHandler: IMessageHandler = {
    handleMessage: jest.fn()
  };
  
  private domObserver: IDOMObserver = {
    observe: jest.fn(),
    disconnect: jest.fn()
  };
  
  private logger: ILogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  };
  
  private themeDetector: IThemeDetector = {
    isDarkTheme: jest.fn().mockReturnValue(false),
    isLightTheme: jest.fn().mockReturnValue(true)
  };
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): ServiceFactoryMock {
    if (!ServiceFactoryMock.instance) {
      ServiceFactoryMock.instance = new ServiceFactoryMock();
    }
    return ServiceFactoryMock.instance;
  }
  
  /**
   * Reset singleton instance for testing
   */
  public static resetInstance(): void {
    ServiceFactoryMock.instance = null;
  }
  
  /**
   * Service getters
   */
  getCommentInserter(): ICommentInserter {
    return this.commentInserter;
  }
  
  getCommentDisplay(): ICommentDisplay {
    return this.commentDisplay;
  }
  
  getPostDetector(): IPostDetector {
    return this.postDetector;
  }
  
  getMessageHandler(): IMessageHandler {
    return this.messageHandler;
  }
  
  getDomObserver(): IDOMObserver {
    return this.domObserver;
  }
  
  getLogger(): ILogger {
    return this.logger;
  }
  
  getThemeDetector(): IThemeDetector {
    return this.themeDetector;
  }
  
  /**
   * Mock implementation setters (for test configuration)
   */
  setCommentInserter(mock: ICommentInserter): void {
    this.commentInserter = mock;
  }
  
  setCommentDisplay(mock: ICommentDisplay): void {
    this.commentDisplay = mock;
  }
  
  setPostDetector(mock: IPostDetector): void {
    this.postDetector = mock;
  }
  
  setMessageHandler(mock: IMessageHandler): void {
    this.messageHandler = mock;
  }
  
  setDomObserver(mock: IDOMObserver): void {
    this.domObserver = mock;
  }
  
  setLogger(mock: ILogger): void {
    this.logger = mock;
  }
  
  setThemeDetector(mock: IThemeDetector): void {
    this.themeDetector = mock;
  }
  
  /**
   * Reset all mocks
   */
  resetAllMocks(): void {
    Object.values(this.commentInserter).forEach(mock => 
      mock && typeof mock.mockClear === 'function' && mock.mockClear());
    
    Object.values(this.commentDisplay).forEach(mock => 
      mock && typeof mock.mockClear === 'function' && mock.mockClear());
    
    Object.values(this.postDetector).forEach(mock => 
      mock && typeof mock.mockClear === 'function' && mock.mockClear());
    
    Object.values(this.messageHandler).forEach(mock => 
      mock && typeof mock.mockClear === 'function' && mock.mockClear());
    
    Object.values(this.domObserver).forEach(mock => 
      mock && typeof mock.mockClear === 'function' && mock.mockClear());
    
    Object.values(this.logger).forEach(mock => 
      mock && typeof mock.mockClear === 'function' && mock.mockClear());
    
    Object.values(this.themeDetector).forEach(mock => 
      mock && typeof mock.mockClear === 'function' && mock.mockClear());
  }
} 