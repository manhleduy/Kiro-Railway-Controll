import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { store } from '@/store';
import { setAuth } from '@/store/authSlice';
import { Toaster } from 'react-hot-toast';

// Hydrate from localStorage
const persisted = localStorage.getItem('auth');
if (persisted) {
  try {
    store.dispatch(setAuth(JSON.parse(persisted)));
  } catch {
    localStorage.removeItem('auth');
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster position="top-right" />
  </StrictMode>,
);
