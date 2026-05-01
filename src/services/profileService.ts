import { apiClient } from './api';
import { KYCRecord, User } from '@/types';

/**
 * Image compression utilities for KYC and profile uploads
 * For production, consider using expo-image-manipulator to resize large images before upload:
 * import * as ImageManipulator from 'expo-image-manipulator';
 *
 * Example compression:
 * const manipulated = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 800 } }], { compress: 0.8 });
 */

export const profileService = {
  async getProfile(): Promise<User> {
    return apiClient.get<User>('/v1/auth/me');
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    return apiClient.patch<User>('/v1/auth/me', data);
  },

  async uploadAvatar(uri: string): Promise<{ avatar: string }> {
    const formData = new FormData();
    formData.append('avatar', {
      uri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);

    return apiClient.patch('/v1/auth/me', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async changePassword(data: {
    old_password: string;
    new_password: string;
  }): Promise<void> {
    return apiClient.post('/v1/auth/change-password', data);
  },

  async requestPasswordReset(identifier: string): Promise<void> {
    return apiClient.post('/v1/auth/password-reset/request', { identifier });
  },

  async confirmPasswordReset(data: {
    token?: string;
    phone?: string;
    code?: string;
    new_password: string;
  }): Promise<void> {
    return apiClient.post('/v1/auth/password-reset/confirm', data);
  },

  async deleteAccount(): Promise<void> {
    return apiClient.delete('/v1/auth/me');
  },

  async requestTwoFactorCode(delivery_method: 'sms' | 'email'): Promise<{
    detail: string;
    expires_in_seconds: number;
    delivery: {
      channels: string[];
      phone?: string;
      email?: string;
    };
  }> {
    return apiClient.post('/v1/auth/otp/request', { delivery_method });
  },

  async verifyTwoFactorCode(code: string): Promise<{ detail: string; code: string }> {
    return apiClient.post('/v1/auth/otp/verify', { code });
  },

  async submitKYC(data: {
    chama_id?: string;
    onboarding_path?: 'create_chama' | 'join_chama' | 'request_to_join' | 'existing_member_update';
    document_type?: 'national_id' | 'passport' | 'alien_id' | 'military_id';
    id_number: string;
    legal_name?: string;
    date_of_birth?: string;
    gender?: string;
    nationality?: string;
    phone_number?: string;
    mpesa_registered_name?: string;
    location_label?: string;
    location_latitude?: number;
    location_longitude?: number;
    id_front_image?: { uri: string; type: string; name: string };
    id_back_image?: { uri: string; type: string; name: string };
    selfie_image?: { uri: string; type: string; name: string };
    proof_of_address_image?: { uri: string; type: string; name: string };
  }): Promise<any> {
    const started = await apiClient.post<{
      data?: { record?: KYCRecord };
    }>('/v1/kyc/start/', {
      onboarding_path: data.onboarding_path || (data.chama_id ? 'join_chama' : 'create_chama'),
      chama_id: data.chama_id,
    });

    const kycId = started?.data?.record?.id;
    if (!kycId) {
      throw new Error('Unable to start KYC session.');
    }

    await apiClient.post('/v1/kyc/details/', {
      kyc_id: kycId,
      legal_name: data.legal_name,
      date_of_birth: data.date_of_birth,
      gender: data.gender,
      nationality: data.nationality || 'Kenyan',
      id_number: data.id_number,
      document_type: data.document_type || 'national_id',
      phone_number: data.phone_number,
    });

    if (typeof data.location_latitude === 'number' && typeof data.location_longitude === 'number') {
      await apiClient.post('/v1/kyc/location/', {
        kyc_id: kycId,
        share_location: true,
        latitude: data.location_latitude,
        longitude: data.location_longitude,
        location_label: data.location_label,
      });
    }

    const uploadDocument = async (
      documentRole: 'id_front_image' | 'id_back_image' | 'proof_of_address_image',
      file?: { uri: string; type: string; name: string }
    ) => {
      if (!file) return;
      const formData = new FormData();
      formData.append('kyc_id', String(kycId));
      formData.append('document_role', documentRole);
      formData.append('file', file as any);
      await apiClient.post('/v1/kyc/upload-document/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    };

    await uploadDocument('id_front_image', data.id_front_image);
    await uploadDocument('id_back_image', data.id_back_image);
    await uploadDocument('proof_of_address_image', data.proof_of_address_image);

    if (data.selfie_image) {
      const selfieFormData = new FormData();
      selfieFormData.append('kyc_id', String(kycId));
      selfieFormData.append('file', data.selfie_image as any);
      selfieFormData.append('blink_completed', 'true');
      selfieFormData.append('head_turn_completed', 'true');
      selfieFormData.append('smile_completed', 'true');
      await apiClient.post('/v1/kyc/upload-selfie/', selfieFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }

    return apiClient.post('/v1/kyc/submit/', { kyc_id: kycId });
  },

  async getKYCStatus(): Promise<KYCRecord[]> {
    const response = await apiClient.get<unknown>('/v1/kyc/status/');
    const normalizeRecord = (record: Record<string, unknown>): KYCRecord => {
      const chamaValue = record.chama_id || record.chama;
      const chamaId =
        typeof chamaValue === 'string'
          ? chamaValue
          : chamaValue && typeof chamaValue === 'object' && 'id' in chamaValue
          ? String((chamaValue as { id?: unknown }).id || '')
          : undefined;
      const chamaName =
        typeof record.chama_name === 'string'
          ? record.chama_name
          : chamaValue && typeof chamaValue === 'object' && 'name' in chamaValue
          ? String((chamaValue as { name?: unknown }).name || '')
          : undefined;

      return {
        ...(record as KYCRecord),
        chama_id: chamaId || undefined,
        chama_name: chamaName || undefined,
      };
    };

    if (Array.isArray(response)) {
      return (response as Record<string, unknown>[]).map(normalizeRecord);
    }

    if (response && typeof response === 'object') {
      const data = response as Record<string, unknown>;
      if (data.data && typeof data.data === 'object') {
        const nested = data.data as Record<string, unknown>;
        if (nested.record && typeof nested.record === 'object') {
          return [normalizeRecord(nested.record as Record<string, unknown>)];
        }
      }
      if (Array.isArray(data.documents)) {
        return (data.documents as Record<string, unknown>[]).map(normalizeRecord);
      }
      if (Array.isArray(data.records)) {
        return (data.records as Record<string, unknown>[]).map(normalizeRecord);
      }
      if (Array.isArray(data.results)) {
        return (data.results as Record<string, unknown>[]).map(normalizeRecord);
      }
      return [normalizeRecord(data)];
    }

    return [];
  },
};
