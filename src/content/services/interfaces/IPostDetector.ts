/**
 * Interface for post detection services
 */
export interface IPostDetector {
  /**
   * Scan for LinkedIn posts
   * @returns Number of posts detected
   */
  scanForLinkedInPosts(): number;
  
  /**
   * Scan for comment fields
   * @returns Number of comment fields detected
   */
  scanForCommentFields(): number;
  
  /**
   * Get the number of processed comment fields
   */
  getCommentFieldsCount(): number;
}