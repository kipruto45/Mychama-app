import type { AuthFlowState, PendingVerificationChallenge } from '@/auth/authFlow';
import { isAuthenticatedFlowState } from '@/auth/authFlow';
import type { AuthStackParamList } from '@/navigation/types';
import type { OnboardingPath, OnboardingStep } from '@/store/onboardingStore';
import type { PendingInviteContext } from '@/utils/inviteFlow';

export type StartupAuthRoute =
  | 'Welcome'
  | 'Login'
  | 'Onboarding'
  | 'OTPVerification'
  | 'ChooseChamaPath'
  | 'JoinChamaEntry'
  | 'SessionExpired';

export type RootStartupRoute =
  | 'Auth'
  | 'BasicProfileSetup'
  | 'CreateChama'
  | 'InvitePreview'
  | 'JoinViaCode'
  | 'MainTabs';

interface ResolveOnboardingDestinationInput {
  isAuthenticated: boolean;
  authFlowState: AuthFlowState;
  hasSeenPublicOnboarding: boolean;
  onboardingPath: OnboardingPath;
  onboardingStep: OnboardingStep;
  pendingVerification: PendingVerificationChallenge | null;
  pendingInvite: PendingInviteContext | null;
  hasExistingToken: boolean;
}

export interface OnboardingDestination {
  authInitialRoute: StartupAuthRoute;
  rootInitialRoute: RootStartupRoute;
  otpVerificationParams?: AuthStackParamList['OTPVerification'];
  invitePreviewParams?: { token: string };
  joinViaCodeParams?: { code: string };
}

function buildInviteRoute(
  pendingInvite: PendingInviteContext | null
): Pick<OnboardingDestination, 'rootInitialRoute' | 'invitePreviewParams' | 'joinViaCodeParams'> | null {
  if (!pendingInvite) {
    return null;
  }

  if (pendingInvite.intendedRoute === 'InvitePreview' && pendingInvite.token) {
    return {
      rootInitialRoute: 'InvitePreview',
      invitePreviewParams: { token: pendingInvite.token },
    };
  }

  if (pendingInvite.intendedRoute === 'JoinViaCode' && pendingInvite.code) {
    return {
      rootInitialRoute: 'JoinViaCode',
      joinViaCodeParams: { code: pendingInvite.code },
    };
  }

  return null;
}

export function resolveOnboardingDestination({
  isAuthenticated,
  authFlowState,
  hasSeenPublicOnboarding,
  onboardingPath,
  onboardingStep,
  pendingVerification,
  pendingInvite,
  hasExistingToken,
}: ResolveOnboardingDestinationInput): OnboardingDestination {
  const otpVerificationParams = pendingVerification
    ? {
        verificationContext: {
          identifier: pendingVerification.identifier,
          phone: pendingVerification.phone,
          email: pendingVerification.email,
          purpose: pendingVerification.purpose,
          deliveryMethod: pendingVerification.deliveryMethod,
          channelLabel: pendingVerification.channelLabel,
          displayTitle: pendingVerification.displayTitle,
          displaySubtitle: pendingVerification.displaySubtitle,
          maskedDestination: pendingVerification.maskedDestination,
          nextRoute: pendingVerification.nextRoute,
          nextToken: pendingVerification.nextToken,
          nextCode: pendingVerification.nextCode,
          successTitle: pendingVerification.successTitle,
          successMessage: pendingVerification.successMessage,
          registrationData: pendingVerification.registrationData,
        },
      }
    : undefined;

  if (authFlowState === 'session_expired') {
    return {
      authInitialRoute: 'SessionExpired',
      rootInitialRoute: 'Auth',
      otpVerificationParams,
    };
  }

  if (
    pendingVerification?.identifier ||
    authFlowState === 'registered_unverified' ||
    authFlowState === 'verifying_phone'
  ) {
    return {
      authInitialRoute: 'OTPVerification',
      rootInitialRoute: 'Auth',
      otpVerificationParams,
    };
  }

  if (!isAuthenticated) {
    if (hasExistingToken) {
      return {
        authInitialRoute: 'Login',
        rootInitialRoute: 'Auth',
        otpVerificationParams,
      };
    }
    return {
      authInitialRoute: 'Welcome',
      rootInitialRoute: 'Auth',
      otpVerificationParams,
    };
  }

  if (authFlowState === 'verified_profile_incomplete') {
    return {
      authInitialRoute: 'Onboarding',
      rootInitialRoute: 'BasicProfileSetup',
      otpVerificationParams,
    };
  }

  const pendingInviteRoute = buildInviteRoute(pendingInvite);

  if (authFlowState === 'verified_pending_chama_setup') {
    if (pendingInviteRoute) {
      return {
        authInitialRoute: 'Onboarding',
        otpVerificationParams,
        ...pendingInviteRoute,
      };
    }

    if (
      onboardingPath === 'create' ||
      onboardingStep === 'verified_pending_create_chama'
    ) {
      return {
        authInitialRoute: 'Onboarding',
        rootInitialRoute: 'CreateChama',
        otpVerificationParams,
      };
    }

    if (
      onboardingPath === 'join' ||
      onboardingStep === 'verified_pending_join_chama' ||
      onboardingStep === 'pending_invite_acceptance'
    ) {
      return {
        authInitialRoute: 'JoinChamaEntry',
        rootInitialRoute: 'Auth',
        otpVerificationParams,
      };
    }

    return {
      authInitialRoute: 'ChooseChamaPath',
      rootInitialRoute: 'Auth',
      otpVerificationParams,
    };
  }

  if (isAuthenticatedFlowState(authFlowState)) {
    if (pendingInviteRoute) {
      return {
        authInitialRoute: 'Onboarding',
        otpVerificationParams,
        ...pendingInviteRoute,
      };
    }

    return {
      authInitialRoute: 'Onboarding',
      rootInitialRoute: 'MainTabs',
      otpVerificationParams,
    };
  }

  return {
    authInitialRoute: 'Welcome',
    rootInitialRoute: 'Auth',
    otpVerificationParams,
  };
}
