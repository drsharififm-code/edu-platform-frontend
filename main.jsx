import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './App.css';
import { startTranslation } from './i18n.js';
import { SITE_URL } from './config.js';

// Old addresses → the new official domain (keeps old links and certificate QR codes working).
const OLD_HOSTS = ['edu.sharififcm.com', 'www.fcmedu.com'];
if (OLD_HOSTS.includes(window.location.hostname)) {
  window.location.replace(SITE_URL + window.location.pathname + window.location.search + window.location.hash);
}

startTranslation();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
