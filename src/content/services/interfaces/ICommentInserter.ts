/**
 * Interface for comment insertion services
 */
export interface ICommentInserter {
  /**
   * Insert a comment into a field
   * @param comment The comment text to insert
   * @param fieldId The ID of the field to insert into
   * @returns Success status of insertion
   */
  insertComment(comment: string, fieldId?: string): boolean;
}