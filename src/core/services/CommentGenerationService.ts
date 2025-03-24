/**
 * Service for generating comments using Gemini API
 */
import { ApiKeyService } from './ApiKeyService';

export class CommentGenerationService {
  // Gemini API URL for API calls
  private static readonly API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  
  // Cache for processed images to avoid redundant processing
  private static imageCache = new Map<string, {data: string, mimeType: string, timestamp: number}>();

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

      console.log(`Generating comment for post: ${postContent.text?.substring(0, 50)}...`);
      console.log(`With options: ${JSON.stringify(options)}`);
      
      // Generate comments with real API if possible, otherwise use mock responses
      let comments: EngageIQ.CommentResponse;
      
      try {
        comments = await this.callGeminiAPI(postContent, options, apiKey);
        console.log('Gemini API comment generation successful');
      } catch (apiError) {
        console.error('Error calling Gemini API, falling back to mock comments:', apiError);
        // Fallback to mock comments if API call fails
        comments = this.generateMockComments(postContent, options);
      }
      
      return comments;
    } catch (error) {
      console.error('Error generating comments:', error);
      throw error;
    }
  }

  /**
   * Process image for Gemini API
   * @param imageUrl URL of the image to process
   * @param maxWidth Maximum width to resize image to
   * @returns Object with mimeType and base64 data or null if processing fails
   */
  private static async processImageForAPI(imageUrl: string, maxWidth = 800): Promise<{mimeType: string, data: string} | null> {
    try {
      // Check cache first (with 10-minute expiration)
      const cacheKey = `${imageUrl}_${maxWidth}`;
      const now = Date.now();
      const cachedImage = this.imageCache.get(cacheKey);
      
      if (cachedImage && (now - cachedImage.timestamp < 600000)) {
        console.log('Using cached image data');
        return { mimeType: cachedImage.mimeType, data: cachedImage.data };
      }
      
      // Validate URL format before fetching
      try {
        new URL(imageUrl);
      } catch (urlError) {
        console.error('Invalid image URL format:', imageUrl);
        return null;
      }
      
      // Set timeout for fetch operations
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error('Image fetch timed out after 5 seconds:', imageUrl);
      }, 5000);
      
      // Fetch the image
      console.log(`Fetching image: ${imageUrl}`);
      let response;
      try {
        response = await fetch(imageUrl, { 
          signal: controller.signal,
          credentials: 'omit' // Avoid sending cookies with cross-origin requests
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          console.error('Image fetch aborted (timeout):', imageUrl);
        } else {
          console.error('Network error fetching image:', fetchError);
        }
        return null;
      }
      
      if (!response.ok) {
        console.error(`Failed to fetch image: ${response.status} ${response.statusText} for URL: ${imageUrl}`);
        return null;
      }
      
      // Check content type header to verify it's an image
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        console.error(`Resource is not an image (Content-Type: ${contentType || 'unknown'}) for URL: ${imageUrl}`);
        return null;
      }
      
      // Get image as blob
      let blob;
      try {
        blob = await response.blob();
      } catch (blobError) {
        console.error('Error converting response to blob:', blobError);
        return null;
      }
      
      // Validate mime type
      if (!blob.type.startsWith('image/')) {
        console.error(`Invalid image type: ${blob.type} for URL: ${imageUrl}`);
        return null;
      }
      
      // Verify blob size is reasonable (not too small or empty)
      if (blob.size < 100) {
        console.error(`Image size too small (${blob.size} bytes) for URL: ${imageUrl}`);
        return null;
      }
      
      // Resize the image if it's too large
      let finalBlob = blob;
      let resized = false;
      
      // Resize if over 4MB or if we need to enforce maxWidth
      if (blob.size > 4 * 1024 * 1024 || maxWidth > 0) {
        try {
          finalBlob = await this.resizeImage(blob, maxWidth);
          resized = true;
          console.log(`Resized image from ${Math.round(blob.size / 1024)}KB to ${Math.round(finalBlob.size / 1024)}KB`);
        } catch (resizeError) {
          console.warn(`Image resize failed, using original: ${resizeError}`);
          // Continue with original blob if resize fails
        }
      }
      
      // Convert blob to base64
      let base64;
      try {
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('FileReader failed'));
          reader.readAsDataURL(finalBlob);
        });
      } catch (readerError) {
        console.error('Error reading image data:', readerError);
        return null;
      }
      
      // Validate base64 output
      if (!base64 || base64.length < 100) {
        console.error('Invalid base64 conversion result');
        return null;
      }
      
      // Extract actual base64 data (remove data URL prefix)
      const base64Data = base64.split(',')[1];
      
      if (!base64Data) {
        console.error('Failed to extract base64 data');
        return null;
      }
      
      // Cache result
      const result = {
        mimeType: finalBlob.type,
        data: base64Data
      };
      
      this.imageCache.set(cacheKey, { 
        ...result, 
        timestamp: now 
      });
      
      console.log(`Successfully processed image: ${imageUrl} (${finalBlob.type}, ${Math.round(finalBlob.size / 1024)}KB)${resized ? ' (resized)' : ''}`);
      
      // Limit cache size
      if (this.imageCache.size > 50) {
        // Remove oldest entries
        const entries = Array.from(this.imageCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        // Remove 10 oldest entries
        for (let i = 0; i < 10 && i < entries.length; i++) {
          this.imageCache.delete(entries[i][0]);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Unexpected error processing image:', error);
      return null;
    }
  }
  
  /**
   * Resizes an image to the specified maximum width while maintaining aspect ratio
   * @param blob Image blob to resize
   * @param maxWidth Maximum width in pixels
   * @returns Resized image blob
   */
  private static async resizeImage(blob: Blob, maxWidth: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (maxWidth > 0 && width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = Math.round(height * ratio);
        }
        
        // If image is already smaller than maxWidth, return original
        if (width === img.width && height === img.height && blob.size <= 4 * 1024 * 1024) {
          resolve(blob);
          return;
        }
        
        // Create canvas to resize the image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // Draw resized image
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert canvas to blob
        canvas.toBlob(
          (newBlob) => {
            if (newBlob) {
              resolve(newBlob);
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          blob.type,
          0.85 // Quality parameter for compression
        );
      };
      
      img.onerror = () => {
        reject(new Error('Image loading failed'));
      };
      
      // Load the image from blob
      img.src = URL.createObjectURL(blob);
    });
  }

  /**
   * Call Gemini API to generate comments
   */
  private static async callGeminiAPI(
    postContent: EngageIQ.PostContent,
    options: EngageIQ.CommentOptions,
    apiKey: string
  ): Promise<EngageIQ.CommentResponse> {
    // Detect post language to ensure response is in the same language
    const postLanguage = this.detectLanguage(postContent.text || '');
    console.log(`Detected language: ${postLanguage}`);
    
    // Determine which tones to generate
    const tones = (options.tone === 'all') 
      ? ['supportive', 'insightful', 'curious', 'professional'] as const
      : [options.tone] as const;
    
    const comments: Partial<EngageIQ.CommentResponse> = {};
    
    // Generate a comment for each requested tone
    for (const tone of tones) {
      // Create a tone-specific options object
      const toneOptions: EngageIQ.CommentOptions = {
        ...options,
        tone: tone as any
      };
      
      // Create custom prompt for this tone
      const tonePrompt = this.createPrompt(postContent, toneOptions);
      
      try {
        // API request configuration with optimized parameters based on comment length
        const temperature = options.length === 'very_short' ? 0.6 : 
                           options.length === 'short' ? 0.65 :
                           options.length === 'medium' ? 0.7 :
                           options.length === 'long' ? 0.75 : 0.8;
                           
        // Adjust max tokens based on desired comment length
        // This helps prevent unnecessarily long responses for shorter preferences
        // while allowing enough space for longer responses
        const maxTokens = options.length === 'very_short' ? 150 : 
                         options.length === 'short' ? 300 :
                         options.length === 'medium' ? 500 :
                         options.length === 'long' ? 800 : 1100;
        
        // Create parts array starting with text prompt
        const parts: any[] = [{ text: tonePrompt }];
        
        // Process images if available (limited to 5 max)
        if (postContent.images && postContent.images.length > 0) {
          console.log(`Processing ${Math.min(postContent.images.length, 5)} images for comment generation`);
          
          // Track image processing statistics
          let successfulImages = 0;
          
          // Limit to 5 images maximum to avoid excessive API usage
          const imagesToProcess = postContent.images.slice(0, 5);
          
          // Process each image
          for (const imageUrl of imagesToProcess) {
            try {
              const processedImage = await this.processImageForAPI(imageUrl);
              if (processedImage) {
                parts.push({
                  inlineData: processedImage
                });
                successfulImages++;
              }
            } catch (imageError) {
              console.error(`Error processing image ${imageUrl}:`, imageError);
              // Continue with other images
            }
          }
          
          console.log(`Successfully processed ${successfulImages}/${imagesToProcess.length} images`);
        }
        
        // Make API request with text and image parts
        const response = await fetch(`${this.API_URL}?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: parts
              }
            ],
            generationConfig: {
              temperature: temperature,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: maxTokens,
              stopSequences: []
            }
          })
        });
        
        if (!response.ok) {
          console.error(`API request failed for tone: ${tone} with status ${response.status}`);
          throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
        }
        
        const data = await response.json();
        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && data.candidates[0].content.parts && 
            data.candidates[0].content.parts.length > 0) {
          // Process the response text to remove any unwanted formatting
          let commentText = data.candidates[0].content.parts[0].text.trim();
          
          // Remove quotation marks if present
          commentText = commentText.replace(/^["']|["']$/g, '');
          
          // Apply post-processing to improve formatting
          commentText = this.applyCommentFormatting(commentText, tone, options.length);
          
          // Save the processed comment
          comments[tone] = commentText;
          console.log(`Generated ${tone} comment (${commentText.length} chars)`);
        } else {
          throw new Error(`Invalid API response format for ${tone} tone`);
        }
      } catch (error) {
        console.error(`Error generating ${tone} comment:`, error);
        
        // Check if error is related to image processing
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isImageError = errorMessage.includes('image') || 
                           errorMessage.includes('multimodal') || 
                           errorMessage.includes('binary data');
        
        if (isImageError) {
          console.log('Attempting fallback without image data...');
          try {
            // Try again without images
            const fallbackComment = await this.generateCommentWithoutImages(postContent, toneOptions, apiKey);
            if (fallbackComment) {
              comments[tone] = fallbackComment;
              continue;
            }
          } catch (fallbackError) {
            console.error('Fallback without images also failed:', fallbackError);
          }
        }
        
        // Provide a fallback comment
        comments[tone] = this.generateFallbackComment(tone, postLanguage);
      }
      
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Ensure all tones have comments
    return {
      supportive: comments.supportive || this.generateFallbackComment('supportive', postLanguage),
      insightful: comments.insightful || this.generateFallbackComment('insightful', postLanguage),
      curious: comments.curious || this.generateFallbackComment('curious', postLanguage),
      professional: comments.professional || this.generateFallbackComment('professional', postLanguage)
    };
  }
  
  /**
   * Fallback method to generate a comment without including images
   */
  private static async generateCommentWithoutImages(
    postContent: EngageIQ.PostContent,
    options: EngageIQ.CommentOptions,
    apiKey: string
  ): Promise<string | null> {
    try {
      // Create a deep copy of post content without images
      const postContentWithoutImages = {
        ...postContent,
        images: undefined
      };
      
      // Create prompt
      const tonePrompt = this.createPrompt(postContentWithoutImages, options);
      
      // API request configuration
      const temperature = options.length === 'very_short' ? 0.6 : 
                         options.length === 'short' ? 0.65 :
                         options.length === 'medium' ? 0.7 :
                         options.length === 'long' ? 0.75 : 0.8;
                         
      const maxTokens = options.length === 'very_short' ? 150 : 
                       options.length === 'short' ? 300 :
                       options.length === 'medium' ? 500 :
                       options.length === 'long' ? 800 : 1100;
      
      // Make text-only API request
      const response = await fetch(`${this.API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: tonePrompt }
              ]
            }
          ],
          generationConfig: {
            temperature: temperature,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: maxTokens,
            stopSequences: []
          }
        })
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      if (data.candidates && data.candidates.length > 0 && 
          data.candidates[0].content && data.candidates[0].content.parts && 
          data.candidates[0].content.parts.length > 0) {
        // Process the response
        let commentText = data.candidates[0].content.parts[0].text.trim();
        commentText = commentText.replace(/^["']|["']$/g, '');
        commentText = this.applyCommentFormatting(commentText, options.tone, options.length);
        return commentText;
      }
    } catch (error) {
      console.error('Error in fallback comment generation:', error);
    }
    
    return null;
  }

  /**
   * Simple language detection based on character patterns
   * In a production setting, consider using a more robust language detection library
   */
  private static detectLanguage(text: string): string {
    if (!text || text.length < 10) {
      return 'en'; // Default to English for very short text
    }
    
    // Simple detection of common languages based on character patterns
    const langPatterns: Record<string, RegExp> = {
      es: /[áéíóúüñ¿¡]/i, // Spanish
      fr: /[àâçéèêëîïôùûüÿœæ]/i, // French
      de: /[äöüß]/i, // German
      pt: /[áàâãçéêíóôõú]/i, // Portuguese
      it: /[àèéìíîòóùú]/i, // Italian
      ru: /[а-яА-Я]/i, // Russian (Cyrillic)
      zh: /[\u4e00-\u9fff]/i, // Chinese
      ja: /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/i, // Japanese
      ko: /[\uac00-\ud7af\u1100-\u11ff]/i, // Korean
      ar: /[\u0600-\u06ff]/i, // Arabic
    };
    
    // Check for language-specific patterns
    for (const [lang, pattern] of Object.entries(langPatterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }
    
    // Default to English if no specific patterns match
    return 'en';
  }
  
  /**
   * Generate fallback comments when API fails
   */
  private static generateFallbackComment(tone: string, language: string = 'en'): string {
    // Fallback comments in English
    const englishFallbacks: Record<string, string[]> = {
      supportive: [
        "Really appreciate you sharing this insight! It's valuable content like this that makes LinkedIn such a great platform for professional growth.",
        "Thank you for sharing this perspective. It's truly valuable and resonates with many of us in the industry.",
        "This is exactly the kind of content that adds value to our professional community. Thanks for sharing!"
      ],
      insightful: [
        "This highlights an important aspect that's often overlooked. From my experience, integrating these insights can lead to significant improvements in outcomes.",
        "Your points connect to the broader industry trends we're seeing. This approach could be particularly effective in today's rapidly evolving landscape.",
        "This analysis offers a valuable perspective on a complex issue. The implications for businesses adapting to current market conditions are substantial."
      ],
      curious: [
        "This is fascinating! Have you found that this approach works consistently across different scenarios? I'd be interested to hear more about your experiences.",
        "I'm intrigued by your perspective. How did you first develop this approach, and what obstacles did you encounter along the way?",
        "This raises some interesting questions. Have you considered how these principles might apply in different industry contexts?"
      ],
      professional: [
        "Thank you for sharing this well-articulated perspective. The points you've raised align with current industry best practices and offer valuable insights for professionals.",
        "This analysis provides an excellent framework for addressing the challenges you've identified. Your structured approach demonstrates a deep understanding of the subject matter.",
        "Your assessment offers a comprehensive view of this important topic. The methodical approach you've outlined is particularly relevant in today's business environment."
      ]
    };
    
    // Simple translations for common languages - in production, use proper localization
    if (language !== 'en') {
      const index = Math.floor(Math.random() * englishFallbacks[tone].length);
      const comment = englishFallbacks[tone][index];
      return `${comment} [Generated in English due to API limitation]`;
    }
    
    // For English, just select a random fallback from the list
    const index = Math.floor(Math.random() * englishFallbacks[tone].length);
    return englishFallbacks[tone][index];
  }

  /**
   * Creates a prompt for the Gemini API based on post content and options
   */
  private static createPrompt(
    postContent: EngageIQ.PostContent, 
    options: EngageIQ.CommentOptions
  ): string {
    // Author context
    const authorContext = postContent.author 
      ? `The post was written by ${postContent.author}${postContent.authorTitle ? ` (${postContent.authorTitle})` : ''}${postContent.authorCompany ? ` at ${postContent.authorCompany}` : ''}.` 
      : '';
    
    // Enhanced image context with detailed instructions
    let imageContext = '';
    if (postContent.images && postContent.images.length > 0) {
      const imageCount = postContent.images.length;
      const imageWord = imageCount === 1 ? 'image' : 'images';
      
      imageContext = `The post includes ${imageCount} ${imageWord}. `;
      
      if (postContent.postType === 'image') {
        imageContext += `This is primarily an image-focused post. Please analyze the visual content carefully. `;
      }
      
      imageContext += `When analyzing the ${imageWord}, consider:
- The main subject(s) or focal point(s)
- Any text visible in the ${imageWord}
- The overall context and how it relates to the post text
- Professional relevance of the visual content
- Emotional tone conveyed by the ${imageWord}

Incorporate your observations about the ${imageWord} naturally into your comment when relevant. You don't need to describe the ${imageWord} explicitly unless it adds value to your comment. Focus on connecting the visual content to your main points.`;
    } else {
      imageContext = 'The post does not include any images.';
    }
    
    // Post type context
    const postTypeContext = postContent.postType
      ? `This is a ${postContent.postType} post.`
      : '';
    
    // Hashtags and mentions
    const hashtagsContext = postContent.hashtags && postContent.hashtags.length > 0
      ? `Hashtags in the post: ${postContent.hashtags.join(', ')}`
      : '';
    
    const mentionsContext = postContent.mentions && postContent.mentions.length > 0
      ? `People mentioned in the post: ${postContent.mentions.join(', ')}`
      : '';
    
    // Engagement metrics for context
    const engagementContext = postContent.engagement
      ? `This post has received approximately ${postContent.engagement.likes || 0} likes, ${postContent.engagement.comments || 0} comments, and ${postContent.engagement.shares || 0} shares.`
      : '';
    
    // URL context
    const urlContext = postContent.url 
      ? `The post contains a link to: ${postContent.url}`
      : '';
    
    // Length guidance
    const lengthGuidance = {
      'very_short': '1-2 sentences',
      'short': '2-3 sentences',
      'medium': '3-4 sentences',
      'long': '4-6 sentences',
      'very_long': '6-8 sentences'
    }[options.length];
    
    // Additional length-specific instructions based on preference
    const lengthSpecificInstructions = {
      'very_short': 'Be concise and direct. Focus only on the most essential point.',
      'short': 'Keep the comment brief while still providing value. Focus on one key insight.',
      'medium': 'Balance brevity with substance. Include enough context to be valuable.',
      'long': 'Provide more detailed insights and context. Develop your thoughts more fully.',
      'very_long': 'Offer comprehensive insights with examples or elaboration. Develop multiple points that build on each other.'
    }[options.length] || 'Balance brevity with substance.';
    
    // Time context if available
    const timeContext = postContent.timestamp
      ? `The post was published ${postContent.timestamp}.`
      : '';
    
    // Detailed tone guidance based on the selected tone
    const toneGuidanceDetails: Record<string, string> = {
      'supportive': 'Be empathetic, validating, and encouraging. Show agreement with the post\'s perspective and offer positive reinforcement. Use warm language that acknowledges the author\'s viewpoint and validates their contribution.',
      
      'insightful': 'Provide thoughtful analysis, additional information, or a unique perspective that builds on the post\'s content. Demonstrate expertise or knowledge in the subject area. Reference relevant experiences or information that adds value to the discussion.',
      
      'curious': 'Ask thoughtful, open-ended questions that encourage further discussion. Show genuine interest in learning more about the topic or the author\'s perspective. Frame questions in a way that invites elaboration rather than simple yes/no answers.',
      
      'professional': 'Maintain a formal tone with precise language and well-structured points. Focus on business value, industry insights, or professional implications. Avoid casual language, and ensure the comment would be appropriate in a business setting.'
    };
    
    // Get detailed guidance for the selected tone
    const toneGuidanceDetail = toneGuidanceDetails[options.tone] || '';
    
    // Professional context - determine if this is a professional/industry post
    const isProfessionalContent = 
      (postContent.text?.toLowerCase().includes('industry') || 
       postContent.text?.toLowerCase().includes('business') ||
       postContent.text?.toLowerCase().includes('career') ||
       postContent.text?.toLowerCase().includes('job') ||
       postContent.text?.toLowerCase().includes('professional') ||
       postContent.text?.toLowerCase().includes('work')) || 
      (postContent.authorTitle && postContent.authorCompany);
    
    const professionalContext = isProfessionalContent 
      ? 'This appears to be professional or industry-related content.'
      : '';
    
    // Tone-specific emoji guidance
    const emojiGuidance: Record<string, string> = {
      'supportive': 'Use 1-2 supportive or positive emojis that match the emotional tone, such as 👏, 💯, 🙌, ✨, or 👍.',
      'insightful': 'Use 1-2 thoughtful or analytical emojis if appropriate, such as 💡, 🧠, 📊, or 🔍.',
      'curious': 'Use 1-2 questioning or curious emojis if appropriate, such as 🤔, 🧐, or ❓.',
      'professional': 'Use 0-1 professional and restrained emojis if appropriate for the context, such as 📈, ✅, or 👨‍💼.'
    };
    
    // Get emoji guidance for the selected tone
    const emojiGuidanceDetail = emojiGuidance[options.tone] || '';
    
    // Comment structure guidance based on length
    const structureGuidance = {
      'very_short': 'Keep the comment as a single, concise paragraph.',
      'short': 'Structure as a single, focused paragraph with clear opening and closing.',
      'medium': 'Consider using 1-2 paragraphs with a clear opening and closing statement.',
      'long': 'Structure with 2-3 paragraphs for readability. Add an opening hook and conclusion.',
      'very_long': 'Use 3-4 paragraphs with appropriate breaks. Consider using bullet points for key ideas.'
    }[options.length];
    
    // Engagement-focused formatting 
    const formattingGuidance = 'Use spacing and structure to enhance readability. For longer comments, use paragraph breaks at logical points to make the comment scannable. If listing multiple points, use a dash or bullet format.';
    
    // Media-specific context - how to handle image content
    let mediaSpecificGuidance = '';
    if (postContent.images && postContent.images.length > 0) {
      mediaSpecificGuidance = `
For image content:
- If you recognize specific objects, scenes, text, people, or concepts in the images, refer to them naturally in your comment
- Don't say "I can see in the image..." or "The image shows..." - instead incorporate observations seamlessly
- If the image contains text that provides additional context, consider that in your response
- For professional headshots or personal images, focus on the professional context rather than appearance
- For charts, graphs, or infographics, comment on the insights they convey
- Keep image references subtle and natural unless the post is primarily about the image`;
    }
    
    // Construct the enhanced prompt
    return `
      You are a professional LinkedIn user creating a thoughtful comment on the following post:
      
      """
      ${postContent.text}
      """
      
      Post context:
      ${authorContext}
      ${postTypeContext}
      ${timeContext}
      ${imageContext}
      ${urlContext}
      ${hashtagsContext}
      ${mentionsContext}
      ${engagementContext}
      ${professionalContext}
      
      Instructions:
      1. Generate a ${options.tone} comment that is ${lengthGuidance} in length
      2. ${toneGuidanceDetail}
      3. ${lengthSpecificInstructions}
      4. Make the comment relevant to the specific content of the post
      5. Use professional language appropriate for LinkedIn
      6. If the post is in a language other than English, respond in that same language
      7. Make the comment authentic and conversational, not generic or formulaic
      8. Do not explicitly mention that you're commenting on their post (e.g., avoid phrases like "Thanks for sharing this post")
      9. Your comment should provide value to the conversation
      10. ${structureGuidance}
      11. ${formattingGuidance}
      12. ${emojiGuidanceDetail}
      13. For longer comments (medium, long, very_long), include an attention-grabbing opener and a memorable closing statement
      ${mediaSpecificGuidance}
      
      Return only the comment text without any additional formatting, explanations, or quotation marks.
    `.trim();
  }

  /**
   * Applies additional formatting to improve comment readability
   * @param comment Original comment text
   * @param tone Comment tone
   * @param length Comment length preference
   * @returns Formatted comment
   */
  private static applyCommentFormatting(
    comment: string, 
    tone: string,
    length: string
  ): string {
    // Don't modify very short comments
    if (length === 'very_short') {
      return comment;
    }
    
    // Ensure proper paragraph breaks are respected
    // If there are double newlines, keep them; otherwise, look for single newlines too
    let formattedComment = comment;
    
    // Replace traditional bullet points with LinkedIn-friendly dashes
    formattedComment = formattedComment.replace(/^[•●■]/gm, '-');
    
    // Ensure proper spacing after bullet points
    formattedComment = formattedComment.replace(/^- ([a-zA-Z0-9])/gm, '- $1');
    
    // For longer comments, ensure there's proper spacing between paragraphs
    if (['medium', 'long', 'very_long'].includes(length)) {
      // Find paragraph breaks and ensure they're properly spaced
      formattedComment = formattedComment.replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2');
      
      // Remove excessive blank lines (more than 2 consecutive newlines)
      formattedComment = formattedComment.replace(/\n{3,}/g, '\n\n');
    }
    
    // Add tone-appropriate emojis if they don't already exist in the text
    if (!this.hasEmoji(formattedComment)) {
      // Emojis by tone
      const toneEmojis: Record<string, string[]> = {
        'supportive': ['👏', '💯', '🙌', '✨', '👍', '❤️', '🔥'],
        'insightful': ['💡', '🧠', '📊', '🔍', '📈', '🤓', '🎯'],
        'curious': ['🤔', '🧐', '❓', '🌟', '🌱', '🎬', '📝'],
        'professional': ['✅', '📊', '📈', '💼', '🔹', '⭐', '📌']
      };
      
      // Select a random emoji appropriate for the tone
      const availableEmojis = toneEmojis[tone] || toneEmojis.professional;
      const emoji = availableEmojis[Math.floor(Math.random() * availableEmojis.length)];
      
      // For short, we'll just add an emoji at the beginning or end
      if (length === 'short') {
        // Add to the end if not already a strong ending punctuation
        if (!formattedComment.match(/[!?]$/)) {
          formattedComment = formattedComment.replace(/\.?$/, `. ${emoji}`);
        } else {
          formattedComment = `${formattedComment} ${emoji}`;
        }
      } 
      // For longer comments, strategically place emoji at the beginning or end
      else {
        // For medium, long, and very_long: add to beginning or end paragraph
        const rand = Math.random();
        
        if (rand < 0.4) {
          // Add to the beginning
          formattedComment = `${emoji} ${formattedComment}`;
        } else {
          // Add to the end if not already ending with punctuation + emoji
          if (!formattedComment.match(/[!?][\s\S]*\p{Emoji_Presentation}$/u)) {
            formattedComment = formattedComment.replace(/\.?$/, `. ${emoji}`);
          }
        }
      }
    }
    
    return formattedComment;
  }
  
  /**
   * Helper function to check if text already contains emojis
   */
  private static hasEmoji(text: string): boolean {
    // Regex to detect emoji characters
    const emojiRegex = /[\p{Emoji}]/u;
    return emojiRegex.test(text);
  }

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

    // Add variety to mock responses based on post content data
    // We use a hash-like approach to ensure we get different but consistent responses
    // for the same post content
    const getVariationSeed = (text: string): number => {
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
      return Math.abs(hash);
    };
    
    const seed = getVariationSeed(postContent.text || '');
    
    // Multiple variations for each tone to create more variety
    const commentVariations = {
      supportive: [
        "Thank you for sharing this valuable perspective! It's great to see content that addresses these important points.",
        "Really appreciate you taking the time to share this! It's insights like these that make LinkedIn such a valuable platform.",
        "This is exactly the kind of content I come to LinkedIn for. Thank you for sharing your expertise and experience!",
        "I'm grateful you shared this – it's an important perspective that deserves more attention in our professional conversations."
      ],
      insightful: [
        "This highlights a critical aspect that many overlook. In my experience, these insights can significantly impact results.",
        "Your analysis offers a fresh perspective on this topic. I particularly appreciate how you've connected these concepts in a meaningful way.",
        "The distinction you've made here is crucial and often missed in conventional thinking about this subject.",
        "I find your approach to this topic particularly thought-provoking. It challenges some assumptions I've held and offers a more nuanced framework."
      ],
      curious: [
        "I'm intrigued by your approach here. Have you found that this strategy consistently produces better outcomes?",
        "This raises some interesting questions about implementation. How did you address the challenges that typically arise in these situations?",
        "I wonder how these principles might apply in different industry contexts. Have you seen variations in effectiveness across sectors?",
        "This is fascinating! I'd be interested to hear more about what initially led you to explore this particular approach."
      ],
      professional: [
        "This is a well-articulated perspective on an important topic. The points you raise are particularly relevant to current industry trends.",
        "Your systematic approach to this subject demonstrates deep domain expertise. The framework you've outlined could be valuable for many professionals facing similar challenges.",
        "The methodology described here aligns with best practices while introducing some innovative elements. This balance is often what drives meaningful progress.",
        "I appreciate the clarity with which you've presented this analysis. Your evidence-based approach strengthens the conclusions considerably."
      ]
    };
    
    // Function to select a variation based on the seed
    const selectVariation = (variations: string[], seed: number): string => {
      return variations[seed % variations.length];
    };
    
    // Generate base comments for each tone using variations
    let baseComments: EngageIQ.CommentResponse = {
      supportive: selectVariation(commentVariations.supportive, seed),
      insightful: selectVariation(commentVariations.insightful, seed + 1),
      curious: selectVariation(commentVariations.curious, seed + 2),
      professional: selectVariation(commentVariations.professional, seed + 3)
    };
    
    // If post content is available, make comments more contextual
    if (postContent.text && postContent.text.length > 0) {
      // Extract topics (very simplified for mock purposes)
      const topics = this.extractTopics(postContent.text);
      
      if (topics.length > 0) {
        // Use random selection of topics if multiple are found
        const topicIndex = seed % topics.length;
        const topic = topics[topicIndex];
        
        // Only modify some comments to maintain variety, based on seed
        if (seed % 2 === 0) {
          baseComments.supportive = `Really appreciate you sharing this perspective on ${topic}! Your insights are valuable and timely.`;
        }
        
        if (seed % 3 === 0) {
          baseComments.insightful = `Your points about ${topic} highlight a critical aspect that many overlook. This approach could be transformative.`;
        }
        
        if (seed % 4 === 0) {
          baseComments.curious = `I'm intrigued by your thoughts on ${topic}. Have you found that these principles apply across different scenarios?`;
        }
        
        if (seed % 5 === 0) {
          baseComments.professional = `This is a well-articulated analysis of ${topic}. The framework you've outlined aligns with emerging best practices.`;
        }
      }
    }
    
    // Add author-specific comments if author information is available
    if (postContent.author) {
      // Only modify some comments based on seed for variety
      if (seed % 7 === 0) {
        baseComments.supportive = `Thank you for sharing this, ${postContent.author}! Your perspective is always valuable and insightful.`;
      }
      
      // Include author's professional context if available
      if (postContent.authorTitle && postContent.authorCompany && seed % 6 === 0) {
        baseComments.insightful = `Coming from someone with your experience as ${postContent.authorTitle} at ${postContent.authorCompany}, this analysis is particularly valuable. I appreciate you sharing these insights.`;
      }
    }
    
    // Adjust length of comments based on user preference
    const lengthAdjustedComments = {
      supportive: adjustLength(baseComments.supportive),
      insightful: adjustLength(baseComments.insightful),
      curious: adjustLength(baseComments.curious),
      professional: adjustLength(baseComments.professional)
    };
    
    // Apply the same formatting enhancements as the real comments
    return {
      supportive: this.applyCommentFormatting(lengthAdjustedComments.supportive, 'supportive', options.length),
      insightful: this.applyCommentFormatting(lengthAdjustedComments.insightful, 'insightful', options.length),
      curious: this.applyCommentFormatting(lengthAdjustedComments.curious, 'curious', options.length),
      professional: this.applyCommentFormatting(lengthAdjustedComments.professional, 'professional', options.length)
    };
  }

  /**
   * Enhanced topic extraction for mock generation
   * In production, this would be done by the Gemini API
   */
  private static extractTopics(text: string): string[] {
    // An expanded list of business and professional topics
    const commonTopics = [
      // Leadership & Management
      'leadership', 'management', 'team building', 'organizational culture', 'executive decisions',
      
      // Marketing & Sales
      'marketing', 'sales', 'customer experience', 'branding', 'market research', 'social media marketing',
      'content strategy', 'lead generation', 'customer acquisition', 'sales funnel', 'customer journey',
      
      // Technology
      'technology', 'artificial intelligence', 'machine learning', 'data analytics', 'cloud computing',
      'digital transformation', 'automation', 'cybersecurity', 'blockchain', 'software development',
      
      // Business Strategy
      'business strategy', 'strategic planning', 'competitive analysis', 'innovation', 'entrepreneurship',
      'startups', 'scaling', 'business models', 'venture capital', 'growth strategies',
      
      // Professional Development
      'professional development', 'career advice', 'skill building', 'networking', 'mentorship',
      'continuing education', 'work-life balance', 'remote work', 'productivity', 'time management',
      
      // HR & Workplace
      'workplace culture', 'employee engagement', 'talent acquisition', 'human resources', 'diversity and inclusion',
      'employee benefits', 'compensation', 'performance management', 'employee retention',
      
      // Industries
      'healthcare', 'finance', 'manufacturing', 'retail', 'education', 'real estate', 'consulting',
      'hospitality', 'transportation', 'energy', 'telecommunications', 'pharmaceuticals', 'agriculture',
      
      // Current Business Trends
      'sustainability', 'digital nomad', 'gig economy', 'global markets', 'supply chain', 'ESG',
      'corporate social responsibility', 'hybrid work', 'economic outlook', 'industry trends'
    ];
    
    const lowerText = text.toLowerCase();
    
    // Find direct matches in the text
    const directMatches = commonTopics.filter(topic => 
      lowerText.includes(topic.toLowerCase())
    );
    
    // For more nuanced topic detection, look for related keywords
    const topicKeywords: Record<string, string[]> = {
      'artificial intelligence': ['AI', 'generative AI', 'LLM', 'machine learning', 'neural network', 'deep learning'],
      'leadership': ['lead', 'leader', 'executive', 'CEO', 'manager', 'director', 'vision'],
      'innovation': ['innovative', 'disrupt', 'cutting-edge', 'breakthrough', 'pioneer', 'revolutionize'],
      'workplace culture': ['culture', 'workplace', 'office', 'company culture', 'environment', 'team culture'],
      'professional development': ['career', 'growth', 'learning', 'skills', 'advancement', 'promotion'],
      'digital transformation': ['digital', 'digitize', 'transformation', 'modernize', 'technology adoption']
    };
    
    // Check for keyword matches where direct topic wasn't found
    const keywordMatches: string[] = [];
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      // Only check if we haven't already found this topic
      if (!directMatches.includes(topic)) {
        const hasKeyword = keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
        if (hasKeyword) {
          keywordMatches.push(topic);
        }
      }
    }
    
    // Combine direct matches and keyword matches
    const allMatches = [...directMatches, ...keywordMatches];
    
    // If no topics found, make an educated guess based on common business themes
    if (allMatches.length === 0) {
      // Check for general business themes
      if (lowerText.includes('business') || lowerText.includes('company') || lowerText.includes('industry')) {
        return ['business strategy'];
      }
      if (lowerText.includes('team') || lowerText.includes('colleague') || lowerText.includes('employee')) {
        return ['workplace culture'];
      }
      if (lowerText.includes('career') || lowerText.includes('job') || lowerText.includes('work')) {
        return ['professional development'];
      }
      if (lowerText.includes('customer') || lowerText.includes('client') || lowerText.includes('market')) {
        return ['marketing'];
      }
      
      // At last resort, return a generic business topic
      return ['professional insights'];
    }
    
    return allMatches;
  }
}