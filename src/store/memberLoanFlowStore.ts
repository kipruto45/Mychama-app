import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { MemberPaymentMethodType } from '@/services/memberPaymentsService';
import { zustandStorage } from '@/utils/storage';

interface LoanDraftState {
  chamaId?: string | null;
  loanProductId?: string | null;
  loanProductName?: string | null;
  amount?: string;
  purpose?: string;
  durationMonths?: number | null;
  note?: string;
  maxEligibleAmount?: string;
  eligibilityState?: string;
}

interface ActiveLoanApplicationState {
  applicationId: string;
  chamaId: string;
  amount: string;
  status: string;
  reference: string;
  submittedAt: string;
  createdLoanId?: string | null;
}

interface LoanRepaymentDraftState {
  chamaId?: string | null;
  loanId?: string | null;
  installmentId?: string | null;
  currency?: string | null;
  amount?: string;
  dueDate?: string | null;
  targetLabel?: string | null;
  quickAmountOption?: 'next_due' | 'full_outstanding' | 'custom' | null;
  paymentMethod?: MemberPaymentMethodType | null;
  outstandingBalance?: string | null;
  nextDueAmount?: string | null;
  minimumDueAmount?: string | null;
  resultingBalanceEstimate?: string | null;
  pendingReference?: string | null;
  sourceEntryPoint?: string | null;
}

interface MemberLoanFlowState {
  lastVisitedRoute: string | null;
  draft: LoanDraftState | null;
  activeApplication: ActiveLoanApplicationState | null;
  activeLoanId: string | null;
  repaymentDraft: LoanRepaymentDraftState | null;
  pendingRepaymentIntentId: string | null;
  setLastVisitedRoute: (route: string | null) => void;
  setDraft: (draft: LoanDraftState | null) => void;
  patchDraft: (draft: Partial<LoanDraftState>) => void;
  clearDraft: () => void;
  setActiveApplication: (application: ActiveLoanApplicationState | null) => void;
  updateActiveApplication: (updates: Partial<ActiveLoanApplicationState>) => void;
  clearActiveApplication: () => void;
  setActiveLoanId: (loanId: string | null) => void;
  setRepaymentDraft: (draft: LoanRepaymentDraftState | null) => void;
  patchRepaymentDraft: (draft: Partial<LoanRepaymentDraftState>) => void;
  clearRepaymentDraft: () => void;
  setPendingRepaymentIntentId: (intentId: string | null) => void;
}

export const useMemberLoanFlowStore = create<MemberLoanFlowState>()(
  persist(
    (set) => ({
      lastVisitedRoute: null,
      draft: null,
      activeApplication: null,
      activeLoanId: null,
      repaymentDraft: null,
      pendingRepaymentIntentId: null,
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
      setActiveApplication: (activeApplication) => set({ activeApplication }),
      updateActiveApplication: (updates) =>
        set((state) => ({
          activeApplication: state.activeApplication
            ? { ...state.activeApplication, ...updates }
            : null,
        })),
      clearActiveApplication: () => set({ activeApplication: null }),
      setActiveLoanId: (activeLoanId) => set({ activeLoanId }),
      setRepaymentDraft: (repaymentDraft) => set({ repaymentDraft }),
      patchRepaymentDraft: (draft) =>
        set((state) => ({
          repaymentDraft: {
            ...(state.repaymentDraft || {}),
            ...draft,
          },
        })),
      clearRepaymentDraft: () => set({ repaymentDraft: null }),
      setPendingRepaymentIntentId: (pendingRepaymentIntentId) => set({ pendingRepaymentIntentId }),
    }),
    {
      name: 'member-loan-flow-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        lastVisitedRoute: state.lastVisitedRoute,
        draft: state.draft,
        activeApplication: state.activeApplication,
        activeLoanId: state.activeLoanId,
        repaymentDraft: state.repaymentDraft,
        pendingRepaymentIntentId: state.pendingRepaymentIntentId,
      }),
    }
  )
);
