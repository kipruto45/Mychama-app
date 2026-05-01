import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chamaService } from '@/services/chamaService';
import { Chama, Membership, InviteLink, MembershipRequest } from '@/types';

export const useChamas = () => {
  return useQuery<Chama[]>({
    queryKey: ['chamas'],
    queryFn: chamaService.getChamas,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useChama = (id: string) => {
  return useQuery<Chama>({
    queryKey: ['chamas', id],
    queryFn: () => chamaService.getChama(id),
    enabled: !!id,
  });
};

export const useChamaMembers = (chamaId: string) => {
  return useQuery<Membership[]>({
    queryKey: ['chamas', chamaId, 'members'],
    queryFn: () => chamaService.getMembers(chamaId),
    enabled: !!chamaId,
  });
};

export const useCreateChama = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: chamaService.createChama,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chamas'] });
    },
  });
};

export const useUpdateChama = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Chama> }) =>
      chamaService.updateChama(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['chamas', id] });
      queryClient.invalidateQueries({ queryKey: ['chamas'] });
    },
  });
};

export const useDeleteChama = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: chamaService.deleteChama,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chamas'] });
    },
  });
};

export const useMembershipRequests = (chamaId: string) => {
  return useQuery<MembershipRequest[]>({
    queryKey: ['chamas', chamaId, 'membership-requests'],
    queryFn: () => chamaService.getMembershipRequests(chamaId),
    enabled: !!chamaId,
  });
};

export const useApproveMembershipRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chamaId, requestId, note }: { chamaId: string; requestId: string; note?: string }) =>
      chamaService.approveMembershipRequest(chamaId, requestId, note),
    onSuccess: (_, { chamaId }) => {
      queryClient.invalidateQueries({ queryKey: ['chamas', chamaId, 'membership-requests'] });
      queryClient.invalidateQueries({ queryKey: ['chamas', chamaId, 'members'] });
    },
  });
};

export const useRejectMembershipRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chamaId, requestId, note }: { chamaId: string; requestId: string; note?: string }) =>
      chamaService.rejectMembershipRequest(chamaId, requestId, note),
    onSuccess: (_, { chamaId }) => {
      queryClient.invalidateQueries({ queryKey: ['chamas', chamaId, 'membership-requests'] });
    },
  });
};

export const useInviteLinks = (chamaId: string) => {
  return useQuery<InviteLink[]>({
    queryKey: ['chamas', chamaId, 'invite-links'],
    queryFn: () => chamaService.getInviteLinks(chamaId),
    enabled: !!chamaId,
  });
};

export const useCreateInviteLink = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chamaId, data }: { chamaId: string; data: any }) =>
      chamaService.createInviteLink(chamaId, data),
    onSuccess: (_, { chamaId }) => {
      queryClient.invalidateQueries({ queryKey: ['chamas', chamaId, 'invite-links'] });
    },
  });
};

export const useRevokeInviteLink = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chamaId, linkId, reason }: { chamaId: string; linkId: string; reason?: string }) =>
      chamaService.revokeInviteLink(chamaId, linkId, reason),
    onSuccess: (_, { chamaId }) => {
      queryClient.invalidateQueries({ queryKey: ['chamas', chamaId, 'invite-links'] });
    },
  });
};
