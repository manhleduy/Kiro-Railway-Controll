import { useEffect, useState } from 'react';
import { store } from '@/store';
import type { OrderDraftState } from '@/store/orderDraftSlice';

export function useOrderDraftState(): OrderDraftState {
  const [state, setState] = useState(() => store.getState().orderDraft);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState(store.getState().orderDraft);
    });

    return unsubscribe;
  }, []);

  return state;
}

