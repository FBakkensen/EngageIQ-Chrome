/**
 * Gemini API Mock
 * 
 * Provides mock responses for Gemini API requests with configurable behavior
 */

export interface GeminiResponsePart {
  text: string;
}

export interface GeminiContent {
  parts: GeminiResponsePart[];
}

export interface GeminiResponse {
  contents: GeminiContent[];
}

export interface GeminiErrorResponse {
  error: {
    code: number;
    message: string;
    status?: string;
  };
}

export type CommentStyle = 'professional' | 'casual' | 'enthusiastic' | 'inquisitive';
export type CommentLength = 'short' | 'medium' | 'long';

/**
 * Mock implementation of Gemini API for testing
 * Allows configuring responses, delays, and error states
 */
export class GeminiApiMock {
  // Default response templates for different comment styles
  private templates: Record<CommentStyle, Record<CommentLength, string>> = {
    professional: {
      short: "This is a concise professional comment.",
      medium: "This is a well-balanced professional comment that provides thoughtful insight without being overly verbose.",
      long: "This is a comprehensive professional comment that thoroughly analyzes the content, providing detailed insights and constructive feedback while maintaining a formal tone and structure. The comment is designed to demonstrate expertise in the subject matter while being respectful of different viewpoints."
    },
    casual: {
      short: "Nice post! Thanks for sharing.",
      medium: "Hey, this is really interesting! I enjoyed reading about this topic and it gave me some new ideas to think about.",
      long: "Hey there! I really enjoyed this post! It's so cool to see content like this on LinkedIn. I've been thinking about this topic a lot lately, and your perspective is super refreshing. Thanks so much for sharing - it's given me a lot to think about and I might try some of these ideas myself. Keep the great content coming! 👍"
    },
    enthusiastic: {
      short: "Wow! Absolutely love this! 🔥",
      medium: "This is AMAZING!! 🚀 I'm so excited about what you've shared here! Can't wait to see more content like this!",
      long: "OMG!!! This is INCREDIBLE!!! 🤩🔥🚀 I am absolutely BLOWN AWAY by this content! Every single point resonates so deeply! I've never been more excited about a LinkedIn post! The insights here are GAME-CHANGING and I can't wait to apply these ideas! THANK YOU for sharing such POWERFUL content! Please keep these amazing posts coming!!!"
    },
    inquisitive: {
      short: "Interesting perspective. Have you considered the alternatives?",
      medium: "I'm curious about your approach here. What led you to this conclusion? And how would this work in different contexts?",
      long: "This is a fascinating perspective that raises several questions for me. I wonder how you arrived at these conclusions? Have you explored alternative approaches? What about edge cases where these principles might not apply? I'd be very interested to hear more about the research behind these ideas and how they might evolve in different contexts. Would you be open to discussing this further?"
    }
  };

  // Configure response delay in ms
  private responseDelay = 500;
  
  // Configure success/error state
  private shouldSucceed = true;
  private errorCode = 400;
  private errorMessage = "API Error";

  /**
   * Configure response template for a specific style and length
   */
  setResponseTemplate(style: CommentStyle, length: CommentLength, template: string): void {
    this.templates[style][length] = template;
  }

  /**
   * Configure response delay
   */
  setResponseDelay(delay: number): void {
    this.responseDelay = delay;
  }

  /**
   * Configure success state
   */
  setShouldSucceed(shouldSucceed: boolean): void {
    this.shouldSucceed = shouldSucceed;
  }

  /**
   * Configure error details
   */
  setErrorDetails(code: number, message: string): void {
    this.errorCode = code;
    this.errorMessage = message;
  }

  /**
   * Generate content based on prompt
   * Simulates the Gemini API generateContent endpoint
   */
  async generateContent(prompt: string, options?: { length?: CommentLength }): Promise<GeminiResponse | GeminiErrorResponse> {
    const length = options?.length || 'medium';
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!this.shouldSucceed) {
          reject({
            error: {
              code: this.errorCode,
              message: this.errorMessage,
              status: "INVALID_ARGUMENT"
            }
          });
          return;
        }

        // Generate the response with all comment styles
        const response: GeminiResponse = {
          contents: [
            {
              parts: [
                { text: this.generateFormattedResponse(prompt, length) }
              ]
            }
          ]
        };
        
        resolve(response);
      }, this.responseDelay);
    });
  }

  /**
   * Generate a formatted response with all styles
   */
  private generateFormattedResponse(prompt: string, length: CommentLength): string {
    // Parse the prompt to determine if specific style was requested
    const includesStyle = (style: string) => prompt.toLowerCase().includes(style.toLowerCase());
    
    // Generate response based on requested style, or include all styles
    if (includesStyle('professional')) {
      return this.templates.professional[length];
    } else if (includesStyle('casual')) {
      return this.templates.casual[length];
    } else if (includesStyle('enthusiastic')) {
      return this.templates.enthusiastic[length];
    } else if (includesStyle('inquisitive')) {
      return this.templates.inquisitive[length];
    }
    
    // If no style specified, return all styles
    return Object.entries(this.templates)
      .map(([style, templates]) => `${style.toUpperCase()}:\n${templates[length]}`)
      .join('\n\n');
  }

  /**
   * Reset the mock to default state
   */
  reset(): void {
    this.templates = {
      professional: {
        short: "This is a concise professional comment.",
        medium: "This is a well-balanced professional comment that provides thoughtful insight without being overly verbose.",
        long: "This is a comprehensive professional comment that thoroughly analyzes the content, providing detailed insights and constructive feedback while maintaining a formal tone and structure. The comment is designed to demonstrate expertise in the subject matter while being respectful of different viewpoints."
      },
      casual: {
        short: "Nice post! Thanks for sharing.",
        medium: "Hey, this is really interesting! I enjoyed reading about this topic and it gave me some new ideas to think about.",
        long: "Hey there! I really enjoyed this post! It's so cool to see content like this on LinkedIn. I've been thinking about this topic a lot lately, and your perspective is super refreshing. Thanks so much for sharing - it's given me a lot to think about and I might try some of these ideas myself. Keep the great content coming! 👍"
      },
      enthusiastic: {
        short: "Wow! Absolutely love this! 🔥",
        medium: "This is AMAZING!! 🚀 I'm so excited about what you've shared here! Can't wait to see more content like this!",
        long: "OMG!!! This is INCREDIBLE!!! 🤩🔥🚀 I am absolutely BLOWN AWAY by this content! Every single point resonates so deeply! I've never been more excited about a LinkedIn post! The insights here are GAME-CHANGING and I can't wait to apply these ideas! THANK YOU for sharing such POWERFUL content! Please keep these amazing posts coming!!!"
      },
      inquisitive: {
        short: "Interesting perspective. Have you considered the alternatives?",
        medium: "I'm curious about your approach here. What led you to this conclusion? And how would this work in different contexts?",
        long: "This is a fascinating perspective that raises several questions for me. I wonder how you arrived at these conclusions? Have you explored alternative approaches? What about edge cases where these principles might not apply? I'd be very interested to hear more about the research behind these ideas and how they might evolve in different contexts. Would you be open to discussing this further?"
      }
    };
    this.responseDelay = 500;
    this.shouldSucceed = true;
    this.errorCode = 400;
    this.errorMessage = "API Error";
  }
} 