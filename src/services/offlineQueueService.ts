import { profileService } from './profileService';
import { storage } from '@/utils/storage';

const OFFLINE_QUEUE_KEY = 'offline_safe_action_queue_v1';

export interface QueuedKYCAction {
  id: string;
  type: 'kyc_submission';
  created_at: string;
  status: 'queued' | 'failed';
  attempt_count: number;
  payload: {
    chama_id?: string;
    document_type?: 'national_id' | 'passport' | 'alien_id' | 'military_id';
    id_number: string;
    mpesa_registered_name?: string;
    location_latitude?: number;
    location_longitude?: number;
    id_front_image?: { uri: string; type: string; name: string };
    id_back_image?: { uri: string; type: string; name: string };
    selfie_image?: { uri: string; type: string; name: string };
    proof_of_address_image?: { uri: string; type: string; name: string };
  };
  last_error?: string | null;
}

type OfflineSafeAction = QueuedKYCAction;

const generateActionId = () => `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const readQueue = async (): Promise<OfflineSafeAction[]> =>
  (await storage.getJSON<OfflineSafeAction[]>(OFFLINE_QUEUE_KEY)) || [];

const writeQueue = async (actions: OfflineSafeAction[]) => {
  await storage.setJSON(OFFLINE_QUEUE_KEY, actions);
};

export const isLikelyOfflineError = (error: unknown) => {
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: string }).message || '').toLowerCase()
      : '';

  return (
    message.includes('network') ||
    message.includes('internet') ||
    message.includes('offline') ||
    message.includes('timed out') ||
    message.includes('socket') ||
    message.includes('fetch')
  );
};

export const offlineQueueService = {
  async listActions(): Promise<OfflineSafeAction[]> {
    return readQueue();
  },

  async queueKYCSubmission(payload: QueuedKYCAction['payload']): Promise<QueuedKYCAction> {
    const actions = await readQueue();
    const queuedAction: QueuedKYCAction = {
      id: generateActionId(),
      type: 'kyc_submission',
      created_at: new Date().toISOString(),
      status: 'queued',
      attempt_count: 0,
      payload,
      last_error: null,
    };

    await writeQueue([queuedAction, ...actions]);
    return queuedAction;
  },

  async removeAction(actionId: string): Promise<void> {
    const actions = await readQueue();
    await writeQueue(actions.filter((action) => action.id !== actionId));
  },

  async retryAction(actionId: string): Promise<void> {
    const actions = await readQueue();
    const action = actions.find((item) => item.id === actionId);

    if (!action) {
      throw new Error('Queued action not found.');
    }

    if (action.type === 'kyc_submission') {
      try {
        await profileService.submitKYC(action.payload);
        await writeQueue(actions.filter((item) => item.id !== actionId));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Retry failed.';

        const updatedActions = actions.map((item) =>
          item.id === actionId
            ? {
                ...item,
                status: 'failed' as const,
                attempt_count: item.attempt_count + 1,
                last_error: message,
              }
            : item
        );

        await writeQueue(updatedActions);
        throw error;
      }
    }
  },
};
