import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  MemberPaymentMethodType,
  MemberPaymentPurposeType,
} from '@/services/memberPaymentsService';
import { zustandStorage } from '@/utils/storage';

interface MemberPaymentDraftState {
  chamaId?: string | null;
  paymentPurposeType?: MemberPaymentPurposeType | null;
  paymentPurposeLabel?: string | null;
  amount?: string;
  currency?: string;
  contributionId?: string | null;
  contributionTypeId?: string | null;
  contributionTypeName?: string | null;
  loanId?: string | null;
  installmentId?: string | null;
  penaltyId?: string | null;
  dueDate?: string | null;
  targetLabel?: string | null;
  paymentMethod?: MemberPaymentMethodType | null;
  phone?: string;
  sourceRoute?: string | null;
  feeAmount?: string | null;
  totalAmount?: string | null;
}

interface ActiveMemberPaymentState {
  intentId: string;
  chamaId: string;
  amount: string;
  currency: string;
  paymentPurposeType: MemberPaymentPurposeType;
  paymentPurposeLabel: string;
  paymentMethod: MemberPaymentMethodType | 'mpesa';
  status: string;
  reference?: string | null;
  contributionId?: string | null;
  loanId?: string | null;
  installmentId?: string | null;
  penaltyId?: string | null;
  targetLabel?: string | null;
  createdAt: string;
}

interface MemberPaymentsFlowState {
  lastVisitedRoute: string | null;
  lastOpenedPaymentId: string | null;
  draft: MemberPaymentDraftState | null;
  activePayment: ActiveMemberPaymentState | null;
  setLastVisitedRoute: (route: string | null) => void;
  setLastOpenedPaymentId: (paymentId: string | null) => void;
  setDraft: (draft: MemberPaymentDraftState | null) => void;
  patchDraft: (draft: Partial<MemberPaymentDraftState>) => void;
  clearDraft: () => void;
  setActivePayment: (payment: ActiveMemberPaymentState | null) => void;
  updateActivePayment: (updates: Partial<ActiveMemberPaymentState>) => void;
  clearActivePayment: () => void;
}

export const useMemberPaymentsFlowStore = create<MemberPaymentsFlowState>()(
  persist(
    (set) => ({
      lastVisitedRoute: null,
      lastOpenedPaymentId: null,
      draft: null,
      activePayment: null,
      setLastVisitedRoute: (lastVisitedRoute) => set({ lastVisitedRoute }),
      setLastOpenedPaymentId: (lastOpenedPaymentId) => set({ lastOpenedPaymentId }),
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
      name: 'member-payments-flow-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        lastVisitedRoute: state.lastVisitedRoute,
        lastOpenedPaymentId: state.lastOpenedPaymentId,
        draft: state.draft,
        activePayment: state.activePayment,
      }),
    }
  )
);
