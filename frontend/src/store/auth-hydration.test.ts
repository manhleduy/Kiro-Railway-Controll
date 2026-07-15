// Property 25: Auth state hydration round-trip
// Validates: Requirements 25 — setAuth + authReducer correctly stores and retrieves token/role/user
// Pure fast-check property test — no test-runner globals needed.
import * as fc from 'fast-check';
import { authReducer, setAuth, clearAuth } from './authSlice';

// Run immediately as a module-level assertion
fc.assert(
  fc.property(
    fc.record({
      token: fc.string({ minLength: 10 }),
      role: fc.constantFrom('customer' as const, 'staff' as const),
    }),
    ({ token, role }) => {
      const state = authReducer(undefined, setAuth({ token, role, user: null }));
      const tokenOk = state.token === token;
      const roleOk = state.role === role;
      const cleared = authReducer(state, clearAuth());
      const tokenCleared = cleared.token === null;
      const roleCleared = cleared.role === null;
      return tokenOk && roleOk && tokenCleared && roleCleared;
    },
  ),
  { numRuns: 100 },
);
