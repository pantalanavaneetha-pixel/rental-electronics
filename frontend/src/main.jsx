import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

// Dynamically determine the backend URL.
// In development, it defaults to http://localhost:5000.
// In production, it uses VITE_API_URL or the deployed Render backend URL.
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://your-deployed-backend-url.onrender.com');

// 1. Intercept all window.fetch calls
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  if (typeof input === 'string' && input.startsWith('http://localhost:5000')) {
    input = input.replace('http://localhost:5000', API_BASE_URL);
  } else if (input instanceof URL && input.href.startsWith('http://localhost:5000')) {
    input = new URL(input.href.replace('http://localhost:5000', API_BASE_URL));
  } else if (input && typeof input === 'object' && input.url && input.url.startsWith('http://localhost:5000')) {
    const newUrl = input.url.replace('http://localhost:5000', API_BASE_URL);
    input = new Request(newUrl, input);
  }
  return originalFetch.apply(this, [input, init]);
};

// 2. Intercept all Axios requests
axios.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('http://localhost:5000')) {
    config.url = config.url.replace('http://localhost:5000', API_BASE_URL);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)

