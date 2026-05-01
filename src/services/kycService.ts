import { apiClient } from './api';
import type { KYCRecord, User } from '@/types';

export type OnboardingPath = 'create_chama' | 'join_chama' | 'request_to_join' | 'existing_member_update';
export type DocumentType = 'national_id' | 'passport' | 'alien_id' | 'military_id';

export interface KYCResponse<TData extends Record<string, any> = Record<string, any>> {
  success: boolean;
  code: string;
  message: string;
  errors: Record<string, any>;
  data: TData;
}

export interface KYCStatusPayload {
  record: KYCRecord | null;
  access: Pick<
    User,
    'otp_verified' | 'tier_access' | 'kyc_status' | 'financial_access_enabled' | 'account_frozen' | 'account_locked_until'
  >;
}

export const kycService = {
  async getStatus(): Promise<KYCResponse<KYCStatusPayload>> {
    return apiClient.get<KYCResponse<KYCStatusPayload>>('/v1/kyc/status/');
  },

  async startSession(payload: { onboarding_path: OnboardingPath; chama_id?: string | null }) {
    return apiClient.post<KYCResponse<{ record: KYCRecord; access?: any }>>('/v1/kyc/start/', payload);
  },

  async saveDetails(payload: {
    kyc_id: string;
    legal_name: string;
    date_of_birth: string;
    gender: string;
    nationality: string;
    id_number: string;
    document_type: DocumentType;
    phone_number?: string;
  }) {
    return apiClient.post<KYCResponse<{ record: KYCRecord }>>('/v1/kyc/details/', payload);
  },

  async submitLocation(payload: {
    kyc_id: string;
    share_location: boolean;
    latitude?: number | null;
    longitude?: number | null;
    location_label?: string;
  }) {
    if (__DEV__) {
      const safe = {
        kyc_id: String(payload.kyc_id || ''),
        share_location: Boolean(payload.share_location),
        has_latitude: typeof payload.latitude === 'number',
        has_longitude: typeof payload.longitude === 'number',
        location_label_present: Boolean(String(payload.location_label || '').trim()),
      };
      // eslint-disable-next-line no-console
      console.log('[kyc] submitLocation payload', safe);
    }
    return apiClient.post<KYCResponse<{ kyc_id: string }>>('/v1/kyc/location/', payload);
  },

  async uploadDocument(payload: { kyc_id: string; document_role: 'id_front_image' | 'id_back_image' | 'proof_of_address_image'; file: { uri: string; type: string; name: string } }) {
    const formData = new FormData();
    formData.append('kyc_id', payload.kyc_id);
    formData.append('document_role', payload.document_role);
    formData.append('file', payload.file as any);
    return apiClient.post<KYCResponse<{ record: KYCRecord; quality?: any }>>('/v1/kyc/upload-document/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async uploadSelfie(payload: {
    kyc_id: string;
    file: { uri: string; type: string; name: string };
    blink_completed: boolean;
    head_turn_completed: boolean;
    smile_completed: boolean;
    captured_at?: string;
  }) {
    const formData = new FormData();
    formData.append('kyc_id', payload.kyc_id);
    formData.append('file', payload.file as any);
    formData.append('blink_completed', String(Boolean(payload.blink_completed)));
    formData.append('head_turn_completed', String(Boolean(payload.head_turn_completed)));
    formData.append('smile_completed', String(Boolean(payload.smile_completed)));
    if (payload.captured_at) {
      formData.append('captured_at', payload.captured_at);
    }
    return apiClient.post<KYCResponse<{ record: KYCRecord }>>('/v1/kyc/upload-selfie/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async submit(payload: { kyc_id: string }) {
    return apiClient.post<KYCResponse<{ record: KYCRecord }>>('/v1/kyc/submit/', payload);
  },

  async resubmit(payload: { kyc_id: string; correction_note?: string }) {
    return apiClient.post<KYCResponse<{ kyc_id: string }>>('/v1/kyc/resubmit/', payload);
  },
};
