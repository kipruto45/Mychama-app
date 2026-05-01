import { useEffect, useState } from 'react';
import { useAuthzStore } from '@/auth/store';
import { authService } from '@/services/authService';
import { useChamas } from './useChamas';
import { Chama } from '@/types';

const formatRoleLabel = (role: string) =>
  role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const useActiveChama = () => {
  const { data: chamas = [], isLoading, refetch } = useChamas();
  const memberships = useAuthzStore((state) => state.memberships);
  const activeChamaId = useAuthzStore((state) => state.activeChamaId);
  const setActiveChama = useAuthzStore((state) => state.setActiveChama);

  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const fallbackChamaId =
    memberships.find((membership) => membership.isActive && membership.isApproved)?.chamaId ||
    chamas[0]?.id ||
    null;

  const fallbackMembershipChamas: Chama[] = memberships
    .filter((membership) => membership.isActive && membership.isApproved)
    .filter((membership) => !chamas.some((chama) => chama.id === membership.chamaId))
    .map((membership) => ({
      id: membership.chamaId,
      name: membership.chamaName,
      description: '',
      county: '',
      subcounty: '',
      currency: 'KES',
      status: 'active',
      created_at: '',
      updated_at: '',
      member_count: 0,
    }));

  const resolvedChamas = [...chamas, ...fallbackMembershipChamas];

  useEffect(() => {
    if (!activeChamaId && fallbackChamaId) {
      setActiveChama(fallbackChamaId);
    }
  }, [activeChamaId, fallbackChamaId, setActiveChama]);

  const resolvedActiveChamaId = activeChamaId || fallbackChamaId;
  const activeChama = resolvedChamas.find((chama) => chama.id === resolvedActiveChamaId) || null;
  const activeMembership = resolvedActiveChamaId
    ? memberships.find((membership) => membership.chamaId === resolvedActiveChamaId) || null
    : null;

  const availableChamas = resolvedChamas.map((chama) => {
    const membership = memberships.find((item) => item.chamaId === chama.id);

    return {
      ...chama,
      roleLabel: membership ? formatRoleLabel(membership.role) : null,
      isApproved: membership?.isApproved ?? false,
      isActiveMembership: membership?.isActive ?? false,
    };
  });

  const getScopedChamas = () => {
    const hasResolvedActiveChama = resolvedChamas.some((chama) => chama.id === resolvedActiveChamaId);

    if (!resolvedActiveChamaId || !hasResolvedActiveChama) {
      return resolvedChamas;
    }

    return resolvedChamas.filter((chama) => chama.id === resolvedActiveChamaId);
  };

  const switchChama = async (chamaId: string) => {
    if (chamaId === resolvedActiveChamaId) {
      return;
    }

    const previousChamaId = resolvedActiveChamaId;
    setSwitchError(null);
    setIsSwitching(true);
    setActiveChama(chamaId);

    try {
      await authService.switchActiveChama(chamaId);
      await refetch();
    } catch (error) {
      setActiveChama(previousChamaId);
      const message =
        error instanceof Error ? error.message : 'Unable to switch chama right now.';
      setSwitchError(message);
      throw error;
    } finally {
      setIsSwitching(false);
    }
  };

  return {
    chamas: resolvedChamas,
    availableChamas,
    activeChama,
    activeChamaId: resolvedActiveChamaId,
    activeMembership,
    isLoading,
    isSwitching,
    switchError,
    clearSwitchError: () => setSwitchError(null),
    getScopedChamas,
    refetchChamas: refetch,
    switchChama,
  };
};
