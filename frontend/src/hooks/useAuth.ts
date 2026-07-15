import { useState, useEffect } from 'react';
import { store } from '@/store';
import { setAuth, clearAuth } from '@/store/authSlice';
import type { AuthState } from '@/store/authSlice';

export function useAuthState(): AuthState {
  const [state, setState] = useState(() => store.getState().auth);
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState(store.getState().auth);
    });
    return unsubscribe;
  }, []);
  return state;
}

export function useAuthDispatch() {
  return {
    login: (payload: AuthState) => {
      store.dispatch(setAuth(payload));
      localStorage.setItem('auth', JSON.stringify(payload));
    },
    logout: () => {
      store.dispatch(clearAuth());
      localStorage.removeItem('auth');
    },
  };
}
