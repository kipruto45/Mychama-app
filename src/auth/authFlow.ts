import type { User } from '@/types';
import { needsChamaSetup } from './chamaAccess';
import { Role, parseRole } from './roles';

export type AuthFlowState =
  | 'bootstrapping'
  | 'unauthenticated'
  | 'registered_unverified'
  | 'verifying_phone'
  | 'verified_profile_incomplete'
  | 'verified_pending_chama_setup'
  | 'authenticated_member'
  | 'authenticated_chama_admin'
  | 'authenticated_treasurer'
  | 'authenticated_secretary'
  | 'authenticated_auditor'
  | 'authenticated_admin'
  | 'authenticated_superadmin'
  | 'session_expired';

export interface PendingVerificationChallenge {
  identifier: string;
  phone: string;
  email?: string;
  purpose:
    | 'verify_phone'
    | 'verify_email'
    | 'login_2fa'
    | 'password_reset'
    | 'withdrawal_confirm'
    | 'register';
  deliveryMethod: 'console' | 'sms' | 'email';
  channelLabel?: string;
  displayTitle?: string;
  displaySubtitle?: string;
  maskedDestination?: string;
  createdAt: string;
  successTitle?: string;
  successMessage?: string;
  nextRoute:
    | 'ChamaSetup'
    | 'CreateChama'
    | 'Login'
    | 'InvitePreview'
    | 'JoinViaCode'
    | 'BasicProfileSetup'
    | 'ChooseChamaPath';
  nextToken?: string;
  nextCode?: string;
  registrationData?: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    normalizedPhone?: string;
    email?: string;
    otpDeliveryMethod?: 'sms' | 'email';
    password?: string;
    confirmPassword?: string;
    acceptedTerms?: boolean;
  };
}

export function createPendingVerificationChallenge(
  challenge: Omit<PendingVerificationChallenge, 'createdAt'>
): PendingVerificationChallenge {
  return {
    ...challenge,
    createdAt: new Date().toString(),
  };
}

export interface AuthFlowMembership {
  chamaId: string;
  role: Role;
  isActive: boolean;
  isApproved: boolean;
}

interface AuthFlowContext {
  user: User | null;
  isAuthenticated: boolean;
  sessionExpired: boolean;
  pendingVerification: PendingVerificationChallenge | null;
  globalRole: Role | null;
  activeChamaId: string | null;
  memberships: AuthFlowMembership[];
}

export function isProfileComplete(user: Pick<User, 'full_name' | 'email' | 'profile_completed'> | null): boolean {
  if (!user) {
    return false;
  }

  if (typeof user.profile_completed === 'boolean') {
    return user.profile_completed;
  }

  return Boolean(user.full_name?.trim() && user.email?.trim());
}

export function mapRoleToAuthState(role: string | null | undefined): AuthFlowState {
  switch (parseRole(role)) {
    case Role.SUPERADMIN:
      return 'authenticated_superadmin';
    case Role.ADMIN:
      return 'authenticated_admin';
    case Role.CHAMA_ADMIN:
      return 'authenticated_chama_admin';
    case Role.TREASURER:
      return 'authenticated_treasurer';
    case Role.SECRETARY:
      return 'authenticated_secretary';
    case Role.AUDITOR:
      return 'authenticated_auditor';
    case Role.MEMBER:
    default:
      return 'authenticated_member';
  }
}

export function deriveAuthFlowState({
  user,
  isAuthenticated,
  sessionExpired,
  pendingVerification,
  globalRole,
  activeChamaId,
  memberships,
}: AuthFlowContext): AuthFlowState {
  if (sessionExpired) {
    return 'session_expired';
  }

  if (!isAuthenticated || !user) {
    if (pendingVerification?.purpose === 'verify_phone' || pendingVerification?.purpose === 'verify_email') {
      return 'registered_unverified';
    }
    return 'unauthenticated';
  }

  if (!user.phone_verified) {
    return 'verifying_phone';
  }

  if (!isProfileComplete(user)) {
    return 'verified_profile_incomplete';
  }

  if (
    needsChamaSetup({
      globalRole,
      activeChamaId,
      memberships,
    })
  ) {
    return 'verified_pending_chama_setup';
  }

  return mapRoleToAuthState(user.role);
}

export function isAuthenticatedFlowState(state: AuthFlowState): boolean {
  return [
    'verifying_phone',
    'verified_profile_incomplete',
    'verified_pending_chama_setup',
    'authenticated_member',
    'authenticated_chama_admin',
    'authenticated_treasurer',
    'authenticated_secretary',
    'authenticated_auditor',
    'authenticated_admin',
    'authenticated_superadmin',
  ].includes(state);
}
