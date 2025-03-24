// src/types/engage-iq.d.ts

declare namespace EngageIQ {
  type PostType = 'text' | 'image' | 'link' | 'video' | 'document' | 'poll' | 'mixed' | 
                  'job' | 'event' | 'article' | 'share';

  interface PostContent {
    postId?: string;
    authorName?: string;
    author?: string;
    postText?: string;
    text?: string;
    postType?: PostType;
    imageUrls?: string[];
    images?: string[];
    url?: string;
    linkData?: {
      url: string;
      title?: string;
      description?: string;
    };
    // Additional fields from the codebase
    authorTitle?: string;
    authorCompany?: string;
    commentCount?: number;
    likeCount?: number;
    timestamp?: string;
    mentions?: string[];
  }
  
  interface GeneratedComment {
    text: string;
    style: 'professional' | 'casual' | 'enthusiastic';
    length: 'short' | 'medium' | 'long';
  }
  
  interface UserPreferences {
    apiKey?: string;
    defaultCommentStyle?: string;
    defaultCommentLength?: string;
    darkMode?: boolean;
  }
  
  interface GenerateOptions {
    style?: string;
    length?: string;
    tone?: string;
  }
} 