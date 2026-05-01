/**
 * Payout API Service
 *
 * Domain-specific service for payout operations.
 */

import { toApiError } from '@/api/errors';
import type { ApiResponse } from '@/api/response';

import { apiClient } from './api';

// Types
export interface PayoutListResponse {
  id: string;
  chama: string;
  chama_name: string;
  member: string;
  member_phone: string;
  member_name: string;
  amount: string;
  status: PayoutStatus;
  payout_method: PayoutMethod;
  rotation_position: number;
  eligibility_status: EligibilityStatus;
  created_at: string;
  payment_completed_at: string | null;
}

export interface PayoutDetailResponse {
  id: string;
  chama: string;
  chama_name?: string;
  member: {
    id: string;
    user: {
      phone: string;
      first_name: string;
      last_name: string;
    };
  };
  amount: string;
  currency: string;
  rotation_position: number;
  rotation_cycle: number;
  status: PayoutStatus;
  trigger_type: string;
  eligibility_status: EligibilityStatus;
  eligibility_issues: string[];
  eligibility_check: EligibilityCheckResponse | null;
  payout_method: PayoutMethod;
  is_on_hold: boolean;
  hold_reason: string;
  treasurer_reviewed_at: string | null;
  chairperson_approved_at: string | null;
  payment_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EligibilityCheckResponse {
  id: string;
  result: EligibilityStatus;
  member_phone: string;
  member_name: string;
  has_outstanding_penalties: boolean;
  penalty_amount: string;
  has_active_disputes: boolean;
  has_overdue_loans: boolean;
  overdue_loan_amount: string;
  member_is_active: boolean;
  wallet_has_funds: boolean;
  available_balance: string;
  checked_at: string;
}

export interface PayoutRotationResponse {
  id: string;
  chama_id: string;
  chama_name: string;
  current_position: number;
  rotation_cycle: number;
  members_in_rotation: string[];
  current_member_id: string | null;
  last_completed_payout: string | null;
  last_updated_at: string;
}

export type PayoutStatus =
  | 'triggered'
  | 'rotation_check'
  | 'eligibility_check'
  | 'ineligible'
  | 'awaiting_treasurer_review'
  | 'treasury_rejected'
  | 'awaiting_chair_approval'
  | 'chair_rejected'
  | 'approved'
  | 'processing'
  | 'success'
  | 'failed'
  | 'hold'
  | 'cancelled';

export type PayoutMethod = 'bank_transfer' | 'mpesa' | 'wallet';

export type EligibilityStatus =
  | 'eligible'
  | 'pending_penalties'
  | 'active_disputes'
  | 'overdue_loans'
  | 'inactive_member'
  | 'insufficient_funds'
  | 'multiple_issues';

// API Service
export const payoutService = {
  _unwrapData<T>(payload: unknown): T {
    if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
      return (payload as ApiResponse<T>).data as T;
    }
    return payload as T;
  },

  /**
   * List payouts for current user
   */
  async listPayouts(
    chamaId?: string,
    filters?: {
      status?: PayoutStatus;
      page?: number;
      limit?: number;
    }
  ): Promise<{ results: PayoutListResponse[]; count: number }> {
    try {
      const params = new URLSearchParams();
      if (chamaId) params.append('chama_id', chamaId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const payload = await apiClient.get<unknown>(
        `/v1/payouts/payouts/?${params.toString()}`
      );
      const results = payoutService._unwrapData<PayoutListResponse[]>(payload) || [];

      return {
        results: Array.isArray(results) ? results : [],
        count: Array.isArray(results) ? results.length : 0,
      };
    } catch (error) {
      throw toApiError(error);
    }
  },

  /**
   * Get payout details
   */
  async getPayoutDetail(payoutId: string): Promise<PayoutDetailResponse> {
    try {
      const payload = await apiClient.get<unknown>(`/v1/payouts/payouts/${payoutId}/`);
      return payoutService._unwrapData<PayoutDetailResponse>(payload);
    } catch (error) {
      throw toApiError(error);
    }
  },

  /**
   * Trigger new payout
   */
  async triggerPayout(data: {
    chama_id: string;
    member_id?: string;
    amount?: number;
    trigger_type?: 'manual' | 'auto';
  }): Promise<PayoutDetailResponse> {
    try {
      const payload = await apiClient.post<unknown>('/v1/payouts/payouts/trigger_payout/', data);
      return payoutService._unwrapData<PayoutDetailResponse>(payload);
    } catch (error) {
      throw toApiError(error);
    }
  },

  /**
   * Send payout to treasurer review
   */
  async sendToTreasurerReview(payoutId: string): Promise<PayoutDetailResponse> {
    try {
      const payload = await apiClient.post<unknown>(`/v1/payouts/payouts/${payoutId}/send_to_review/`, {});
      return payoutService._unwrapData<PayoutDetailResponse>(payload);
    } catch (error) {
      throw toApiError(error);
    }
  },

  /**
   * Treasurer approves payout
   */
  async treasurerApprove(payoutId: string): Promise<PayoutDetailResponse> {
    try {
      const payload = await apiClient.post<unknown>(`/v1/payouts/payouts/${payoutId}/treasurer_approve/`, {});
      return payoutService._unwrapData<PayoutDetailResponse>(payload);
    } catch (error) {
      throw toApiError(error);
    }
  },

  /**
   * Treasurer rejects payout
   */
  async treasurerReject(
    payoutId: string,
    rejectionReason: string
  ): Promise<PayoutDetailResponse> {
    try {
      const payload = await apiClient.post<unknown>(
        `/v1/payouts/payouts/${payoutId}/treasurer_reject/`,
        { rejection_reason: rejectionReason }
      );
      return payoutService._unwrapData<PayoutDetailResponse>(payload);
    } catch (error) {
      throw toApiError(error);
    }
  },

  /**
   * Chairperson approves payout
   */
  async chairpersonApprove(payoutId: string): Promise<PayoutDetailResponse> {
    try {
      const payload = await apiClient.post<unknown>(`/v1/payouts/payouts/${payoutId}/chairperson_approve/`, {});
      return payoutService._unwrapData<PayoutDetailResponse>(payload);
    } catch (error) {
      throw toApiError(error);
    }
  },

  /**
   * Chairperson rejects payout
   */
  async chairpersonReject(
    payoutId: string,
    rejectionReason: string
  ): Promise<PayoutDetailResponse> {
    try {
      const payload = await apiClient.post<unknown>(
        `/v1/payouts/payouts/${payoutId}/chairperson_reject/`,
        { rejection_reason: rejectionReason }
      );
      return payoutService._unwrapData<PayoutDetailResponse>(payload);
    } catch (error) {
      throw toApiError(error);
    }
  },

  /**
   * Set payout method
   */
  async setPayoutMethod(
    payoutId: string,
    method: PayoutMethod
  ): Promise<PayoutDetailResponse> {
    try {
      const payload = await apiClient.post<unknown>(
        `/v1/payouts/payouts/${payoutId}/set_payout_method/`,
        { payout_method: method }
      );
      return payoutService._unwrapData<PayoutDetailResponse>(payload);
    } catch (error) {
      throw toApiError(error);
    }
  },

  /**
   * Flag payout on hold
   */
  async flagOnHold(
    payoutId: string,
    reason: string
  ): Promise<PayoutDetailResponse> {
    try {
      const payload = await apiClient.post<unknown>(
        `/v1/payouts/payouts/${payoutId}/flag_hold/`,
        { reason }
      );
      return payoutService._unwrapData<PayoutDetailResponse>(payload);
    } catch (error) {
      throw toApiError(error);
    }
  },

  /**
   * Release payout from hold
   */
  async releaseFromHold(
    payoutId: string,
    notes?: string
  ): Promise<PayoutDetailResponse> {
    try {
      const payload = await apiClient.post<unknown>(
        `/v1/payouts/payouts/${payoutId}/release_hold/`,
        { notes: notes || '' }
      );
      return payoutService._unwrapData<PayoutDetailResponse>(payload);
    } catch (error) {
      throw toApiError(error);
    }
  },

  /**
   * Retry failed payout payment
   */
  async retryPayment(payoutId: string): Promise<PayoutDetailResponse> {
    try {
      const payload = await apiClient.post<unknown>(`/v1/payouts/payouts/${payoutId}/retry_payment/`, {});
      return payoutService._unwrapData<PayoutDetailResponse>(payload);
    } catch (error) {
      throw toApiError(error);
    }
  },

  /**
   * Get rotation for chama
   */
  async getRotation(chamaId: string): Promise<PayoutRotationResponse> {
    try {
      const payload = await apiClient.get<unknown>(`/v1/payouts/rotations/${chamaId}/`);
      return payoutService._unwrapData<PayoutRotationResponse>(payload);
    } catch (error) {
      throw toApiError(error);
    }
  },
};
