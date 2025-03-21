import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/global.css';

const Options: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Load saved API key
    chrome.storage.sync.get('apiKey', (data) => {
      if (data.apiKey) {
        setApiKey(data.apiKey);
      }
    });
  }, []);

  const saveApiKey = () => {
    chrome.storage.sync.set({ apiKey }, () => {
      setStatus('API key saved successfully!');
      setTimeout(() => setStatus(''), 3000);
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-blue-600 mb-6">EngageIQ Settings</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2" htmlFor="apiKey">
          Gemini API Key
        </label>
        <input
          id="apiKey"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          placeholder="Enter your API key"
        />
      </div>
      
      <button
        onClick={saveApiKey}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        Save Changes
      </button>
      
      {status && (
        <div className="mt-4 p-2 bg-green-100 text-green-800 rounded-md">
          {status}
        </div>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);
