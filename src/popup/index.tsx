import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/global.css';

// Components
import Card from '../components/Card';
import Button from '../components/Button';
import StatusMessage, { StatusType } from '../components/StatusMessage';

interface PopupState {
  apiKey: string;
  apiKeyValid: boolean;
  status: 'loading' | 'ready' | 'error';
  errorMessage?: string;
  statusMessage: string | null;
  statusType: StatusType;
  linkedinTabExists: boolean;
  activeTab?: chrome.tabs.Tab;
}

const Popup: React.FC = () => {
  const [state, setState] = useState<PopupState>({
    apiKey: '',
    apiKeyValid: false,
    status: 'loading',
    statusMessage: null,
    statusType: 'none',
    linkedinTabExists: false
  });

  useEffect(() => {
    // Check if API key is set
    chrome.runtime.sendMessage({ type: 'GET_API_KEY' }, (response) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        setState(prev => ({
          ...prev,
          status: 'error',
          errorMessage: lastError.message || 'An error occurred'
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        apiKey: response.apiKey || '',
        apiKeyValid: response.isValid || false,
        status: 'ready'
      }));
    });

    // Check if there's an active LinkedIn tab using the background script
    chrome.runtime.sendMessage({ type: 'GET_LINKEDIN_STATUS' }, (response: EngageIQ.LinkedInStatusResponse) => {
      setState(prev => ({
        ...prev,
        linkedinTabExists: response.linkedinTabExists,
        activeTab: response.activeTab || undefined
      }));
    });
  }, []);

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  const openLinkedIn = () => {
    // If there's already a LinkedIn tab, activate it
    if (state.activeTab?.id) {
      chrome.tabs.update(state.activeTab.id, { active: true });
    } else {
      // Otherwise open a new LinkedIn tab
      chrome.tabs.create({ url: 'https://www.linkedin.com/feed/' });
    }
  };

  const clearStatus = () => {
    setState(prev => ({
      ...prev,
      statusMessage: null,
      statusType: 'none'
    }));
  };

  return (
    <div className="p-4 w-[320px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-blue-600">EngageIQ</h1>
          <div className={`ml-2 w-3 h-3 rounded-full ${
            state.status === 'loading' 
              ? 'bg-yellow-400' 
              : state.status === 'error' 
              ? 'bg-red-500' 
              : state.apiKeyValid 
              ? 'bg-green-500' 
              : 'bg-red-500'
          }`} 
          />
        </div>
        <div className="text-xs text-gray-500">v1.0.0</div>
      </div>
      
      {state.status === 'loading' ? (
        <div className="flex justify-center py-4">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <>
          <Card className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">API Status</div>
              <div className="flex items-center px-3 py-1 rounded-full text-xs bg-gray-100">
                <div className={`w-2 h-2 rounded-full ${state.apiKeyValid ? 'bg-green-500' : 'bg-red-500'} mr-2`} />
                <span>{state.apiKeyValid ? 'Ready' : 'Not Configured'}</span>
              </div>
            </div>
            
            {!state.apiKeyValid && (
              <p className="text-sm text-gray-600 mb-4">
                You need to configure your Gemini API key to use this extension.
              </p>
            )}
            
            <Button 
              variant="primary"
              onClick={openOptions}
              className="w-full"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              }
            >
              {!state.apiKeyValid ? 'Configure API Key' : 'Settings'}
            </Button>
          </Card>
          
          {state.apiKeyValid && (
            <Card className="mb-4">
              <div className="font-medium mb-3">Quick Actions</div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="secondary"
                  onClick={openLinkedIn}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className="w-4 h-4">
                      <path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"/>
                    </svg>
                  }
                >
                  Open LinkedIn
                </Button>
                
                <Button 
                  variant="outline"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                    </svg>
                  }
                  onClick={() => {
                    chrome.tabs.create({ url: 'https://aistudio.google.com/app/apikey' });
                  }}
                >
                  Get API Key
                </Button>
              </div>
            </Card>
          )}
          
          <Card>
            <div className="font-medium mb-3">How to Use</div>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="inline-block w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 mr-2 text-center">1</span>
                <span>Open LinkedIn in your browser</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 mr-2 text-center">2</span>
                <span>Click on any post's comment field</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 mr-2 text-center">3</span>
                <span>Use EngageIQ's suggestions to create engaging comments</span>
              </li>
            </ul>
          </Card>
        </>
      )}
      
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
    <Popup />
  </React.StrictMode>
);