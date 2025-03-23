import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/global.css';
import { CommentLength } from '../content/ui/CommentDisplay';

// Components
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import StatusMessage, { StatusType } from '../components/StatusMessage';
import useMessageService from '../components/useMessageService';

interface OptionsState {
  apiKey: string;
  showApiKey: boolean;
  isValid: boolean | null;
  statusMessage: string | null;
  statusType: StatusType;
  commentLength: CommentLength;
}

/**
 * Options page component
 */
const OptionsPage: React.FC = () => {
  // Initialize state
  const [state, setState] = useState<OptionsState>({
    apiKey: '',
    showApiKey: false,
    isValid: null,
    statusMessage: null,
    statusType: 'none',
    commentLength: 'medium'
  });

  // Use the message service hook
  const { sendMessage, isLoading, error, clearError } = useMessageService();

  // Load API key and preferences on component mount
  useEffect(() => {
    fetchApiKey();
    fetchLengthPreference();
  }, []);

  // Show error from message service if any
  useEffect(() => {
    if (error) {
      setState(prev => ({
        ...prev,
        statusMessage: error,
        statusType: 'error'
      }));
    }
  }, [error]);

  /**
   * Fetches the API key from storage
   */
  const fetchApiKey = async () => {
    await sendMessage<EngageIQ.ApiKeyResponse>(
      { type: 'GET_API_KEY' },
      (response) => {
        setState(prev => ({
          ...prev,
          apiKey: response.apiKey || '',
          isValid: response.isValid || false
        }));
      }
    );
  };

  /**
   * Fetches the comment length preference from storage
   */
  const fetchLengthPreference = async () => {
    try {
      chrome.storage.sync.get('commentLengthPreference', (result) => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          return;
        }
        
        const preference = result.commentLengthPreference;
        
        if (preference) {
          setState(prev => ({
            ...prev,
            commentLength: preference as CommentLength
          }));
        } else {
          setState(prev => ({
            ...prev,
            commentLength: 'medium'
          }));
        }
      });
    } catch (error) {
      console.error('Exception fetching preference:', error);
    }
  };

  /**
   * Saves the comment length preference to storage
   */
  const saveLengthPreference = async (length: CommentLength) => {
    // Update UI immediately for better user feedback
    setState(prev => ({
      ...prev,
      commentLength: length,
      statusMessage: 'Saving...',
      statusType: 'info'
    }));

    // Save to Chrome storage
    try {
      chrome.storage.sync.set({ 'commentLengthPreference': length }, () => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          setState(prev => ({
            ...prev,
            statusMessage: `Error: ${lastError.message || 'Unknown error'}`,
            statusType: 'error'
          }));
        } else {
          setState(prev => ({
            ...prev,
            statusMessage: 'Length preference saved',
            statusType: 'success'
          }));
          setTimeout(clearStatus, 3000);
        }
      });
    } catch (err) {
      console.error('Error saving preference:', err);
      setState(prev => ({
        ...prev,
        statusMessage: 'Failed to save preference',
        statusType: 'error'
      }));
    }
  };

  /**
   * Format the length name for display
   */
  const formatLengthName = (length: string): string => {
    return length.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  };

  /**
   * Validates the current API key
   */
  const validateApiKey = async () => {
    if (!state.apiKey.trim()) {
      setState(prev => ({
        ...prev,
        statusMessage: 'Please enter an API key',
        statusType: 'error'
      }));
      return;
    }

    await sendMessage<EngageIQ.ApiKeyValidationResponse>(
      { type: 'VALIDATE_API_KEY', payload: state.apiKey },
      (response) => {
        setState(prev => ({
          ...prev,
          isValid: response.isValid,
          statusMessage: response.isValid 
            ? 'API key is valid!' 
            : 'Invalid API key. Please check and try again.',
          statusType: response.isValid ? 'success' : 'error'
        }));
      }
    );
  };

  /**
   * Saves the API key to storage
   */
  const saveApiKey = async () => {
    if (!state.apiKey.trim()) {
      setState(prev => ({
        ...prev,
        statusMessage: 'Please enter an API key',
        statusType: 'error'
      }));
      return;
    }

    await sendMessage<EngageIQ.ApiKeyUpdateResponse>(
      { type: 'SET_API_KEY', payload: state.apiKey },
      (response) => {
        setState(prev => ({
          ...prev,
          isValid: response.isValid,
          statusMessage: 'API key saved successfully!',
          statusType: 'success'
        }));
      }
    );
  };

  /**
   * Clears the API key from storage
   */
  const clearApiKey = async () => {
    setState(prev => ({
      ...prev,
      apiKey: '',
      isValid: null,
      statusMessage: null,
      statusType: 'none'
    }));

    await sendMessage<{ success: boolean }>(
      { type: 'SET_API_KEY', payload: '' },
      (response) => {
        if (response.success) {
          setState(prev => ({
            ...prev,
            statusMessage: 'API key cleared',
            statusType: 'info'
          }));
        }
      }
    );
  };

  /**
   * Toggles API key visibility
   */
  const toggleShowApiKey = () => {
    setState(prev => ({ ...prev, showApiKey: !prev.showApiKey }));
  };

  /**
   * Clear status message
   */
  const clearStatus = () => {
    setState(prev => ({
      ...prev,
      statusMessage: null,
      statusType: 'none'
    }));
    clearError();
  };

  // Render eye icon for password visibility toggle
  const renderEyeIcon = () => (
    state.showApiKey ? (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-blue-600 mb-6">EngageIQ Settings</h1>
      
      {/* API Key Configuration */}
      <Card title="API Configuration">
        <Input
          label="Gemini API Key"
          id="apiKey"
          type={state.showApiKey ? "text" : "password"}
          value={state.apiKey}
          onChange={(e) => setState(prev => ({ ...prev, apiKey: e.target.value }))}
          placeholder="Enter your Gemini API key"
          helpText={
            <span>
              Enter your Gemini API key to enable AI comment generation.
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline ml-1"
              >
                Get an API key
              </a>
            </span>
          }
          endIcon={renderEyeIcon()}
          onEndIconClick={toggleShowApiKey}
        />
        
        {state.isValid !== null && (
          <div className={`mb-4 flex items-center text-sm ${state.isValid ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${state.isValid ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{state.isValid ? 'API key is valid' : 'API key is invalid'}</span>
          </div>
        )}
        
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={() => validateApiKey()}
            isLoading={isLoading}
            disabled={!state.apiKey}
          >
            Validate Key
          </Button>
          
          <Button
            variant="primary"
            onClick={() => saveApiKey()}
            isLoading={isLoading}
            disabled={!state.apiKey}
          >
            Save Changes
          </Button>
          
          {state.apiKey && (
            <Button
              variant="outline"
              onClick={() => clearApiKey()}
              disabled={isLoading}
            >
              Clear Key
            </Button>
          )}
        </div>
      </Card>
      
      {/* Comment Generation Options */}
      <Card title="Default Comment Options">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Default Comment Length
          </label>
          
          <div className="grid grid-cols-5 gap-2">
            {['very_short', 'short', 'medium', 'long', 'very_long'].map((length) => (
              <button 
                key={length}
                type="button"
                onClick={() => saveLengthPreference(length as CommentLength)}
                className={`
                  p-2 rounded-md text-center cursor-pointer text-sm border
                  ${length === state.commentLength ? 'bg-blue-100 border-blue-300 font-medium' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}
                `}
              >
                {formatLengthName(length)}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Select your preferred default comment length for generated comments
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Default Comment Tone
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: 'supportive', icon: '👍' },
              { value: 'insightful', icon: '💡' }, 
              { value: 'curious', icon: '🤔' },
              { value: 'professional', icon: '👔' }
            ].map((tone) => (
              <button
                key={tone.value}
                type="button"
                onClick={() => {
                  setState(prev => ({
                    ...prev,
                    statusMessage: `Tone selection coming soon: ${tone.value}`,
                    statusType: 'info'
                  }));
                  setTimeout(clearStatus, 3000);
                }}
                className={`
                  p-2 rounded-md text-center cursor-pointer text-sm border
                  ${tone.value === 'professional' ? 'bg-blue-100 border-blue-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}
                `}
              >
                <div className="text-lg mb-1">{tone.icon}</div>
                {tone.value}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Coming soon: Customize default comment tone
          </p>
        </div>
      </Card>
      
      {/* About Section */}
      <Card title="About EngageIQ">
        <p className="text-sm text-gray-600 mb-2">
          EngageIQ is an AI-powered Chrome extension that helps you generate contextually relevant comments for LinkedIn posts.
          Simply focus on any LinkedIn comment field to activate the assistant.
        </p>
        <p className="text-sm text-gray-600">
          Version 1.0.0
        </p>
      </Card>
      
      {/* Status Message */}
      <StatusMessage 
        type={state.statusType} 
        message={state.statusMessage}
        onClose={clearStatus}
      />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OptionsPage />
  </React.StrictMode>
);