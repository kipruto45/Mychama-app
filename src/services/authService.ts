/**
 * Authentication Service
 * 
 * Production-grade authentication service with:
 * - JWT token management
 * - Secure token storage
 * - Session management
 * - RBAC integration
 * - Audit logging hooks
 */

import { apiClient } from '@/api/client';
import { ApiError, ErrorCodes, toApiError } from '@/api/errors';
import { useAuthzStore } from '@/auth/store';
import { Role, parseRole } from '@/auth/roles';
import { resolveVerificationIdentifier } from '@/auth/verification';
import { useAuthStore } from '@/store/authStore';
import type { User, AuthTokens, OTPRequest, OTPVerification, RegisterData } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

interface LoginChallengeResponse {
  success?: boolean;
  code?: string;
  message?: string;
  identifier?: string;
  phone?: string;
  email?: string;
  purpose?: 'login_2fa';
  delivery_method?: 'sms' | 'email';
  delivery?: {
    channels?: string[];
    phone?: string;
    email?: string;
  };
}

type LoginResult =
  | {
      status: 'authenticated';
      tokens: AuthTokens;
    }
  | {
      status: 'otp_required';
      challenge: LoginChallengeResponse;
    };

interface RegisterResponse {
  success?: boolean;
  code?: string;
  message?: string;
  dev_otp?: string; // Development-only OTP code
  data?: {
    identifier: string;
    phone: string;
    email?: string;
    purpose: 'verify_phone' | 'verify_email';
    delivery_method: 'sms' | 'email';
    expires_in?: number;
    next_route?: string;
  };
  user: User;
  phone_verification_required: boolean;
  delivery?: {
    channels?: string[];
    phone?: string;
    email?: string;
  };
}

interface MembershipOption {
  chama_id: string;
  chama_name: string;
  role: string;
  is_active: boolean;
  is_approved: boolean;
}

interface MembershipOptionsResponse {
  active_chama: string | null;
  memberships: MembershipOption[];
}

interface ReferralSummary {
  referral_code?: string;
  stats?: Record<string, number>;
  history?: Array<Record<string, unknown>>;
  rewards?: Array<Record<string, unknown>>;
}

interface PasswordChangeRequest {
  old_password: string;
  new_password: string;
}

interface PasswordResetRequest {
  identifier: string;
}

interface PasswordResetConfirm {
  identifier: string;
  code: string;
  new_password: string;
}

interface OTPResponse {
  success?: boolean;
  code?: string;
  message?: string;
  errors?: Record<string, string[]>;
  data?: {
    identifier: string;
    phone?: string;
    email?: string;
    purpose: 'verify_phone' | 'verify_email' | 'login_2fa' | 'password_reset' | 'register' | 'withdrawal_confirm';
    delivery_method: 'sms' | 'email';
    expires_in?: number;
    next_route?: string;
  };
  dev_otp?: string; // Development-only OTP code
}

interface PasswordResetRequestResponse {
  code?: string;
  message?: string;
  dev_otp?: string; // Development-only OTP code
}

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

type AuditAction = 
  | 'login'
  | 'logout'
  | 'register'
  | 'password_change'
  | 'password_reset'
  | 'otp_request'
  | 'otp_verify'
  | 'profile_update'
  | 'session_refresh';

interface AuditLogEntry {
  action: AuditAction;
  userId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// AUTH SERVICE CLASS
// ============================================================================

class AuthService {
  private auditLog: AuditLogEntry[] = [];

  private unwrapUser(response: unknown): User {
    if (response && typeof response === 'object' && 'user' in (response as Record<string, unknown>)) {
      return (response as { user: User }).user;
    }
    return response as User;
  }

  private unwrapMembershipOptions(response: unknown): MembershipOptionsResponse {
    if (response && typeof response === 'object') {
      const data = response as Record<string, unknown>;
      if (Array.isArray(data.memberships)) {
        return {
          active_chama: typeof data.active_chama === 'string' ? data.active_chama : null,
          memberships: data.memberships as MembershipOption[],
        };
      }
      if (Array.isArray(data.chamas)) {
        return {
          active_chama: typeof data.active_chama === 'string' ? data.active_chama : null,
          memberships: data.chamas as MembershipOption[],
        };
      }
      if (data.data && typeof data.data === 'object') {
        return this.unwrapMembershipOptions(data.data);
      }
    }

    return {
      active_chama: null,
      memberships: [],
    };
  }

  // ==========================================================================
  // AUDIT LOGGING
  // ==========================================================================

  private logAudit(action: AuditAction, userId?: string, metadata?: Record<string, any>): void {
    const entry: AuditLogEntry = {
      action,
      userId,
      timestamp: new Date().toISOString(),
      metadata,
    };
    
    this.auditLog.push(entry);
    
    if (__DEV__) {
      const safeMetadata = { ...metadata };
      delete safeMetadata.requestTarget;
      console.log('[AUDIT]', { ...entry, metadata: safeMetadata });
    }
  }

  // ==========================================================================
  // AUTHENTICATION
  // ==========================================================================

  /**
   * Login with phone and password
   */
  async login(credentials: { phone: string; password: string }): Promise<LoginResult> {
    try {
      const response = await apiClient.login(credentials);

      if (
        response &&
        typeof response === 'object' &&
        'access' in (response as Record<string, unknown>) &&
        'refresh' in (response as Record<string, unknown>)
      ) {
        const tokens = response as AuthTokens;
        const { setUser } = useAuthStore.getState();
        const [profile, membershipOptions] = await Promise.all([
          this.getProfile(),
          this.getMembershipOptions().catch(() => null),
        ]);
        setUser(profile);
        if (membershipOptions) {
          this.updateMemberships(membershipOptions);
        }

        this.logAudit('login', profile.id, { phone: credentials.phone, twoFactor: false });
        return {
          status: 'authenticated',
          tokens,
        };
      }

      const challenge = (response ?? {}) as LoginChallengeResponse;
      if (challenge.code === 'OTP_REQUIRED') {
        this.logAudit('login', undefined, {
          phone: credentials.phone,
          code: challenge.code,
          twoFactor: true,
        });
        return {
          status: 'otp_required',
          challenge,
        };
      }

      throw new ApiError({
        code: ErrorCodes.INVALID_CREDENTIALS,
        message: challenge.message || 'Login failed.',
        status: 400,
      });
    } catch (error) {
      const normalizedError = toApiError(error);
      this.logAudit('login', undefined, { 
        phone: credentials.phone, 
        errorCode: normalizedError.code,
      });
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<RegisterResponse> {
    try {
      const response = await apiClient.register<RegisterResponse>(data);

      // Development-only: Log OTP to console if provided by backend
      if (__DEV__ && response.dev_otp) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📱 DEV OTP CODE (Frontend - Register):', response.dev_otp);
        console.log('   Purpose:', response.data?.purpose || 'unknown');
        console.log('   Delivery:', response.data?.delivery_method || data.otp_delivery_method);
        console.log('   Identifier:', response.data?.identifier || data.phone);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }

      // Log audit
      this.logAudit('register', response.user?.id, { phone: data.phone });

      return response;
    } catch (error) {
      const normalizedError = toApiError(error);
      this.logAudit('register', undefined, { 
        phone: data.phone, 
        errorCode: normalizedError.code,
        errorStatus: normalizedError.status,
      });
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const { user } = useAuthStore.getState();
      
      // Call backend logout
      await apiClient.logout();
      
      // Clear authz store
      const { clearAuth } = useAuthzStore.getState();
      clearAuth();
      
      // Clear pending invite context to prevent stale redirects
      const { clearPendingInviteIntent } = await import('@/utils/inviteFlow');
      await clearPendingInviteIntent();
      
      // Log audit
      this.logAudit('logout', user?.id);
    } catch (error) {
      // Even if logout fails, clear local state
      const { clearAuth } = useAuthzStore.getState();
      clearAuth();
      
      // Still try to clear pending invite
      try {
        const { clearPendingInviteIntent } = await import('@/utils/inviteFlow');
        await clearPendingInviteIntent();
      } catch {}
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return apiClient.isAuthenticated();
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<unknown>('/v1/auth/me');
    return this.unwrapUser(response);
  }

  /**
   * Get membership options for current user
   */
  async getMembershipOptions(): Promise<MembershipOptionsResponse> {
    try {
      const response = await apiClient.get<unknown>('/v1/auth/chamas');
      return this.unwrapMembershipOptions(response);
    } catch {
      const response = await apiClient.get<unknown>('/v1/auth/membership-options');
      return this.unwrapMembershipOptions(response);
    }
  }

  async switchActiveChama(chamaId: string): Promise<MembershipOptionsResponse> {
    await apiClient.post('/v1/auth/switch-chama', { chama_id: chamaId });

    try {
      const membershipOptions = await this.refreshMembershipContext(chamaId);
      return membershipOptions || {
        active_chama: chamaId,
        memberships: [],
      };
    } catch {
      const { setActiveChama } = useAuthzStore.getState();
      setActiveChama(chamaId);

      return {
        active_chama: chamaId,
        memberships: [],
      };
    }
  }

  async refreshMembershipContext(preferredChamaId?: string): Promise<MembershipOptionsResponse | null> {
    try {
      const membershipOptions = await this.getMembershipOptions();
      const resolvedOptions = {
        ...membershipOptions,
        active_chama: preferredChamaId || membershipOptions.active_chama || null,
      };
      this.updateMemberships(resolvedOptions);
      return resolvedOptions;
    } catch {
      if (preferredChamaId) {
        const { setActiveChama } = useAuthzStore.getState();
        setActiveChama(preferredChamaId);
      }
      return null;
    }
  }

  async getReferralSummary(): Promise<ReferralSummary> {
    const response = await apiClient.get<unknown>('/v1/auth/referrals');
    if (response && typeof response === 'object') {
      return response as ReferralSummary;
    }
    return {};
  }

  // ==========================================================================
  // PASSWORD MANAGEMENT
  // ==========================================================================

  /**
   * Request password reset OTP
   */
  async requestPasswordReset(payload: { email?: string; phone?: string; delivery_method?: string }): Promise<void> {
    try {
      const response = await apiClient.post<PasswordResetRequestResponse>('/v1/auth/password-reset/request', payload);
      
      // Development-only: Log OTP to console if provided by backend
      if (__DEV__ && response.dev_otp) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📱 DEV OTP CODE (Frontend - Password Reset):', response.dev_otp);
        console.log('   Purpose: password_reset');
        console.log('   Delivery:', payload.delivery_method || 'sms');
        console.log('   Identifier:', payload.phone || payload.email);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }
      
      this.logAudit('password_reset', undefined, payload);
    } catch (error) {
      this.logAudit('password_reset', undefined, { 
        ...payload, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Confirm password reset with OTP
   */
  async confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
    try {
      await apiClient.post('/v1/auth/password-reset/confirm', {
        identifier: data.identifier.trim(),
        code: data.code,
        new_password: data.new_password,
      });
      this.logAudit('password_reset', undefined, { identifier: data.identifier, confirmed: true });
    } catch (error) {
      this.logAudit('password_reset', undefined, { 
        identifier: data.identifier, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Change password (authenticated)
   */
  async changePassword(data: PasswordChangeRequest): Promise<void> {
    try {
      await apiClient.post('/v1/auth/change-password', data);
      this.logAudit('password_change');
    } catch (error) {
      this.logAudit('password_change', undefined, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  // ==========================================================================
  // OTP MANAGEMENT
  // ==========================================================================

  /**
   * Request OTP for verification
   */
  async requestOTP(data: OTPRequest): Promise<OTPResponse> {
    const identifier = resolveVerificationIdentifier({
      identifier: data.identifier,
      phone: data.phone,
      email: data.email,
      deliveryMethod: data.delivery_method,
      purpose: data.purpose,
    });
    const payload = {
      identifier,
      delivery_method: data.delivery_method,
      purpose:
        data.purpose ??
        (data.delivery_method === 'email' ? 'verify_email' : 'verify_phone'),
      ...(data.delivery_method === 'email'
        ? { email: identifier }
        : { phone: identifier }),
    };

    try {
      const response = await apiClient.post<OTPResponse>('/v1/auth/otp/send', payload);
      
      // Development-only: Log OTP to console if provided by backend
      if (__DEV__ && response.dev_otp) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📱 DEV OTP CODE (Frontend):', response.dev_otp);
        console.log('   Purpose:', payload.purpose);
        console.log('   Delivery:', data.delivery_method);
        console.log('   Identifier:', identifier);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }
      
      this.logAudit('otp_request', undefined, {
        identifier,
        method: data.delivery_method,
        purpose: payload.purpose,
      });
      return response;
    } catch (error) {
      this.logAudit('otp_request', undefined, {
        identifier,
        method: data.delivery_method,
        purpose: payload.purpose,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(data: OTPVerification): Promise<OTPResponse> {
    const inferredDeliveryMethod =
      data.purpose === 'verify_email'
        ? 'email'
        : data.purpose === 'verify_phone'
        ? 'sms'
        : data.email || data.identifier.includes('@')
        ? 'email'
        : 'sms';
    const identifier = resolveVerificationIdentifier({
      identifier: data.identifier,
      phone: data.phone,
      email: data.email,
      deliveryMethod: inferredDeliveryMethod,
      purpose: data.purpose,
    });
    const payload = {
      identifier,
      code: data.code,
      purpose: data.purpose ?? (inferredDeliveryMethod === 'email' ? 'verify_email' : 'verify_phone'),
      ...(data.purpose === 'verify_email' || inferredDeliveryMethod === 'email'
        ? { email: identifier }
        : { phone: identifier }),
    };

    if (__DEV__) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📱 OTP VERIFICATION CODE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   Code: ${data.code}`);
      console.log(`   Identifier: ${identifier}`);
      console.log(`   Purpose: ${payload.purpose}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    try {
      const response = await apiClient.post<OTPResponse | LoginResponse>('/v1/auth/otp/confirm', payload);

      if (
        response &&
        typeof response === 'object' &&
        'access' in (response as Record<string, unknown>) &&
        'refresh' in (response as Record<string, unknown>)
      ) {
        const tokenResponse = response as LoginResponse;
        const { setTokens, setUser } = useAuthStore.getState();

        await setTokens({
          access: tokenResponse.access,
          refresh: tokenResponse.refresh,
        });

        setUser(tokenResponse.user);

        const membershipOptions = await this.getMembershipOptions().catch(() => null);
        if (membershipOptions) {
          this.updateMemberships(membershipOptions);
        }
      }

      this.logAudit('otp_verify', undefined, {
        identifier,
        purpose: payload.purpose,
      });
      return response as OTPResponse;
    } catch (error) {
      this.logAudit('otp_verify', undefined, {
        identifier,
        purpose: payload.purpose,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================

  /**
   * Refresh authentication tokens
   */
  async refreshTokens(): Promise<AuthTokens> {
    try {
      const tokens = await apiClient.refreshTokens();
      this.logAudit('session_refresh');
      return tokens;
    } catch (error) {
      // If refresh fails, clear session
      await this.logout();
      throw new ApiError({
        code: ErrorCodes.SESSION_EXPIRED,
        message: 'Session expired. Please sign in again.',
        status: 401,
      });
    }
  }

  /**
   * Clear all session data
   */
  async clearSession(): Promise<void> {
    await apiClient.clearSession();
    const { clearAuth } = useAuthzStore.getState();
    clearAuth();
  }

  // ==========================================================================
  // RBAC INTEGRATION
  // ==========================================================================

  /**
   * Update memberships in authz store
   */
  private updateMemberships(options: MembershipOptionsResponse): void {
    const { setMemberships, setActiveChama } = useAuthzStore.getState();
    
    const memberships = options.memberships.map(m => ({
      chamaId: m.chama_id,
      chamaName: m.chama_name,
      role: parseRole(m.role) || Role.MEMBER,
      isActive: m.is_active,
      isApproved: m.is_approved,
    }));
    
    setMemberships(memberships);
    
    // Set active chama
    if (options.active_chama) {
      setActiveChama(options.active_chama);
    } else if (memberships.length > 0) {
      // Default to first active membership
      const activeMembership = memberships.find(m => m.isActive && m.isApproved);
      if (activeMembership) {
        setActiveChama(activeMembership.chamaId);
      }
    }
  }

  /**
   * Get user's role in a specific chama
   */
  async getUserRoleInChama(chamaId: string): Promise<Role | null> {
    const { getMembership } = useAuthzStore.getState();
    const membership = getMembership(chamaId);
    return membership?.role || null;
  }

  /**
   * Check if user has permission in a chama
   */
  async hasPermissionInChama(chamaId: string, permission: string): Promise<boolean> {
    const { hasPermission } = useAuthzStore.getState();
    return hasPermission(permission as any, chamaId);
  }

  // ==========================================================================
  // PROFILE MANAGEMENT
  // ==========================================================================

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.patch<unknown>('/v1/auth/me', data);
      const updatedUser = this.unwrapUser(response);
      
      // Update user in store
      const { setUser } = useAuthStore.getState();
      setUser(updatedUser);
      
      this.logAudit('profile_update', updatedUser.id);
      
      return updatedUser;
    } catch (error) {
      this.logAudit('profile_update', undefined, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  // ==========================================================================
  // AUDIT LOG ACCESS
  // ==========================================================================

  /**
   * Get audit log entries
   */
  getAuditLog(): AuditLogEntry[] {
    return [...this.auditLog];
  }

  /**
   * Clear audit log
   */
  clearAuditLog(): void {
    this.auditLog = [];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const authService = new AuthService();
export type { 
  LoginResponse, 
  MembershipOption, 
  MembershipOptionsResponse,
  PasswordChangeRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
  AuditLogEntry,
  AuditAction,
};
