/**
 * Authentication Provider
 * 
 * Provides authentication context and manages auth state.
 * Integrates with RBAC system for authorization.
 */

import React, { createContext, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAuthzStore } from '@/auth/store';
import { authService } from '@/services/authService';
import { analyticsService } from '@/services/analyticsService';
import {
  createPendingVerificationChallenge,
  deriveAuthFlowState,
  isProfileComplete,
  type AuthFlowState,
  type PendingVerificationChallenge,
} from '@/auth/authFlow';
import { Role, parseRole } from '@/auth/roles';
import { resolveVerificationContext } from '@/auth/verification';
import { pushNotificationService } from '@/services/pushNotificationService';
import { useOnboardingStore } from '@/store/onboardingStore';
import type { User, OTPRequest, OTPVerification, RegisterData } from '@/types';
import { getUserMessage } from '@/utils/userMessages';

// ============================================================================
// TYPES
// ============================================================================

interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  authFlowState: AuthFlowState;
  pendingVerification: PendingVerificationChallenge | null;
  sessionExpiredMessage: string | null;
  
  // Actions
  login: (phone: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  requestOTP: (
    identifier: string,
    deliveryMethod: 'sms' | 'email',
    purpose?: OTPRequest['purpose']
  ) => Promise<void>;
  verifyOTP: (
    identifier: string,
    code: string,
    purpose?: OTPVerification['purpose']
  ) => Promise<void>;
  requestPasswordReset: (payload: { email?: string; phone?: string; delivery_method?: string }) => Promise<void>;
  resetPassword: (phone: string, code: string, newPassword: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  clearAuthError: () => void;
  clearSessionExpired: () => void;
  
  // RBAC helpers
  hasRole: (role: Role, chamaId?: string) => boolean;
  hasAnyRole: (roles: Role[], chamaId?: string) => boolean;
  isRoleAtLeast: (role: Role, chamaId?: string) => boolean;
  getActiveRole: (chamaId?: string) => Role | null;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    user,
    isAuthenticated,
    isLoading,
    authError,
    authFlowState,
    pendingVerification,
    sessionExpiredMessage,
    setUser,
    setLoading,
    clearSession,
    setAuthError,
    setAuthFlowState,
    setPendingVerification,
    clearPendingVerification,
    markSessionExpired,
    clearSessionExpired,
  } = useAuthStore();
  
  const {
    setGlobalRole,
    setMemberships,
    setActiveChama,
    hasRole,
    hasAnyRole,
    isRoleAtLeast,
    getActiveRole,
    clearAuth: clearAuthz,
  } = useAuthzStore();

  const createVerificationChallenge = useCallback(
    (input: Omit<PendingVerificationChallenge, 'createdAt'>) =>
      createPendingVerificationChallenge(resolveVerificationContext(input)),
    []
  );

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    void checkAuthState();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    void (async () => {
      try {
        await analyticsService.identify(user.id, {
          email: user.email,
          phone: user.phone,
        });
      } catch (error) {
        console.warn('Analytics identify failed during auth bootstrap:', error);
      }

      try {
        await pushNotificationService.registerDevice();
      } catch (error) {
        console.warn('Push registration failed during auth bootstrap:', error);
      }
    })();
  }, [isAuthenticated, user]);

  // ==========================================================================
  // AUTH STATE MANAGEMENT
  // ==========================================================================

  const resolveAuthFlowState = useCallback(
    (userData: User | null) =>
      deriveAuthFlowState({
        user: userData,
        isAuthenticated: !!userData,
        sessionExpired: false,
        pendingVerification,
        globalRole: parseRole(userData?.role) || null,
        activeChamaId: useAuthzStore.getState().activeChamaId,
        memberships: useAuthzStore.getState().memberships,
      }),
    [pendingVerification]
  );

  const syncOnboardingFromUserState = useCallback(
    ({
      nextState,
      userData,
      membershipOptions,
      hasPendingInvite = false,
    }: {
      nextState: AuthFlowState;
      userData: User | null;
      membershipOptions?: any | null;
      hasPendingInvite?: boolean;
    }) => {
      const onboardingStore = useOnboardingStore.getState();
      const activeChamaId =
        membershipOptions?.active_chama ??
        userData?.active_chama_id ??
        useAuthzStore.getState().activeChamaId;

      onboardingStore.syncResolvedState({
        authFlowState: nextState,
        path: onboardingStore.path,
        phoneNumber: userData?.phone ?? onboardingStore.phoneNumber,
        isPhoneVerified: !!userData?.phone_verified,
        isProfileComplete: isProfileComplete(userData),
        activeChamaId,
        activeRole: userData?.role ?? onboardingStore.activeRole,
        hasPendingInvite,
      });
    },
    []
  );

  const applyAuthenticatedState = useCallback(
    async (userData: User, membershipOptions?: any | null) => {
      setUser(userData);

      if (membershipOptions) {
        updateRBACStore(membershipOptions, userData.role);
      } else {
        setGlobalRole(parseRole(userData.role) || null);
      }

      const nextState = deriveAuthFlowState({
        user: userData,
        isAuthenticated: true,
        sessionExpired: false,
        pendingVerification,
        globalRole: parseRole(userData.role) || null,
        activeChamaId:
          membershipOptions?.active_chama ??
          userData.active_chama_id ??
          useAuthzStore.getState().activeChamaId,
        memberships:
          membershipOptions
            ? useAuthzStore.getState().memberships
            : useAuthzStore.getState().memberships,
      });

      if (nextState === 'verifying_phone') {
        setPendingVerification(
          pendingVerification?.purpose === 'verify_phone' || pendingVerification?.purpose === 'verify_email'
            ? pendingVerification
            : createVerificationChallenge({
                identifier: userData.phone,
                phone: userData.phone,
                deliveryMethod: 'sms',
                purpose: 'verify_phone',
                nextRoute: 'ChamaSetup',
              })
        );
      } else {
        clearPendingVerification();
      }

      syncOnboardingFromUserState({
        nextState,
        userData,
        membershipOptions,
      });
      clearSessionExpired();
      setAuthFlowState(nextState);

      // Clear any stale pending invite context after successful authentication
      // This prevents old invite codes from redirecting users unexpectedly
      const { clearPendingInviteIntent } = await import('@/utils/inviteFlow');
      await clearPendingInviteIntent();
    },
    [
      clearPendingVerification,
      clearSessionExpired,
      createVerificationChallenge,
      pendingVerification,
      setAuthFlowState,
      setGlobalRole,
      setPendingVerification,
      setUser,
      syncOnboardingFromUserState,
    ]
  );

  const checkAuthState = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      
      if (isAuth) {
        const [userData, membershipOptions] = await Promise.all([
          authService.getProfile(),
          authService.getMembershipOptions().catch(() => null),
        ]);

        await applyAuthenticatedState(userData, membershipOptions);
      } else {
        clearAuthz();
        if (pendingVerification?.purpose === 'verify_phone' || pendingVerification?.purpose === 'verify_email') {
          useOnboardingStore.getState().markVerificationRequired(pendingVerification.phone || pendingVerification.identifier);
          setAuthFlowState('registered_unverified');
        } else if (sessionExpiredMessage) {
          setAuthFlowState('session_expired');
        } else {
          useOnboardingStore.getState().syncResolvedState({
            authFlowState: 'unauthenticated',
            path: useOnboardingStore.getState().path,
          });
          setAuthFlowState('unauthenticated');
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      clearAuthz();
      const message = getUserMessage(error, 'auth.login').message;
      await markSessionExpired(message);
    } finally {
      setLoading(false);
    }
  };

  const updateRBACStore = (options: any, userRole?: string | null) => {
    setGlobalRole(parseRole(userRole) || null);

    const memberships = options.memberships?.map((m: any) => ({
      chamaId: m.chama_id,
      chamaName: m.chama_name,
      role: parseRole(m.role) || Role.MEMBER,
      isActive: m.is_active,
      isApproved: m.is_approved,
    })) || [];
    
    setMemberships(memberships);
    
    if (options.active_chama) {
      setActiveChama(options.active_chama);
    } else if (memberships.length > 0) {
      const activeMembership = memberships.find((m: any) => m.isActive && m.isApproved);
      if (activeMembership) {
        setActiveChama(activeMembership.chamaId);
      }
    }
  };

  // ==========================================================================
  // AUTH ACTIONS
  // ==========================================================================

  const login = useCallback(async (phone: string, password: string) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      const result = await authService.login({ phone, password });

      if (result.status === 'otp_required') {
        const challengeIdentifier =
          result.challenge.identifier ||
          result.challenge.phone ||
          result.challenge.email ||
          phone;
        const challengeDeliveryMethod =
          result.challenge.delivery_method ||
          (result.challenge.delivery?.channels?.includes('email') ? 'email' : 'sms');
        setPendingVerification(
          createVerificationChallenge({
            identifier: challengeIdentifier,
            phone: result.challenge.phone || phone,
            email: result.challenge.email,
            deliveryMethod: challengeDeliveryMethod,
            purpose: 'login_2fa',
            nextRoute: 'ChamaSetup',
            successTitle: 'Verify sign in',
            successMessage: result.challenge.message || 'Enter the code we sent to continue.',
          })
        );
        setAuthFlowState('unauthenticated');
        return;
      }

      const [userData, membershipOptions] = await Promise.all([
        authService.getProfile(),
        authService.getMembershipOptions().catch(() => null),
      ]);

      await applyAuthenticatedState(userData, membershipOptions);
    } catch (error) {
      const message = getUserMessage(error, 'auth.login').message;
      setAuthError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [applyAuthenticatedState, createVerificationChallenge, setLoading, setAuthError, setPendingVerification, setAuthFlowState]);

  const register = useCallback(async (data: RegisterData) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      const response = await authService.register(data);
      const responseData = response.data;
      const otpWasSent =
        response.code === 'OTP_SENT' || response.code === 'REGISTER_SUCCESS_OTP_SENT';
      useOnboardingStore.getState().markVerificationRequired(responseData?.phone || data.phone);
      setPendingVerification(
        createVerificationChallenge({
          identifier: responseData?.identifier || data.phone,
          phone: responseData?.phone || data.phone,
          email: responseData?.email || data.email,
          deliveryMethod: responseData?.delivery_method || data.otp_delivery_method,
          purpose: responseData?.purpose || (data.otp_delivery_method === 'email' ? 'verify_email' : 'verify_phone'),
          nextRoute: 'ChamaSetup',
          successTitle: otpWasSent ? 'Verification code sent' : undefined,
          successMessage: otpWasSent ? response.message : undefined,
          registrationData: {
            fullName: data.full_name || '',
            firstName: data.full_name?.split(' ')[0] || '',
            lastName: data.full_name?.split(' ').slice(1).join(' ') || '',
            phone: responseData?.phone || data.phone,
            normalizedPhone: responseData?.phone || data.phone,
            email: responseData?.email || data.email || '',
            otpDeliveryMethod: responseData?.delivery_method || data.otp_delivery_method,
            password: data.password,
            confirmPassword: data.password_confirm,
          },
        })
      );
      setAuthFlowState('registered_unverified');
    } catch (error) {
      const details = (error as { details?: { data?: Record<string, any> } }).details?.data;
      if (
        ((error as { code?: string }).code === 'ACCOUNT_CREATED_BUT_OTP_FAILED' ||
          (error as { code?: string }).code === 'REGISTER_SUCCESS_OTP_FAILED') &&
        details
      ) {
        useOnboardingStore.getState().markVerificationRequired(details.phone || data.phone);
        setPendingVerification(
          createVerificationChallenge({
            identifier: details.identifier || data.phone,
            phone: details.phone || data.phone,
            email: details.email || data.email,
            deliveryMethod: details.delivery_method || data.otp_delivery_method,
            purpose: details.purpose || (data.otp_delivery_method === 'email' ? 'verify_email' : 'verify_phone'),
            nextRoute: 'ChamaSetup',
            registrationData: {
              fullName: data.full_name || '',
              firstName: data.full_name?.split(' ')[0] || '',
              lastName: data.full_name?.split(' ').slice(1).join(' ') || '',
              phone: details.phone || data.phone,
              normalizedPhone: details.phone || data.phone,
              email: details.email || data.email || '',
              otpDeliveryMethod: details.delivery_method || data.otp_delivery_method,
              password: data.password,
              confirmPassword: data.password_confirm,
            },
          })
        );
        setAuthFlowState('registered_unverified');
        return;
      }
      const message = getUserMessage(error, 'auth.register').message;
      setAuthError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [createVerificationChallenge, setAuthFlowState, setLoading, setAuthError, setPendingVerification]);

  const requestOTP = useCallback(async (
    identifier: string,
    deliveryMethod: 'sms' | 'email',
    purpose: OTPRequest['purpose'] = 'verify_phone'
  ) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      const payload: OTPRequest = {
        identifier,
        delivery_method: deliveryMethod,
        purpose,
        ...(deliveryMethod === 'email'
          ? { email: identifier }
          : { phone: identifier }),
      };
      const response = await authService.requestOTP(payload);
      const responseData = response.data;
      if (response.code === 'OTP_SENT' && (purpose === 'verify_phone' || purpose === 'verify_email' || purpose === 'login_2fa')) {
        setPendingVerification(
          createVerificationChallenge({
            identifier: responseData?.identifier || identifier,
            phone: responseData?.phone || (deliveryMethod === 'sms' ? identifier : pendingVerification?.phone || ''),
            email: responseData?.email || (deliveryMethod === 'email' ? identifier : pendingVerification?.email),
            deliveryMethod: responseData?.delivery_method || deliveryMethod,
            purpose: responseData?.purpose || purpose,
            nextRoute: 'ChamaSetup',
            successTitle: 'Verification code sent',
            successMessage: response.message,
          })
        );
        if (purpose === 'verify_phone' || purpose === 'verify_email') {
          useOnboardingStore.getState().markVerificationRequired(responseData?.phone || pendingVerification?.phone || identifier);
          setAuthFlowState('registered_unverified');
        }
      }
    } catch (error) {
      const message = getUserMessage(error, 'auth.otp.request').message;
      setAuthError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [createVerificationChallenge, pendingVerification?.email, pendingVerification?.phone, setAuthFlowState, setLoading, setAuthError, setPendingVerification]);

  const verifyOTP = useCallback(async (
    identifier: string,
    code: string,
    purpose: OTPVerification['purpose'] = 'verify_phone'
  ) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      const payload: OTPVerification = {
        identifier,
        code,
        purpose,
        ...(purpose === 'verify_email'
          ? { email: identifier }
          : purpose === 'verify_phone'
          ? { phone: identifier }
          : identifier.includes('@')
          ? { email: identifier }
          : { phone: identifier }),
      };
      
      if (__DEV__) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔐 Verifying OTP...');
        console.log('   identifier:', identifier);
        console.log('   purpose:', purpose);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }
      
      await authService.verifyOTP(payload);

      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const [userData, membershipOptions] = await Promise.all([
          authService.getProfile(),
          authService.getMembershipOptions().catch(() => null),
        ]);
        await applyAuthenticatedState(userData, membershipOptions);
      } else if (purpose === 'verify_phone' || purpose === 'verify_email') {
        useOnboardingStore.getState().markPhoneVerified();
        clearPendingVerification();
        setAuthFlowState('unauthenticated');
      }
      
      if (__DEV__) {
        console.log('\n✅ OTP Verified successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }
    } catch (error) {
      const message = getUserMessage(error, 'auth.otp.verify').message;
      setAuthError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [applyAuthenticatedState, clearPendingVerification, setAuthFlowState, setLoading, setAuthError]);

  const requestPasswordReset = useCallback(async (payload: { email?: string; phone?: string; delivery_method?: string }) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      await authService.requestPasswordReset(payload);
    } catch (error) {
      const message = getUserMessage(error, 'auth.passwordReset.request').message;
      setAuthError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setAuthError]);

  const resetPassword = useCallback(async (identifier: string, code: string, newPassword: string) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      await authService.confirmPasswordReset({
        identifier,
        code,
        new_password: newPassword,
      });
    } catch (error) {
      const message = getUserMessage(error, 'auth.passwordReset.confirm').message;
      setAuthError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setAuthError]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      const updatedUser = await authService.updateProfile(data);
      const membershipOptions = await authService.getMembershipOptions().catch(() => null);
      useOnboardingStore.getState().markProfileComplete();
      await applyAuthenticatedState(updatedUser, membershipOptions);
      return updatedUser;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile update failed';
      setAuthError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [applyAuthenticatedState, setLoading, setAuthError]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      await authService.changePassword({
        old_password: currentPassword,
        new_password: newPassword,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password change failed';
      setAuthError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setAuthError]);

  const logout = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    try {
      try {
        await pushNotificationService.unregisterDevice();
      } catch (error) {
        console.warn('Push unregistration failed during logout (non-blocking):', error);
      }
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await clearSession();
      setUser(null);
      clearAuthz();
      useOnboardingStore.getState().reset();
      clearPendingVerification();
      clearSessionExpired();
      setAuthFlowState('unauthenticated');
      setLoading(false);
    }
  }, [clearPendingVerification, clearSession, clearAuthz, clearSessionExpired, setAuthError, setAuthFlowState, setLoading, setUser]);

  const updateUser = useCallback((userData: User) => {
    setUser(userData);
    const nextState = resolveAuthFlowState(userData);
    syncOnboardingFromUserState({
      nextState,
      userData,
    });
    setAuthFlowState(nextState);
  }, [resolveAuthFlowState, setAuthFlowState, setUser, syncOnboardingFromUserState]);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, [setAuthError]);

  // ==========================================================================
  // CONTEXT VALUE
  // ==========================================================================

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    authError,
    authFlowState,
    pendingVerification,
    sessionExpiredMessage,
    login,
    register,
    requestOTP,
    verifyOTP,
    requestPasswordReset,
    resetPassword,
    updateProfile,
    changePassword,
    logout,
    updateUser,
    clearAuthError,
    clearSessionExpired,
    hasRole,
    hasAnyRole,
    isRoleAtLeast,
    getActiveRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
