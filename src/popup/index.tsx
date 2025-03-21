import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/global.css';

interface PopupState {
  apiKey: string;
  apiKeyValid: boolean;
  status: 'loading' | 'ready' | 'error';
  errorMessage?: string;
}

const Popup: React.FC = () => {
  const [state, setState] = useState<PopupState>({
    apiKey: '',
    apiKeyValid: false,
    status: 'loading'
  });

  useEffect(() => {
    // Check if API key is set
    chrome.runtime.sendMessage({ type: 'GET_API_KEY' }, (response) => {
      if (chrome.runtime.lastError) {
        setState({
          ...state,
          status: 'error',
          errorMessage: chrome.runtime.lastError.message
        });
        return;
      }

      setState({
        apiKey: response.apiKey || '',
        apiKeyValid: response.isValid || false,
        status: 'ready'
      });
    });
  }, []);

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="p-4 w-64 min-h-[200px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-blue-600">EngageIQ</h1>
        <div className={`w-3 h-3 rounded-full ${state.status === 'loading' 
          ? 'bg-yellow-400' 
          : state.status === 'error' 
          ? 'bg-red-500' 
          : state.apiKeyValid 
          ? 'bg-green-500' 
          : 'bg-red-500'}`} 
        />
      </div>
      
      <p className="text-sm mb-4">AI-powered LinkedIn comment generator</p>
      
      <div className="flex-grow">
        {state.status === 'loading' && (
          <p className="text-sm text-gray-600">Loading extension status...</p>
        )}
        
        {state.status === 'error' && (
          <div className="text-sm text-red-600">
            <p>Error: {state.errorMessage || 'Unknown error'}</p>
          </div>
        )}
        
        {state.status === 'ready' && (
          <>
            <div className="mb-4">
              <p className="text-sm mb-1">API Key Status:</p>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${state.apiKeyValid ? 'bg-green-500' : 'bg-red-500'} mr-2`} />
                <span className="text-sm">{state.apiKeyValid ? 'Valid' : 'Not configured'}</span>
              </div>
            </div>
            
            {!state.apiKeyValid && (
              <p className="text-xs text-gray-600 mb-4">
                Please configure your Gemini API key to use EngageIQ.
              </p>
            )}
            
            <p className="text-xs text-gray-600 mb-1">
              Visit LinkedIn and click on any comment field to activate EngageIQ.
            </p>
          </>
        )}
      </div>
      
      <button 
        onClick={openOptions}
        className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
      >
        {!state.apiKeyValid ? 'Configure API Key' : 'Settings'}
      </button>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
