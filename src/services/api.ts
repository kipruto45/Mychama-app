import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { env } from '@/config/env';
import { toApiError } from '@/api/errors';
import { useAuthStore } from '@/store/authStore';
import { storage } from '@/utils/storage';

const API_BASE_URL = env.apiBaseUrl;
const PUBLIC_AUTH_PATHS = [
  '/v1/auth/login',
  '/v1/auth/register',
  '/v1/auth/refresh',
  '/v1/auth/password-reset/request',
  '/v1/auth/password-reset/confirm',
  '/v1/auth/otp/send',
  '/v1/auth/otp/confirm',
];

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const normalizeUrlForBase = (baseUrl: string | undefined, url: string | undefined) => {
  const resolvedBase = trimTrailingSlash(String(baseUrl || ''));
  const resolvedUrl = String(url || '');

  // If the base URL already includes `/api/v1`, avoid accidentally calling `/api/v1/v1/*`.
  if (resolvedBase.endsWith('/api/v1') && resolvedUrl.startsWith('/v1/')) {
    return resolvedUrl.slice('/v1'.length);
  }

  return resolvedUrl;
};

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    config: AxiosRequestConfig;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private isPublicAuthRequest(url?: string | null) {
    const normalizedUrl = String(url || '').split('?')[0];
    return PUBLIC_AUTH_PATHS.some((path) => normalizedUrl.startsWith(path));
  }

  private setupInterceptors() {
    // Request interceptor - inject JWT token
    this.client.interceptors.request.use(
      async (config) => {
        config.url = normalizeUrlForBase(config.baseURL || this.client.defaults.baseURL, config.url);
        const token = await storage.getItem('access_token');
        config.headers = config.headers ?? {};
        if (token && !this.isPublicAuthRequest(config.url)) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle 401 and refresh token
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !this.isPublicAuthRequest(originalRequest?.url)
        ) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject, config: originalRequest });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await storage.getItem('refresh_token');
            if (!refreshToken) {
              throw new Error('No refresh token');
            }

            const response = await this.client.post('/v1/auth/refresh', {
              refresh: refreshToken,
            });

            const { access } = response.data;
            await storage.setItem('access_token', access);

            this.processQueue(null, access);
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            await this.clearTokens();
            await useAuthStore.getState().clearSession();
            useAuthStore.getState().setAuthError('Your session has expired. Please sign in again.');
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(toApiError(error));
      }
    );
  }

  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject, config }) => {
      if (error) {
        reject(error);
      } else if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
        resolve(this.client(config));
      }
    });
    this.failedQueue = [];
  }

  private async clearTokens() {
    await storage.removeItem('access_token');
    await storage.removeItem('refresh_token');
    await storage.removeItem('user_data');
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
