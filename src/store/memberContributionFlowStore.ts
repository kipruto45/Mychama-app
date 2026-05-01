import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';

interface ContributionDraftState {
  chamaId?: string | null;
  mode?: 'contribution' | 'penalty';
  contributionTypeId?: string | null;
  contributionTypeName?: string | null;
  amount?: string;
  dueDate?: string | null;
  cycleLabel?: string | null;
  penaltyId?: string | null;
  paymentMethod?: 'mpesa' | null;
  phone?: string;
}

interface ActiveContributionPaymentState {
  intentId: string;
  chamaId: string;
  amount: string;
  currency: string;
  contributionTypeName: string;
  paymentMethod: 'mpesa';
  status: string;
  purpose: 'contribution' | 'fine';
  createdAt: string;
}

interface MemberContributionFlowState {
  lastVisitedRoute: string | null;
  draft: ContributionDraftState | null;
  activePayment: ActiveContributionPaymentState | null;
  setLastVisitedRoute: (route: string | null) => void;
  setDraft: (draft: ContributionDraftState | null) => void;
  patchDraft: (draft: Partial<ContributionDraftState>) => void;
  clearDraft: () => void;
  setActivePayment: (payment: ActiveContributionPaymentState | null) => void;
  updateActivePayment: (updates: Partial<ActiveContributionPaymentState>) => void;
  clearActivePayment: () => void;
}

export const useMemberContributionFlowStore = create<MemberContributionFlowState>()(
  persist(
    (set) => ({
      lastVisitedRoute: null,
      draft: null,
      activePayment: null,
      setLastVisitedRoute: (lastVisitedRoute) => set({ lastVisitedRoute }),
      setDraft: (draft) => set({ draft }),
      patchDraft: (draft) =>
        set((state) => ({
          draft: {
            ...(state.draft || {}),
            ...draft,
          },
        })),
      clearDraft: () => set({ draft: null }),
      setActivePayment: (activePayment) => set({ activePayment }),
      updateActivePayment: (updates) =>
        set((state) => ({
          activePayment: state.activePayment ? { ...state.activePayment, ...updates } : null,
        })),
      clearActivePayment: () => set({ activePayment: null }),
    }),
    {
      name: 'member-contribution-flow-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        lastVisitedRoute: state.lastVisitedRoute,
        draft: state.draft,
        activePayment: state.activePayment,
      }),
    }
  )
);
