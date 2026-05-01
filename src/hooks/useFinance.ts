import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService } from '@/services/financeService';
import { Contribution, ContributionType, Loan, Wallet, LedgerEntry, Penalty, FinancialSummary } from '@/types';

export const useContributions = (chamaId: string) => {
  return useQuery<Contribution[]>({
    queryKey: ['finance', chamaId, 'contributions'],
    queryFn: () => financeService.getContributions(chamaId),
    enabled: !!chamaId,
  });
};

export const useContributionTypes = (chamaId: string) => {
  return useQuery<ContributionType[]>({
    queryKey: ['finance', chamaId, 'contribution-types'],
    queryFn: () => financeService.getContributionTypes(chamaId),
    enabled: !!chamaId,
  });
};

export const useCreateContribution = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chamaId, data }: { chamaId: string; data: any }) =>
      financeService.createContribution(chamaId, data),
    onSuccess: (_, { chamaId }) => {
      queryClient.invalidateQueries({ queryKey: ['finance', chamaId, 'contributions'] });
      queryClient.invalidateQueries({ queryKey: ['finance', chamaId, 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['finance', chamaId, 'wallet'] });
    },
  });
};

export const useLoans = (chamaId: string) => {
  return useQuery<Loan[]>({
    queryKey: ['finance', chamaId, 'loans'],
    queryFn: () => financeService.getLoans(chamaId),
    enabled: !!chamaId,
  });
};

export const useLoan = (chamaId: string, loanId: string) => {
  return useQuery<Loan>({
    queryKey: ['finance', chamaId, 'loans', loanId],
    queryFn: () => financeService.getLoan(chamaId, loanId),
    enabled: !!chamaId && !!loanId,
  });
};

export const useRequestLoan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chamaId, data }: { chamaId: string; data: any }) =>
      financeService.requestLoan(chamaId, data),
    onSuccess: (_, { chamaId }) => {
      queryClient.invalidateQueries({ queryKey: ['finance', chamaId, 'loans'] });
    },
  });
};

export const useApproveLoan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chamaId, loanId, note }: { chamaId: string; loanId: string; note?: string }) =>
      financeService.approveLoan(chamaId, loanId, note),
    onSuccess: (_, { chamaId, loanId }) => {
      queryClient.invalidateQueries({ queryKey: ['finance', chamaId, 'loans'] });
      queryClient.invalidateQueries({ queryKey: ['finance', chamaId, 'loans', loanId] });
    },
  });
};

export const useRejectLoan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chamaId, loanId, note }: { chamaId: string; loanId: string; note?: string }) =>
      financeService.rejectLoan(chamaId, loanId, note),
    onSuccess: (_, { chamaId, loanId }) => {
      queryClient.invalidateQueries({ queryKey: ['finance', chamaId, 'loans'] });
      queryClient.invalidateQueries({ queryKey: ['finance', chamaId, 'loans', loanId] });
    },
  });
};

export const useWallet = (chamaId: string) => {
  return useQuery<Wallet>({
    queryKey: ['finance', chamaId, 'wallet'],
    queryFn: () => financeService.getWallet(chamaId),
    enabled: !!chamaId,
  });
};

export const useLedgerEntries = (chamaId: string) => {
  return useQuery<LedgerEntry[]>({
    queryKey: ['finance', chamaId, 'ledger'],
    queryFn: () => financeService.getLedgerEntries(chamaId),
    enabled: !!chamaId,
  });
};

export const usePenalties = (chamaId: string) => {
  return useQuery<Penalty[]>({
    queryKey: ['finance', chamaId, 'penalties'],
    queryFn: () => financeService.getPenalties(chamaId),
    enabled: !!chamaId,
  });
};

export const useFinancialSummary = (chamaId: string) => {
  return useQuery<FinancialSummary>({
    queryKey: ['finance', chamaId, 'summary'],
    queryFn: () => financeService.getFinancialSummary(chamaId),
    enabled: !!chamaId,
  });
};
