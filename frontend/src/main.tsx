import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { store } from '@/store';
import { setAuth } from '@/store/authSlice';
import { replaceOrderDraft } from '@/store/orderDraftSlice';
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

const persistedDraft = localStorage.getItem('orderDraft');
if (persistedDraft) {
  try {
    const parsedDraft = JSON.parse(persistedDraft);
    if (parsedDraft && typeof parsedDraft === 'object') {
      store.dispatch(replaceOrderDraft(parsedDraft));
    } else {
      localStorage.removeItem('orderDraft');
    }
  } catch {
    localStorage.removeItem('orderDraft');
  }
}

store.subscribe(() => {
  localStorage.setItem('orderDraft', JSON.stringify(store.getState().orderDraft));
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster position="top-right" />
  </StrictMode>,
);
