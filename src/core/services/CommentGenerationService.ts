/**
 * Service for generating comments using Gemini API
 */
import { ApiKeyService } from './ApiKeyService';

export class CommentGenerationService {
  // Gemini API URL would be used in production implementation
  // private static readonly API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  /**
   * Generates comments for a LinkedIn post
   */
  static async generateComments(
    postContent: EngageIQ.PostContent, 
    options: EngageIQ.CommentOptions
  ): Promise<EngageIQ.CommentResponse> {
    try {
      const apiKey = await ApiKeyService.getApiKey();
      
      if (!apiKey) {
        throw new Error('API key not configured');
      }
      
      const isValid = await ApiKeyService.validateApiKey(apiKey);
      
      if (!isValid) {
        throw new Error('Invalid API key');
      }

      // In a real implementation, this would call the Gemini API with the constructed prompt
      // For development, we'll return mock responses
      
      console.log(`Generating comment for post: ${postContent.text?.substring(0, 50)}...`);
      console.log(`With options: ${JSON.stringify(options)}`);
      
      // Generate mock comments based on options
      const comments = this.generateMockComments(postContent, options);
      
      console.log('Comment generation successful');
      return comments;
    } catch (error) {
      console.error('Error generating comments:', error);
      throw error;
    }
  }

  // This method would be used in the actual production implementation
  /* 
  private static createPrompt(
    postContent: EngageIQ.PostContent, 
    options: EngageIQ.CommentOptions
  ): string {
    // Author context
    const authorContext = postContent.author 
      ? `The post was written by ${postContent.author}.` 
      : '';
    
    // Image context
    const imageContext = postContent.images && postContent.images.length > 0
      ? `The post includes ${postContent.images.length} image(s).`
      : 'The post does not include any images.';
    
    // Length guidance
    const lengthGuidance = {
      'very_short': '1-2 sentences',
      'short': '2-3 sentences',
      'medium': '3-4 sentences',
      'long': '4-6 sentences',
      'very_long': '6-8 sentences'
    }[options.length];
    
    // Construct the prompt
    return `
      Generate a LinkedIn comment for the following post:
      "${postContent.text}"
      
      ${authorContext}
      ${imageContext}
      
      Please create a ${options.tone} comment that is ${lengthGuidance}.
      
      For tone guidance:
      - Supportive: Encouraging and positive
      - Insightful: Adding valuable perspective or information
      - Curious: Asking thoughtful questions about the content
      - Professional: Formal and business-appropriate
      
      Return the comment without any additional text or formatting.
    `;
  }
  */

  /**
   * Generates mock comments for development
   * This simulates the Gemini API response
   */
  private static generateMockComments(
    postContent: EngageIQ.PostContent, 
    options: EngageIQ.CommentOptions
  ): EngageIQ.CommentResponse {
    // Length factor for adjusting comment length
    const lengthFactors = {
      'very_short': 0.5,
      'short': 0.75,
      'medium': 1,
      'long': 1.5,
      'very_long': 2
    };
    
    const lengthFactor = lengthFactors[options.length] || 1;
    
    // Function to adjust comment length
    const adjustLength = (comment: string): string => {
      if (lengthFactor < 1) {
        // Shorten by taking first sentence or two
        const sentences = comment.split('. ');
        return sentences.slice(0, Math.max(1, Math.floor(sentences.length * lengthFactor))).join('. ');
      } else if (lengthFactor > 1) {
        // For longer comments, add additional sentences
        const extraSentences = [
          'This is particularly relevant in today\'s business environment.',
          'I\'ve seen similar approaches yield positive results.',
          'The implications for the industry are significant.',
          'It would be interesting to see how this develops over time.',
          'Have you considered exploring this from different perspectives?',
          'I appreciate you taking the time to share this valuable insight.'
        ];
        
        const numExtra = Math.floor((lengthFactor - 1) * 3);
        const selected = extraSentences.slice(0, numExtra);
        
        return `${comment} ${selected.join(' ')}`;
      }
      
      return comment;
    };

    // Generate base comments for each tone
    let baseComments: EngageIQ.CommentResponse = {
      supportive: 'Thank you for sharing this valuable perspective! It\'s great to see content that addresses these important points.',
      insightful: 'This highlights a critical aspect that many overlook. In my experience, these insights can significantly impact results.',
      curious: 'I\'m intrigued by your approach here. Have you found that this strategy consistently produces better outcomes?',
      professional: 'This is a well-articulated perspective on an important topic. The points you raise are particularly relevant to current industry trends.'
    };
    
    // If post content is available, make comments more contextual
    if (postContent.text && postContent.text.length > 0) {
      // Extract topics (very simplified for mock purposes)
      const topics = this.extractTopics(postContent.text);
      
      if (topics.length > 0) {
        const topic = topics[0];
        
        baseComments = {
          supportive: `Really appreciate you sharing this perspective on ${topic}! Your insights are valuable and timely.`,
          insightful: `Your points about ${topic} highlight a critical aspect that many overlook. This approach could be transformative.`,
          curious: `I'm intrigued by your thoughts on ${topic}. Have you found that these principles apply across different scenarios?`,
          professional: `This is a well-articulated analysis of ${topic}. The framework you've outlined aligns with emerging best practices.`
        };
      }
    }
    
    // Adjust comment lengths based on the selected option
    return {
      supportive: adjustLength(baseComments.supportive),
      insightful: adjustLength(baseComments.insightful),
      curious: adjustLength(baseComments.curious),
      professional: adjustLength(baseComments.professional)
    };
  }

  /**
   * Simple topic extraction for mock generation
   * In production, this would be done by the Gemini API
   */
  private static extractTopics(text: string): string[] {
    // This is a very simplistic approach for demonstration
    const commonTopics = [
      'leadership', 'marketing', 'sales', 'technology', 'innovation',
      'business strategy', 'professional development', 'workplace culture',
      'digital transformation', 'industry trends', 'career advice'
    ];
    
    // Find matches in the text
    return commonTopics.filter(topic => 
      text.toLowerCase().includes(topic.toLowerCase())
    );
  }
}