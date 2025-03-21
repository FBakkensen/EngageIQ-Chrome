/**
 * Service for managing API key storage and validation
 */
export class ApiKeyService {
  private static readonly STORAGE_KEY = 'apiKey';
  private static readonly VALIDATION_STATUS_KEY = 'apiKeyValidStatus';

  /**
   * Saves API key to Chrome storage
   */
  static async saveApiKey(apiKey: string): Promise<void> {
    try {
      await chrome.storage.sync.set({ [this.STORAGE_KEY]: apiKey });
      console.log('API key saved');
    } catch (error) {
      console.error('Error saving API key:', error);
      throw new Error('Failed to save API key');
    }
  }

  /**
   * Retrieves API key from Chrome storage
   */
  static async getApiKey(): Promise<string> {
    try {
      const result = await chrome.storage.sync.get(this.STORAGE_KEY);
      return result[this.STORAGE_KEY] || '';
    } catch (error) {
      console.error('Error retrieving API key:', error);
      throw new Error('Failed to retrieve API key');
    }
  }

  /**
   * Saves validation status to storage
   */
  static async saveValidationStatus(isValid: boolean): Promise<void> {
    try {
      await chrome.storage.sync.set({ 
        [this.VALIDATION_STATUS_KEY]: {
          isValid,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error('Error saving validation status:', error);
    }
  }

  /**
   * Gets validation status from storage
   * Returns null if status is not available or expired
   */
  static async getValidationStatus(): Promise<boolean | null> {
    try {
      const result = await chrome.storage.sync.get(this.VALIDATION_STATUS_KEY);
      const status = result[this.VALIDATION_STATUS_KEY];
      
      // Check if status exists and is not expired (24 hours)
      if (status && (Date.now() - status.timestamp < 24 * 60 * 60 * 1000)) {
        return status.isValid;
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving validation status:', error);
      return null;
    }
  }

  /**
   * Validates API key with Gemini API by making a lightweight test request
   */
  static async validateApiKey(apiKey: string): Promise<boolean> {
    if (!apiKey || apiKey.trim().length < 10) {
      return false;
    }

    try {
      // Make a lightweight request to the Gemini API to validate the key
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      
      const response = await fetch(testUrl);
      const isValid = response.ok;
      
      console.log(`API key validation result: ${isValid ? 'Valid' : 'Invalid'}`);
      
      // Save validation status for future reference
      await this.saveValidationStatus(isValid);
      
      return isValid;
    } catch (error) {
      console.error('Error validating API key:', error);
      
      // If there was a network error, we can't determine if the key is valid
      // For now, fallback to a simplified format check to avoid blocking the user
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('Network error during validation, falling back to format check');
        const isFormatValid = apiKey.length >= 20 && apiKey.includes('.');
        await this.saveValidationStatus(isFormatValid);
        return isFormatValid;
      }
      
      await this.saveValidationStatus(false);
      return false;
    }
  }

  /**
   * Clears API key from storage
   */
  static async clearApiKey(): Promise<void> {
    try {
      await chrome.storage.sync.remove([this.STORAGE_KEY, this.VALIDATION_STATUS_KEY]);
      console.log('API key cleared');
    } catch (error) {
      console.error('Error clearing API key:', error);
      throw new Error('Failed to clear API key');
    }
  }
}