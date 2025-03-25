/**
 * LinkedIn DOM element mocks for testing
 */

/**
 * Creates a mock LinkedIn post element
 * @param postText The text content of the post
 * @param authorName The name of the post author
 * @param authorTitle The title of the post author
 * @param hasImage Whether the post has an image
 * @returns HTML element representing a LinkedIn post
 */
export function createMockLinkedInPost(
  postText = 'Sample post content',
  authorName = 'John Doe',
  authorTitle = 'Software Engineer at LinkedIn',
  hasImage = false
): HTMLElement {
  const post = document.createElement('div');
  post.className = 'feed-shared-update-v2';
  post.dataset.id = `urn:li:activity:${Math.random().toString(36).substring(2, 10)}`;
  
  // Author section
  const authorSection = document.createElement('div');
  authorSection.className = 'feed-shared-actor';
  
  const authorNameElement = document.createElement('span');
  authorNameElement.className = 'feed-shared-actor__name';
  authorNameElement.textContent = authorName;
  
  const authorTitleElement = document.createElement('span');
  authorTitleElement.className = 'feed-shared-actor__description';
  authorTitleElement.textContent = authorTitle;
  
  authorSection.appendChild(authorNameElement);
  authorSection.appendChild(authorTitleElement);
  
  // Post content
  const contentSection = document.createElement('div');
  contentSection.className = 'feed-shared-update-v2__description-wrapper';
  
  const contentText = document.createElement('div');
  contentText.className = 'feed-shared-text';
  contentText.innerHTML = `<span dir="ltr">${postText}</span>`;
  
  contentSection.appendChild(contentText);
  
  // Image if needed
  if (hasImage) {
    const imageSection = document.createElement('div');
    imageSection.className = 'feed-shared-image';
    
    const img = document.createElement('img');
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 1x1 transparent gif
    img.alt = 'Post image';
    img.className = 'ivm-view-attr__img--centered';
    
    imageSection.appendChild(img);
    contentSection.appendChild(imageSection);
  }
  
  // Comment section
  const commentSection = document.createElement('div');
  commentSection.className = 'social-details-social-activity';
  
  const commentForm = document.createElement('div');
  commentForm.className = 'comments-comment-box';
  
  const commentBox = document.createElement('div');
  commentBox.className = 'comments-comment-box__form-container';
  
  const commentTextArea = document.createElement('div');
  commentTextArea.className = 'ql-editor';
  commentTextArea.setAttribute('contenteditable', 'true');
  commentTextArea.setAttribute('data-placeholder', 'Add a comment…');
  
  commentBox.appendChild(commentTextArea);
  commentForm.appendChild(commentBox);
  commentSection.appendChild(commentForm);
  
  // Assemble post
  post.appendChild(authorSection);
  post.appendChild(contentSection);
  post.appendChild(commentSection);
  
  return post;
}

/**
 * Creates a mock LinkedIn comment field
 * @returns HTML element representing a LinkedIn comment field
 */
export function createMockCommentField(): HTMLElement {
  const commentField = document.createElement('div');
  commentField.className = 'ql-editor';
  commentField.setAttribute('contenteditable', 'true');
  commentField.setAttribute('data-placeholder', 'Add a comment…');
  
  const commentContainer = document.createElement('div');
  commentContainer.className = 'comments-comment-box__form-container';
  commentContainer.appendChild(commentField);
  
  return commentContainer;
}

/**
 * Simulates clicking on a LinkedIn comment field
 * @param post The post element containing the comment field
 */
export function simulateCommentFieldFocus(post: HTMLElement): void {
  const commentField = post.querySelector('.ql-editor');
  if (commentField) {
    commentField.dispatchEvent(new Event('focus'));
    commentField.dispatchEvent(new Event('click'));
  }
}

/**
 * Simulates inserting text into a LinkedIn comment field
 * @param commentField The comment field element
 * @param text The text to insert
 */
export function simulateCommentInsertion(commentField: HTMLElement, text: string): void {
  commentField.innerHTML = text;
  commentField.dispatchEvent(new Event('input'));
} 