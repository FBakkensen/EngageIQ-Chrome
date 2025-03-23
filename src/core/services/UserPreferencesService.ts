import { CommentLength } from '../../content/ui/CommentDisplay';

/**
 * Service for managing user preferences, including comment length preference
 */
export class UserPreferencesService {
  private static readonly LENGTH_PREFERENCE_KEY = 'commentLengthPreference';
  private static readonly DEFAULT_LENGTH: CommentLength = 'medium';
  private static readonly VALID_LENGTHS = ['very_short', 'short', 'medium', 'long', 'very_long'];

  /**
   * Saves comment length preference to Chrome storage
   * @param length The selected comment length preference
   */
  static async saveCommentLengthPreference(length: string): Promise<void> {
    try {
      console.log('UserPreferencesService: Attempting to save length preference:', length);
      
      // Validate the length is one of the allowed values
      if (!this.VALID_LENGTHS.includes(length)) {
        console.error('UserPreferencesService: Invalid length preference:', length);
        throw new Error(`Invalid length preference: ${length}`);
      }
      
      // Cast the string to CommentLength, as we know it will be one of the valid options
      const validLength = length as CommentLength;
      
      // Save to Chrome storage
      await chrome.storage.sync.set({ [this.LENGTH_PREFERENCE_KEY]: validLength });
      console.log('UserPreferencesService: Comment length preference saved:', validLength);
      
      // Verify it was saved correctly
      const result = await chrome.storage.sync.get(this.LENGTH_PREFERENCE_KEY);
      console.log('UserPreferencesService: Verification of saved preference:', result);
    } catch (error) {
      console.error('UserPreferencesService: Error saving comment length preference:', error);
      throw new Error('Failed to save comment length preference');
    }
  }

  /**
   * Retrieves comment length preference from Chrome storage
   * @returns The stored comment length preference or the default
   */
  static async getCommentLengthPreference(): Promise<CommentLength> {
    try {
      console.log('UserPreferencesService: Getting length preference from storage');
      const result = await chrome.storage.sync.get(this.LENGTH_PREFERENCE_KEY);
      console.log('UserPreferencesService: Storage result:', result);
      
      const preference = result[this.LENGTH_PREFERENCE_KEY];
      
      // Validate the stored preference is valid
      if (preference && this.VALID_LENGTHS.includes(preference)) {
        console.log('UserPreferencesService: Valid preference found:', preference);
        return preference as CommentLength;
      } else {
        console.log('UserPreferencesService: Invalid or missing preference, using default:', this.DEFAULT_LENGTH);
        return this.DEFAULT_LENGTH;
      }
    } catch (error) {
      console.error('UserPreferencesService: Error retrieving comment length preference:', error);
      return this.DEFAULT_LENGTH;
    }
  }

  /**
   * Clears comment length preference from storage and resets to default
   */
  static async resetCommentLengthPreference(): Promise<void> {
    try {
      console.log('UserPreferencesService: Resetting length preference to default');
      await chrome.storage.sync.remove([this.LENGTH_PREFERENCE_KEY]);
      console.log('UserPreferencesService: Comment length preference reset to default');
    } catch (error) {
      console.error('UserPreferencesService: Error resetting comment length preference:', error);
      throw new Error('Failed to reset comment length preference');
    }
  }
} 