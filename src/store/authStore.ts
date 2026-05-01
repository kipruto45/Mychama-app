import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, AuthTokens } from '@/types';
import { storage, zustandStorage } from '@/utils/storage';
import type { AuthFlowState, PendingVerificationChallenge } from '@/auth/authFlow';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  authFlowState: AuthFlowState;
  pendingVerification: PendingVerificationChallenge | null;
  sessionExpiredMessage: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens) => void;
  clearSession: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setAuthError: (message: string | null) => void;
  setAuthFlowState: (state: AuthFlowState) => void;
  setPendingVerification: (challenge: PendingVerificationChallenge | null) => void;
  clearPendingVerification: () => void;
  markSessionExpired: (message?: string | null) => Promise<void>;
  clearSessionExpired: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      authError: null,
      authFlowState: 'bootstrapping',
      pendingVerification: null,
      sessionExpiredMessage: null,
      
      setUser: (user) => set({ user, isAuthenticated: !!user, authError: null }),
      setTokens: async (tokens) => {
        await storage.setItem('access_token', tokens.access);
        await storage.setItem('refresh_token', tokens.refresh);
      },
      clearSession: async () => {
        await storage.removeItem('access_token');
        await storage.removeItem('refresh_token');
        set({
          user: null,
          isAuthenticated: false,
          authError: null,
          authFlowState: 'unauthenticated',
          pendingVerification: null,
          sessionExpiredMessage: null,
        });
      },
      setLoading: (isLoading) => set({ isLoading }),
      setAuthError: (authError) => set({ authError }),
      setAuthFlowState: (authFlowState) => set({ authFlowState }),
      setPendingVerification: (pendingVerification) => set({ pendingVerification }),
      clearPendingVerification: () => set({ pendingVerification: null }),
      markSessionExpired: async (message) => {
        await storage.removeItem('access_token');
        await storage.removeItem('refresh_token');
        set({
          user: null,
          isAuthenticated: false,
          authError: null,
          authFlowState: 'session_expired',
          pendingVerification: null,
          sessionExpiredMessage: message || 'Your session expired. Please sign in again.',
        });
      },
      clearSessionExpired: () =>
        set((state) => ({
          sessionExpiredMessage: null,
          authFlowState:
            state.authFlowState === 'session_expired' ? 'unauthenticated' : state.authFlowState,
        })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        authFlowState: state.authFlowState,
        pendingVerification: state.pendingVerification,
        sessionExpiredMessage: state.sessionExpiredMessage,
      }),
    }
  )
);
