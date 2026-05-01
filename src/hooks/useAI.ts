import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiService } from '@/services/aiService';
import { AIMessage, AIInsight, AIAnalysis } from '@/types';

export const useAIChat = (chamaId: string) => {
  return useQuery<AIMessage[]>({
    queryKey: ['ai', chamaId, 'chat'],
    queryFn: () => aiService.getChatHistory(chamaId),
    enabled: !!chamaId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chamaId, message }: { chamaId: string; message: string }) =>
      aiService.sendMessage(chamaId, message),
    onSuccess: (_, { chamaId }) => {
      queryClient.invalidateQueries({ queryKey: ['ai', chamaId, 'chat'] });
    },
  });
};

export const useAIInsights = (chamaId: string) => {
  return useQuery<AIInsight[]>({
    queryKey: ['ai', chamaId, 'insights'],
    queryFn: () => aiService.getInsights(chamaId),
    enabled: !!chamaId,
  });
};

export const useAISuggestions = (context: string) => {
  return useQuery<AIInsight[]>({
    queryKey: ['ai', 'suggestions', context],
    queryFn: () => aiService.getSuggestions(context),
    enabled: !!context,
  });
};

export const useFinancialAnalysis = (chamaId: string) => {
  return useQuery<AIAnalysis>({
    queryKey: ['ai', chamaId, 'financial-analysis'],
    queryFn: () => aiService.getFinancialAnalysis(chamaId),
    enabled: !!chamaId,
  });
};

export const useMemberRiskAssessment = (chamaId: string, memberId: string) => {
  return useQuery({
    queryKey: ['ai', chamaId, 'member-risk', memberId],
    queryFn: () => aiService.getMemberRiskAssessment(chamaId, memberId),
    enabled: !!chamaId && !!memberId,
  });
};

export const useFraudDetection = (chamaId: string) => {
  return useQuery({
    queryKey: ['ai', chamaId, 'fraud-detection'],
    queryFn: () => aiService.getFraudDetection(chamaId),
    enabled: !!chamaId,
  });
};
