import React from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/global.css';

const Popup: React.FC = () => {
  return (
    <div className="p-4 w-64">
      <h1 className="text-xl font-bold text-blue-600">EngageIQ</h1>
      <p className="mt-2">AI-powered LinkedIn comment generator</p>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
