import type { CustomerProfile, StaffProfile } from '@/types';

export interface AuthState {
  token: string | null;
  role: 'customer' | 'staff' | null;
  user: CustomerProfile | StaffProfile | null;
}

const SET_AUTH = 'auth/setAuth';
const CLEAR_AUTH = 'auth/clearAuth';

export const setAuth = (payload: AuthState) => ({
  type: SET_AUTH as typeof SET_AUTH,
  payload,
});

export const clearAuth = () => ({
  type: CLEAR_AUTH as typeof CLEAR_AUTH,
});

type AuthAction = ReturnType<typeof setAuth> | ReturnType<typeof clearAuth>;

const initialState: AuthState = { token: null, role: null, user: null };

export function authReducer(
  state: AuthState = initialState,
  action: AuthAction,
): AuthState {
  switch (action.type) {
    case SET_AUTH:
      return { ...state, ...action.payload };
    case CLEAR_AUTH:
      return initialState;
    default:
      return state;
  }
}
