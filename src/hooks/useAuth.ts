import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { LoginCredentials, RegisterData, OTPRequest, OTPVerification } from '@/types';

export const useLogin = () => {
  const queryClient = useQueryClient();
  const { setUser, setTokens } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: async (result) => {
      if (result.status !== 'authenticated') {
        return;
      }
      await setTokens(result.tokens);
      const user = await authService.getProfile();
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
  });
};

export const useRequestOTP = () => {
  return useMutation({
    mutationFn: (data: OTPRequest) => authService.requestOTP(data),
  });
};

export const useVerifyOTP = () => {
  return useMutation({
    mutationFn: (data: OTPVerification) => authService.verifyOTP(data),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const { clearSession } = useAuthStore();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });
};

export const useProfile = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: authService.getProfile,
    enabled: !!user,
    initialData: user,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: Partial<any>) => authService.updateProfile(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
};
