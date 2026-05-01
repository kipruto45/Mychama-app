import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { WalletActivityFilterKey } from '@/services/memberWalletService';
import { zustandStorage } from '@/utils/storage';

interface MemberWalletFlowState {
  lastVisitedScreen: string | null;
  selectedFilter: WalletActivityFilterKey;
  lastOpenedTransactionId: string | null;
  pendingTransactionReference: string | null;
  pendingDepositIntentId: string | null;
  pendingWithdrawalIntentId: string | null;
  activeChamaId: string | null;
  lastEntryPoint: string | null;
  depositDraftAmount: string | null;
  depositDraftMethod: string | null;
  withdrawalDraftAmount: string | null;
  withdrawalDraftMethod: string | null;
  setLastVisitedScreen: (screen: string | null) => void;
  setSelectedFilter: (filter: WalletActivityFilterKey) => void;
  setLastOpenedTransactionId: (transactionId: string | null) => void;
  setPendingTransactionReference: (reference: string | null) => void;
  setPendingDepositIntentId: (intentId: string | null) => void;
  setPendingWithdrawalIntentId: (intentId: string | null) => void;
  setActiveChamaId: (chamaId: string | null) => void;
  setLastEntryPoint: (entryPoint: string | null) => void;
  setDepositDraft: (draft: { amount?: string | null; method?: string | null }) => void;
  setWithdrawalDraft: (draft: { amount?: string | null; method?: string | null }) => void;
  clearPendingTransactionReference: () => void;
  clearDepositDraft: () => void;
  clearWithdrawalDraft: () => void;
}

export const useMemberWalletFlowStore = create<MemberWalletFlowState>()(
  persist(
    (set) => ({
      lastVisitedScreen: null,
      selectedFilter: 'all',
      lastOpenedTransactionId: null,
      pendingTransactionReference: null,
      pendingDepositIntentId: null,
      pendingWithdrawalIntentId: null,
      activeChamaId: null,
      lastEntryPoint: null,
      depositDraftAmount: null,
      depositDraftMethod: null,
      withdrawalDraftAmount: null,
      withdrawalDraftMethod: null,
      setLastVisitedScreen: (lastVisitedScreen) => set({ lastVisitedScreen }),
      setSelectedFilter: (selectedFilter) => set({ selectedFilter }),
      setLastOpenedTransactionId: (lastOpenedTransactionId) => set({ lastOpenedTransactionId }),
      setPendingTransactionReference: (pendingTransactionReference) =>
        set({ pendingTransactionReference }),
      setPendingDepositIntentId: (pendingDepositIntentId) => set({ pendingDepositIntentId }),
      setPendingWithdrawalIntentId: (pendingWithdrawalIntentId) =>
        set({ pendingWithdrawalIntentId }),
      setActiveChamaId: (activeChamaId) => set({ activeChamaId }),
      setLastEntryPoint: (lastEntryPoint) => set({ lastEntryPoint }),
      setDepositDraft: ({ amount, method }) =>
        set({
          depositDraftAmount: amount ?? null,
          depositDraftMethod: method ?? null,
        }),
      setWithdrawalDraft: ({ amount, method }) =>
        set({
          withdrawalDraftAmount: amount ?? null,
          withdrawalDraftMethod: method ?? null,
        }),
      clearPendingTransactionReference: () => set({ pendingTransactionReference: null }),
      clearDepositDraft: () =>
        set({
          depositDraftAmount: null,
          depositDraftMethod: null,
        }),
      clearWithdrawalDraft: () =>
        set({
          withdrawalDraftAmount: null,
          withdrawalDraftMethod: null,
        }),
    }),
    {
      name: 'member-wallet-flow-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        lastVisitedScreen: state.lastVisitedScreen,
        selectedFilter: state.selectedFilter,
        lastOpenedTransactionId: state.lastOpenedTransactionId,
        pendingTransactionReference: state.pendingTransactionReference,
        pendingDepositIntentId: state.pendingDepositIntentId,
        pendingWithdrawalIntentId: state.pendingWithdrawalIntentId,
        activeChamaId: state.activeChamaId,
        lastEntryPoint: state.lastEntryPoint,
        depositDraftAmount: state.depositDraftAmount,
        depositDraftMethod: state.depositDraftMethod,
        withdrawalDraftAmount: state.withdrawalDraftAmount,
        withdrawalDraftMethod: state.withdrawalDraftMethod,
      }),
    }
  )
);
