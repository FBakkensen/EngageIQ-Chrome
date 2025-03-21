/**
 * Interface for comment display services
 */
export interface ICommentDisplay {
  /**
   * Show UI with generated comments
   * @param comments The generated comments to display
   * @param fieldId The ID of the comment field
   */
  showCommentsUI(comments: any, fieldId: string): void;
}