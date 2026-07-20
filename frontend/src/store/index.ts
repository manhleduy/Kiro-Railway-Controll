import { createStore, combineReducers } from 'redux';
import { authReducer } from './authSlice';
import { tripsReducer } from './tripsSlice';
import { ordersReducer } from './ordersSlice';
import { orderDraftReducer } from './orderDraftSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  trips: tripsReducer,
  orders: ordersReducer,
  orderDraft: orderDraftReducer,
});

export const store = createStore(rootReducer);
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export * from './authSlice';
export * from './tripsSlice';
export * from './ordersSlice';
export * from './orderDraftSlice';
