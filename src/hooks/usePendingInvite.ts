import { useCallback, useEffect, useState } from 'react';

import {
  clearPendingInviteIntent,
  getPendingInviteIntent,
  type PendingInviteContext,
  savePendingInviteIntent,
} from '@/utils/inviteFlow';

export function usePendingInvite() {
  const [pendingInvite, setPendingInvite] = useState<PendingInviteContext | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const invite = await getPendingInviteIntent();
      setPendingInvite(invite);
      return invite;
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (intent: PendingInviteContext) => {
    await savePendingInviteIntent(intent);
    const latest = await getPendingInviteIntent();
    setPendingInvite(latest);
    return latest;
  }, []);

  const clear = useCallback(async () => {
    await clearPendingInviteIntent();
    setPendingInvite(null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    pendingInvite,
    loading,
    refresh,
    save,
    clear,
  };
}
