/**
 * Payout Store (Zustand)
 *
 * Global state management for the payout workflow:
 * - list + detail
 * - treasurer/chairperson actions
 * - payout method updates and hold/retry actions
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  payoutService,
  type EligibilityStatus,
  type PayoutDetailResponse,
  type PayoutListResponse,
  type PayoutMethod,
  type PayoutStatus,
} from '@/services/payoutService';

type PayoutTab = 'pending' | 'completed' | 'rejected';

interface PayoutFormState {
  chamaId: string;
  memberId?: string;
  amount?: number;
  triggerType: 'manual' | 'auto';
  payoutMethod: PayoutMethod;
  rejectionReason?: string;
  holdReason?: string;
}

interface PayoutStoreState {
  payouts: PayoutListResponse[];
  isLoadingPayouts: boolean;
  payoutsError: string | null;

  currentPayout: PayoutDetailResponse | null;
  isLoadingDetail: boolean;
  detailError: string | null;

  form: PayoutFormState;
  isSubmitting: boolean;
  formError: string | null;

  selectedChamaId: string | null;
  activeTab: PayoutTab;

  fetchPayouts: (
    chamaId?: string,
    filters?: { status?: PayoutStatus; page?: number; limit?: number }
  ) => Promise<void>;
  fetchPayoutDetail: (payoutId: string) => Promise<void>;

  triggerPayout: (data: {
    chama_id: string;
    member_id?: string;
    amount?: number;
    trigger_type?: 'manual' | 'auto';
  }) => Promise<PayoutDetailResponse>;

  sendToTreasurerReview: (payoutId: string) => Promise<void>;
  treasurerApprove: (payoutId: string) => Promise<void>;
  treasurerReject: (payoutId: string, reason: string) => Promise<void>;
  chairpersonApprove: (payoutId: string) => Promise<void>;
  chairpersonReject: (payoutId: string, reason: string) => Promise<void>;
  setPayoutMethod: (payoutId: string, method: PayoutMethod) => Promise<void>;
  flagOnHold: (payoutId: string, reason: string) => Promise<void>;
  releaseFromHold: (payoutId: string) => Promise<void>;
  retryPayment: (payoutId: string) => Promise<void>;

  updateForm: (updates: Partial<PayoutFormState>) => void;
  resetForm: () => void;
  setSelectedChamaId: (chamaId: string | null) => void;
  setActiveTab: (tab: PayoutTab) => void;
  clearErrors: () => void;
}

const initialFormState: PayoutFormState = {
  chamaId: '',
  triggerType: 'manual',
  payoutMethod: 'mpesa',
};

const memberNameFromDetail = (detail: PayoutDetailResponse): string => {
  const first = detail.member?.user?.first_name || '';
  const last = detail.member?.user?.last_name || '';
  const combined = [first, last].join(' ').trim();
  return combined || detail.member?.user?.phone || 'Member';
};

const detailToListItem = (detail: PayoutDetailResponse, existing?: PayoutListResponse): PayoutListResponse => {
  return {
    id: detail.id,
    chama: detail.chama,
    chama_name: detail.chama_name ?? existing?.chama_name ?? '',
    member: detail.member?.id || existing?.member || '',
    member_phone: detail.member?.user?.phone || existing?.member_phone || '',
    member_name: memberNameFromDetail(detail),
    amount: detail.amount,
    status: detail.status,
    payout_method: detail.payout_method,
    rotation_position: detail.rotation_position,
    eligibility_status: detail.eligibility_status as EligibilityStatus,
    created_at: detail.created_at,
    payment_completed_at: detail.payment_completed_at ?? existing?.payment_completed_at ?? null,
  };
};

const upsertPayoutListItem = (items: PayoutListResponse[], item: PayoutListResponse): PayoutListResponse[] => {
  const index = items.findIndex((p) => p.id === item.id);
  if (index === -1) return [item, ...items];
  const next = items.slice();
  next[index] = { ...next[index], ...item };
  return next;
};

export const usePayoutStore = create<PayoutStoreState>()(
  persist(
    (set, get) => ({
      payouts: [],
      isLoadingPayouts: false,
      payoutsError: null,

      currentPayout: null,
      isLoadingDetail: false,
      detailError: null,

      form: initialFormState,
      isSubmitting: false,
      formError: null,

      selectedChamaId: null,
      activeTab: 'pending',

      async fetchPayouts(chamaId, filters) {
        set({ isLoadingPayouts: true, payoutsError: null });
        try {
          const results = await payoutService.listPayouts(chamaId, filters);
          set({ payouts: results.results });
        } catch (error: any) {
          set({ payoutsError: error?.message || 'Failed to fetch payouts' });
        } finally {
          set({ isLoadingPayouts: false });
        }
      },

      async fetchPayoutDetail(payoutId) {
        set({ isLoadingDetail: true, detailError: null });
        try {
          const payout = await payoutService.getPayoutDetail(payoutId);
          set((state) => {
            const existing = state.payouts.find((p) => p.id === payout.id);
            const listItem = detailToListItem(payout, existing);
            return {
              currentPayout: payout,
              payouts: upsertPayoutListItem(state.payouts, listItem),
            };
          });
        } catch (error: any) {
          set({ detailError: error?.message || 'Failed to fetch payout details' });
        } finally {
          set({ isLoadingDetail: false });
        }
      },

      async triggerPayout(data) {
        set({ isSubmitting: true, formError: null });
        try {
          const payout = await payoutService.triggerPayout(data);
          set((state) => {
            const existing = state.payouts.find((p) => p.id === payout.id);
            const listItem = detailToListItem(payout, existing);
            return { currentPayout: payout, payouts: upsertPayoutListItem(state.payouts, listItem) };
          });
          return payout;
        } catch (error: any) {
          set({ formError: error?.message || 'Failed to trigger payout' });
          throw error;
        } finally {
          set({ isSubmitting: false });
        }
      },

      async sendToTreasurerReview(payoutId) {
        set({ isSubmitting: true, formError: null });
        try {
          const payout = await payoutService.sendToTreasurerReview(payoutId);
          set((state) => {
            const existing = state.payouts.find((p) => p.id === payout.id);
            const listItem = detailToListItem(payout, existing);
            return { currentPayout: payout, payouts: upsertPayoutListItem(state.payouts, listItem) };
          });
        } catch (error: any) {
          set({ formError: error?.message || 'Failed to send for review' });
          throw error;
        } finally {
          set({ isSubmitting: false });
        }
      },

      async treasurerApprove(payoutId) {
        set({ isSubmitting: true, formError: null });
        try {
          const payout = await payoutService.treasurerApprove(payoutId);
          set((state) => {
            const existing = state.payouts.find((p) => p.id === payout.id);
            const listItem = detailToListItem(payout, existing);
            return { currentPayout: payout, payouts: upsertPayoutListItem(state.payouts, listItem) };
          });
        } catch (error: any) {
          set({ formError: error?.message || 'Failed to approve payout' });
          throw error;
        } finally {
          set({ isSubmitting: false });
        }
      },

      async treasurerReject(payoutId, reason) {
        set({ isSubmitting: true, formError: null });
        try {
          const payout = await payoutService.treasurerReject(payoutId, reason);
          set((state) => {
            const existing = state.payouts.find((p) => p.id === payout.id);
            const listItem = detailToListItem(payout, existing);
            return { currentPayout: payout, payouts: upsertPayoutListItem(state.payouts, listItem) };
          });
        } catch (error: any) {
          set({ formError: error?.message || 'Failed to reject payout' });
          throw error;
        } finally {
          set({ isSubmitting: false });
        }
      },

      async chairpersonApprove(payoutId) {
        set({ isSubmitting: true, formError: null });
        try {
          const payout = await payoutService.chairpersonApprove(payoutId);
          set((state) => {
            const existing = state.payouts.find((p) => p.id === payout.id);
            const listItem = detailToListItem(payout, existing);
            return { currentPayout: payout, payouts: upsertPayoutListItem(state.payouts, listItem) };
          });
        } catch (error: any) {
          set({ formError: error?.message || 'Failed to approve payout' });
          throw error;
        } finally {
          set({ isSubmitting: false });
        }
      },

      async chairpersonReject(payoutId, reason) {
        set({ isSubmitting: true, formError: null });
        try {
          const payout = await payoutService.chairpersonReject(payoutId, reason);
          set((state) => {
            const existing = state.payouts.find((p) => p.id === payout.id);
            const listItem = detailToListItem(payout, existing);
            return { currentPayout: payout, payouts: upsertPayoutListItem(state.payouts, listItem) };
          });
        } catch (error: any) {
          set({ formError: error?.message || 'Failed to reject payout' });
          throw error;
        } finally {
          set({ isSubmitting: false });
        }
      },

      async setPayoutMethod(payoutId, method) {
        set({ isSubmitting: true, formError: null });
        try {
          const payout = await payoutService.setPayoutMethod(payoutId, method);
          set((state) => {
            const existing = state.payouts.find((p) => p.id === payout.id);
            const listItem = detailToListItem(payout, existing);
            return { currentPayout: payout, payouts: upsertPayoutListItem(state.payouts, listItem) };
          });
        } catch (error: any) {
          set({ formError: error?.message || 'Failed to set payout method' });
          throw error;
        } finally {
          set({ isSubmitting: false });
        }
      },

      async flagOnHold(payoutId, reason) {
        set({ isSubmitting: true, formError: null });
        try {
          const payout = await payoutService.flagOnHold(payoutId, reason);
          set((state) => {
            const existing = state.payouts.find((p) => p.id === payout.id);
            const listItem = detailToListItem(payout, existing);
            return { currentPayout: payout, payouts: upsertPayoutListItem(state.payouts, listItem) };
          });
        } catch (error: any) {
          set({ formError: error?.message || 'Failed to flag payout' });
          throw error;
        } finally {
          set({ isSubmitting: false });
        }
      },

      async releaseFromHold(payoutId) {
        set({ isSubmitting: true, formError: null });
        try {
          const payout = await payoutService.releaseFromHold(payoutId);
          set((state) => {
            const existing = state.payouts.find((p) => p.id === payout.id);
            const listItem = detailToListItem(payout, existing);
            return { currentPayout: payout, payouts: upsertPayoutListItem(state.payouts, listItem) };
          });
        } catch (error: any) {
          set({ formError: error?.message || 'Failed to release payout' });
          throw error;
        } finally {
          set({ isSubmitting: false });
        }
      },

      async retryPayment(payoutId) {
        set({ isSubmitting: true, formError: null });
        try {
          const payout = await payoutService.retryPayment(payoutId);
          set((state) => {
            const existing = state.payouts.find((p) => p.id === payout.id);
            const listItem = detailToListItem(payout, existing);
            return { currentPayout: payout, payouts: upsertPayoutListItem(state.payouts, listItem) };
          });
        } catch (error: any) {
          set({ formError: error?.message || 'Failed to retry payment' });
          throw error;
        } finally {
          set({ isSubmitting: false });
        }
      },

      updateForm(updates) {
        set((state) => ({ form: { ...state.form, ...updates } }));
      },

      resetForm() {
        set({ form: initialFormState, formError: null });
      },

      setSelectedChamaId(chamaId) {
        set({ selectedChamaId: chamaId });
      },

      setActiveTab(tab) {
        set({ activeTab: tab });
      },

      clearErrors() {
        set({ formError: null, payoutsError: null, detailError: null });
      },
    }),
    {
      name: 'payout-store',
      partialize: (state) => ({
        form: state.form,
        selectedChamaId: state.selectedChamaId,
        activeTab: state.activeTab,
      }),
    }
  )
);

