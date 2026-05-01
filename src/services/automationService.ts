import { apiClient } from './api';
import { AutomationHub } from '@/types';

const buildQueryString = (params: Record<string, string | undefined>) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.append(key, value);
    }
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
};

export const automationService = {
  async getAutomationHub(chamaId?: string): Promise<AutomationHub> {
    return apiClient.get<AutomationHub>(
      `/v1/automations/hub/${buildQueryString({
        chama_id: chamaId,
      })}`
    );
  },
};
