/**
 * LinkedIn DOM Elements Mocks
 * 
 * Provides mock implementations of LinkedIn DOM elements for testing
 */

/**
 * LinkedIn Post structure
 */
export interface LinkedInPostElement extends HTMLDivElement {
  _mockContent?: string;
  _mockAuthor?: string;
  _mockImages?: string[];
}

/**
 * LinkedIn Comment Field structure
 */
export interface LinkedInCommentFieldElement extends HTMLTextAreaElement {
  _mockFieldId?: string;
  _mockPostId?: string;
}

/**
 * Creates a mock LinkedIn post element
 */
export function createMockLinkedInPost(options: {
  content?: string;
  author?: string;
  images?: string[];
  hasCommentSection?: boolean;
}): LinkedInPostElement {
  const post = document.createElement('div') as LinkedInPostElement;
  
  // Add LinkedIn post classes
  post.className = 'feed-shared-update-v2 feed-shared-update-v2--minimal-padding';
  post.setAttribute('data-urn', `urn:li:activity:${Date.now()}`);
  
  // Add mock properties for testing
  post._mockContent = options.content || 'This is a mock LinkedIn post content';
  post._mockAuthor = options.author || 'Mock LinkedIn User';
  post._mockImages = options.images || [];
  
  // Create post structure
  const authorSection = document.createElement('div');
  authorSection.className = 'feed-shared-actor';
  
  const authorName = document.createElement('span');
  authorName.className = 'feed-shared-actor__name';
  authorName.textContent = post._mockAuthor;
  authorSection.appendChild(authorName);
  
  const contentSection = document.createElement('div');
  contentSection.className = 'feed-shared-update-v2__description-wrapper';
  
  const contentText = document.createElement('div');
  contentText.className = 'feed-shared-text';
  contentText.innerHTML = `<span dir="ltr">${post._mockContent}</span>`;
  contentSection.appendChild(contentText);
  
  // Add images if provided
  if (post._mockImages.length > 0) {
    const imageSection = document.createElement('div');
    imageSection.className = 'feed-shared-image';
    
    post._mockImages.forEach(imageSrc => {
      const img = document.createElement('img');
      img.src = imageSrc;
      img.className = 'feed-shared-image__image';
      imageSection.appendChild(img);
    });
    
    contentSection.appendChild(imageSection);
  }
  
  // Add comment section if specified
  if (options.hasCommentSection) {
    const commentSection = document.createElement('div');
    commentSection.className = 'feed-shared-social-actions';
    
    const commentForm = document.createElement('div');
    commentForm.className = 'comments-comment-box';
    
    const commentTextField = createMockLinkedInCommentField({
      postId: post.getAttribute('data-urn') || ''
    });
    
    commentForm.appendChild(commentTextField);
    commentSection.appendChild(commentForm);
    post.appendChild(commentSection);
  }
  
  post.appendChild(authorSection);
  post.appendChild(contentSection);
  
  return post;
}

/**
 * Creates a mock LinkedIn comment field element
 */
export function createMockLinkedInCommentField(options: {
  fieldId?: string;
  postId?: string;
}): LinkedInCommentFieldElement {
  const commentField = document.createElement('textarea') as LinkedInCommentFieldElement;
  
  // Add LinkedIn comment field classes
  commentField.className = 'comments-comment-box__input';
  commentField.placeholder = 'Add a comment...';
  
  // Add mock properties for testing
  commentField._mockFieldId = options.fieldId || `comment-field-${Date.now()}`;
  commentField._mockPostId = options.postId || `urn:li:activity:${Date.now()}`;
  
  // Set data attributes
  commentField.setAttribute('data-field-id', commentField._mockFieldId);
  commentField.setAttribute('data-post-id', commentField._mockPostId);
  
  return commentField;
}

/**
 * Creates multiple mock LinkedIn posts
 */
export function createMockLinkedInFeed(postCount: number = 5): LinkedInPostElement[] {
  const posts: LinkedInPostElement[] = [];
  
  for (let i = 0; i < postCount; i++) {
    const hasImages = i % 2 === 0; // Every other post has images
    const imageCount = hasImages ? Math.floor(Math.random() * 3) + 1 : 0;
    const images = Array(imageCount).fill(0).map(() => `https://mock-linkedin-image-${Date.now()}.jpg`);
    
    posts.push(createMockLinkedInPost({
      content: `This is mock LinkedIn post #${i + 1}`,
      author: `Mock LinkedIn User ${i + 1}`,
      images: images,
      hasCommentSection: true
    }));
  }
  
  return posts;
} 