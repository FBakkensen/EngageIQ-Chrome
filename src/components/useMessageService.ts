/**
 * React hook for Chrome extension messaging
 */
import { useState, useCallback } from 'react';

/**
 * Hook for sending messages to the background script
 */
export function useMessageService() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Sends a message to the background script
   */
  const sendMessage = useCallback(async <T>(
    message: EngageIQ.MessageType,
    onSuccess?: (response: T) => void
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    console.log('Sending message:', message);

    try {
      return new Promise<T | null>((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
          setIsLoading(false);
          console.log('Received response:', response);

          if (chrome.runtime.lastError) {
            const errorMessage = chrome.runtime.lastError.message || 'Unknown error';
            setError(errorMessage);
            console.error('Message error:', errorMessage);
            resolve(null);
            return;
          }

          if (response && 'error' in response) {
            setError(response.error);
            console.error('Response error:', response.error);
            resolve(null);
            return;
          }

          if (onSuccess) {
            console.log('Calling onSuccess with response');
            onSuccess(response as T);
          }
          
          resolve(response as T);
        });
      });
    } catch (err) {
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Message error:', errorMessage);
      return null;
    }
  }, []);

  /**
   * Clears the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sendMessage,
    isLoading,
    error,
    clearError
  };
}

export default useMessageService;