/**
 * Onboarding Store
 *
 * Persists the structured onboarding journey for authenticated and
 * onboarding-in-progress users so the app can resume safely after restart.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { AuthFlowState } from '@/auth/authFlow';
import { Role, parseRole } from '@/auth/roles';
import type { CreateChamaInviteDraft, CreateChamaWorkflowDraft } from '@/types';
import { zustandStorage } from '@/utils/storage';

export type OnboardingPath = 'create' | 'join' | null;

export type OnboardingStep =
  | 'unauthenticated'
  | 'welcome_seen'
  | 'registered_unverified'
  | 'verifying_phone'
  | 'verified_profile_incomplete'
  | 'verified_choose_chama_path'
  | 'verified_pending_create_chama'
  | 'verified_pending_join_chama'
  | 'pending_invite_acceptance'
  | 'onboarding_complete_chama_admin'
  | 'onboarding_complete_member';

export type CreateChamaSetupState =
  | 'chama_setup_not_started'
  | 'chama_setup_basic_details'
  | 'chama_setup_contributions'
  | 'chama_setup_rules'
  | 'chama_setup_loans_and_fines'
  | 'chama_setup_meetings'
  | 'chama_setup_invites'
  | 'chama_setup_review'
  | 'chama_setup_submitting'
  | 'chama_setup_complete';

export interface CreateChamaProgress {
  setupState: CreateChamaSetupState;
  currentStep: number;
  draft: CreateChamaWorkflowDraft | null;
  inviteDrafts: CreateChamaInviteDraft[];
  lastSubmissionError: string | null;
}

export interface JoinChamaProgress {
  inviteCode: string | null;
  inviteToken: string | null;
  previewChamaName: string | null;
}

interface SyncOnboardingStateInput {
  authFlowState: AuthFlowState;
  path?: OnboardingPath;
  phoneNumber?: string | null;
  isPhoneVerified?: boolean;
  isProfileComplete?: boolean;
  activeChamaId?: string | null;
  activeChamaName?: string | null;
  activeRole?: string | null;
  hasPendingInvite?: boolean;
}

export interface OnboardingState {
  step: OnboardingStep;
  path: OnboardingPath;
  phoneNumber: string | null;
  isPhoneVerified: boolean;
  isProfileComplete: boolean;
  activeChamaId: string | null;
  activeChamaName: string | null;
  activeRole: string | null;
  onboardingCompleted: boolean;
  createChamaProgress: CreateChamaProgress;
  joinChamaProgress: JoinChamaProgress;
  lastUpdated: string | null;

  markWelcomeSeen: () => void;
  markVerificationRequired: (phoneNumber?: string | null) => void;
  markPhoneVerified: () => void;
  markProfileComplete: () => void;
  selectPath: (path: Exclude<OnboardingPath, null>) => void;
  setStep: (step: OnboardingStep) => void;
  setCreateChamaProgress: (progress: Partial<CreateChamaProgress>) => void;
  clearCreateChamaProgress: () => void;
  setJoinChamaProgress: (progress: Partial<JoinChamaProgress>) => void;
  clearJoinChamaProgress: () => void;
  markPendingInviteAcceptance: (progress?: Partial<JoinChamaProgress>) => void;
  completeChamaCreation: (chamaId: string, chamaName?: string | null, role?: string | null) => void;
  completeJoin: (chamaId: string, chamaName?: string | null, role?: string | null) => void;
  syncResolvedState: (input: SyncOnboardingStateInput) => void;
  reset: () => void;
}

const INITIAL_CREATE_PROGRESS: CreateChamaProgress = {
  setupState: 'chama_setup_not_started',
  currentStep: 0,
  draft: null,
  inviteDrafts: [],
  lastSubmissionError: null,
};

const INITIAL_JOIN_PROGRESS: JoinChamaProgress = {
  inviteCode: null,
  inviteToken: null,
  previewChamaName: null,
};

function isAdminCompletionRole(role: string | null | undefined): boolean {
  return parseRole(role) === Role.CHAMA_ADMIN;
}

export function deriveOnboardingStepFromState({
  authFlowState,
  path,
  activeChamaId,
  activeRole,
  hasPendingInvite = false,
}: SyncOnboardingStateInput): OnboardingStep {
  switch (authFlowState) {
    case 'registered_unverified':
      return 'registered_unverified';
    case 'verifying_phone':
      return 'verifying_phone';
    case 'verified_profile_incomplete':
      return 'verified_profile_incomplete';
    case 'verified_pending_chama_setup':
      if (hasPendingInvite) {
        return 'pending_invite_acceptance';
      }
      if (path === 'create') {
        return 'verified_pending_create_chama';
      }
      if (path === 'join') {
        return 'verified_pending_join_chama';
      }
      return 'verified_choose_chama_path';
    case 'authenticated_chama_admin':
      return 'onboarding_complete_chama_admin';
    case 'authenticated_member':
    case 'authenticated_treasurer':
    case 'authenticated_secretary':
    case 'authenticated_auditor':
    case 'authenticated_admin':
    case 'authenticated_superadmin':
      if (activeChamaId && isAdminCompletionRole(activeRole)) {
        return 'onboarding_complete_chama_admin';
      }
      return 'onboarding_complete_member';
    case 'bootstrapping':
    case 'session_expired':
    case 'unauthenticated':
    default:
      return 'unauthenticated';
  }
}

const timestamp = () => new Date().toISOString();

const withTimestamp = <T extends Partial<OnboardingState>>(partial: T) => ({
  ...partial,
  lastUpdated: timestamp(),
});

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      step: 'unauthenticated',
      path: null,
      phoneNumber: null,
      isPhoneVerified: false,
      isProfileComplete: false,
      activeChamaId: null,
      activeChamaName: null,
      activeRole: null,
      onboardingCompleted: false,
      createChamaProgress: INITIAL_CREATE_PROGRESS,
      joinChamaProgress: INITIAL_JOIN_PROGRESS,
      lastUpdated: timestamp(),

      markWelcomeSeen: () =>
        set((state) =>
          withTimestamp({
            step: state.step === 'unauthenticated' ? 'welcome_seen' : state.step,
          })
        ),

      markVerificationRequired: (phoneNumber) =>
        set(
          withTimestamp({
            step: 'registered_unverified' as OnboardingStep,
            phoneNumber: phoneNumber ?? null,
            isPhoneVerified: false,
            onboardingCompleted: false,
          })
        ),

      markPhoneVerified: () =>
        set((state) => {
          const nextStep: OnboardingStep = state.isProfileComplete
            ? state.path === 'create'
              ? 'verified_pending_create_chama'
              : state.path === 'join'
              ? 'verified_pending_join_chama'
              : 'verified_choose_chama_path'
            : 'verified_profile_incomplete';

          return withTimestamp({
            step: nextStep,
            isPhoneVerified: true,
          });
        }),

      markProfileComplete: () =>
        set((state) => {
          const nextStep: OnboardingStep = state.path === 'create'
            ? 'verified_pending_create_chama'
            : state.path === 'join'
            ? 'verified_pending_join_chama'
            : 'verified_choose_chama_path';

          return withTimestamp({
            step: nextStep,
            isProfileComplete: true,
          });
        }),

      selectPath: (path) =>
        set((state) => {
          const nextStep: OnboardingStep =
            path === 'create'
              ? 'verified_pending_create_chama'
              : state.joinChamaProgress.inviteCode || state.joinChamaProgress.inviteToken
              ? 'pending_invite_acceptance'
              : 'verified_pending_join_chama';

          return withTimestamp({
            path,
            step: nextStep,
          });
        }),

      setStep: (step) => set(withTimestamp({ step })),

      setCreateChamaProgress: (progress) =>
        set((state) =>
          withTimestamp({
            path: 'create' as OnboardingPath,
            step: 'verified_pending_create_chama' as OnboardingStep,
            createChamaProgress: {
              ...state.createChamaProgress,
              ...progress,
            },
            joinChamaProgress:
              state.path === 'create' ? state.joinChamaProgress : INITIAL_JOIN_PROGRESS,
          })
        ),

      clearCreateChamaProgress: () =>
        set(withTimestamp({ createChamaProgress: INITIAL_CREATE_PROGRESS })),

      setJoinChamaProgress: (progress) =>
        set((state) => {
          const nextJoinProgress = {
            ...state.joinChamaProgress,
            ...progress,
          };
          const hasPendingInvite = !!(nextJoinProgress.inviteCode || nextJoinProgress.inviteToken);
          const nextStep: OnboardingStep = hasPendingInvite
            ? 'pending_invite_acceptance'
            : 'verified_pending_join_chama';
          return withTimestamp({
            path: 'join' as OnboardingPath,
            step: nextStep,
            joinChamaProgress: nextJoinProgress,
          });
        }),

      clearJoinChamaProgress: () =>
        set(withTimestamp({ joinChamaProgress: INITIAL_JOIN_PROGRESS })),

      markPendingInviteAcceptance: (progress) =>
        set((state) =>
          withTimestamp({
            path: 'join' as OnboardingPath,
            step: 'pending_invite_acceptance' as OnboardingStep,
            joinChamaProgress: {
              ...state.joinChamaProgress,
              ...progress,
            },
          })
        ),

      completeChamaCreation: (chamaId, chamaName, role) =>
        set((state) =>
          withTimestamp({
            step: 'onboarding_complete_chama_admin' as OnboardingStep,
            path: 'create' as OnboardingPath,
            isPhoneVerified: true,
            isProfileComplete: true,
            activeChamaId: chamaId,
            activeChamaName: chamaName || state.activeChamaName,
            activeRole: role || Role.CHAMA_ADMIN,
            onboardingCompleted: true,
            createChamaProgress: INITIAL_CREATE_PROGRESS,
            joinChamaProgress: INITIAL_JOIN_PROGRESS,
          })
        ),

      completeJoin: (chamaId, chamaName, role) =>
        set(
          withTimestamp({
            step: 'onboarding_complete_member' as OnboardingStep,
            path: 'join' as OnboardingPath,
            isPhoneVerified: true,
            isProfileComplete: true,
            activeChamaId: chamaId,
            activeChamaName: chamaName || null,
            activeRole: role || Role.MEMBER,
            onboardingCompleted: true,
            createChamaProgress: INITIAL_CREATE_PROGRESS,
            joinChamaProgress: INITIAL_JOIN_PROGRESS,
          })
        ),

      syncResolvedState: (input) =>
        set((state) => {
          const nextPath = input.path ?? state.path;
          const nextStep = deriveOnboardingStepFromState({
            ...input,
            path: nextPath,
            activeRole: input.activeRole ?? state.activeRole,
            activeChamaId: input.activeChamaId ?? state.activeChamaId,
          });

          return withTimestamp({
            step: nextStep,
            path: nextPath,
            phoneNumber: input.phoneNumber ?? state.phoneNumber,
            isPhoneVerified: input.isPhoneVerified ?? state.isPhoneVerified,
            isProfileComplete: input.isProfileComplete ?? state.isProfileComplete,
            activeChamaId: input.activeChamaId ?? state.activeChamaId,
            activeChamaName: input.activeChamaName ?? state.activeChamaName,
            activeRole: input.activeRole ?? state.activeRole,
            onboardingCompleted:
              nextStep === 'onboarding_complete_chama_admin' ||
              nextStep === 'onboarding_complete_member',
          });
        }),

      reset: () =>
        set({
          step: 'unauthenticated',
          path: null,
          phoneNumber: null,
          isPhoneVerified: false,
          isProfileComplete: false,
          activeChamaId: null,
          activeChamaName: null,
          activeRole: null,
          onboardingCompleted: false,
          createChamaProgress: INITIAL_CREATE_PROGRESS,
          joinChamaProgress: INITIAL_JOIN_PROGRESS,
          lastUpdated: timestamp(),
        }),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        step: state.step,
        path: state.path,
        phoneNumber: state.phoneNumber,
        isPhoneVerified: state.isPhoneVerified,
        isProfileComplete: state.isProfileComplete,
        activeChamaId: state.activeChamaId,
        activeChamaName: state.activeChamaName,
        activeRole: state.activeRole,
        onboardingCompleted: state.onboardingCompleted,
        createChamaProgress: state.createChamaProgress,
        joinChamaProgress: state.joinChamaProgress,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);
