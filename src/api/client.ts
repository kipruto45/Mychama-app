/**
 * Secure API Client
 * 
 * Production-grade API client with:
 * - JWT token management with automatic refresh
 * - Request/response interceptors
 * - Secure token storage
 * - Error normalization
 * - Request deduplication
 * - Timeout handling
 * - Rate limiting awareness
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { ApiError, toApiError } from './errors';
import { storage } from '@/utils/storage';
import { useAuthStore } from '@/store/authStore';

// ============================================================================
// TYPES
// ============================================================================

interface QueueItem {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  config: RequestConfigWithMetadata;
}

interface RequestMetadata {
  startTime: number;
}

type RequestConfigWithMetadata = InternalAxiosRequestConfig & {
  _retry?: boolean;
  metadata?: RequestMetadata;
};

interface TokenResponse {
  access: string;
  refresh: string;
}

const DEVICE_FINGERPRINT_STORAGE_KEY = 'device_fingerprint';

// Pagination types
interface PaginationParams {
  limit?: number;
  cursor?: string;
  offset?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    totalCount: number;
  };
}

// Batch request types
interface BatchRequest {
  method: string;
  url: string;
  data?: any;
  config?: AxiosRequestConfig;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

const extractTokens = (payload: unknown): TokenResponse => {
  if (payload && typeof payload === 'object') {
    if ('access' in (payload as Record<string, unknown>) && 'refresh' in (payload as Record<string, unknown>)) {
      return payload as TokenResponse;
    }

    if ('tokens' in (payload as Record<string, unknown>)) {
      return (payload as { tokens: TokenResponse }).tokens;
    }
  }

  throw new Error('Authentication response did not include tokens.');
};

// ============================================================================
// CONSTANTS
// ============================================================================

const API_BASE_URL = env.apiBaseUrl;
const DEFAULT_REQUEST_TIMEOUT = 10000; // 10 seconds for mobile
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const BATCH_WINDOW_MS = 50; // 50ms batching window

// Per-endpoint timeout configuration
const ENDPOINT_TIMEOUTS: Record<string, number> = {
  '/v1/auth/login': 10000,
  '/v1/auth/refresh': 8000,
  '/v1/auth/register': 20000,
  '/v1/finance/contributions': 15000,
  '/v1/finance/loans': 15000,
  '/v1/finance/ledger': 15000,
  '/v1/chamas': 10000,
  '/v1/meetings': 10000,
};

// ============================================================================
// SECURE STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  SESSION_ID: 'session_id',
} as const;

const PUBLIC_AUTH_PATHS = [
  '/v1/auth/login',
  '/v1/auth/register',
  '/v1/auth/refresh',
  '/v1/auth/password-reset/request',
  '/v1/auth/password-reset/confirm',
  '/v1/auth/otp/send',
  '/v1/auth/otp/confirm',
];

// ============================================================================
// API CLIENT CLASS
// ============================================================================

class SecureApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: QueueItem[] = [];
  private requestCache = new Map<string, Promise<any>>();
  private sessionId: string | null = null;
  private batchQueue: BatchRequest[] = [];
  private batchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: DEFAULT_REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });

    if (__DEV__) {
      console.log('[API] Client initialized with baseURL:', API_BASE_URL);
    }

    this.setupInterceptors();
    this.loadSessionId();
  }

  private getTimeoutForEndpoint(url: string): number {
    for (const [pattern, timeout] of Object.entries(ENDPOINT_TIMEOUTS)) {
      if (url.startsWith(pattern)) {
        return timeout;
      }
    }
    return DEFAULT_REQUEST_TIMEOUT;
  }

  private withEndpointTimeout(url: string, config?: AxiosRequestConfig): AxiosRequestConfig {
    if (config?.timeout != null) {
      return config;
    }

    return {
      ...config,
      timeout: this.getTimeoutForEndpoint(url),
    };
  }

  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================

  private async loadSessionId(): Promise<void> {
    try {
      this.sessionId = await storage.getItem(STORAGE_KEYS.SESSION_ID);
    } catch (error) {
      console.warn('Failed to load session ID:', error);
    }
  }

  private async generateSessionId(): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await storage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
    this.sessionId = sessionId;
    return sessionId;
  }

  // ==========================================================================
  // TOKEN MANAGEMENT
  // ==========================================================================

  private async getAccessToken(): Promise<string | null> {
    try {
      return await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  private async getRefreshToken(): Promise<string | null> {
    try {
      return await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  private async setTokens(tokens: TokenResponse): Promise<void> {
    try {
      await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);
    } catch (error) {
      console.error('Failed to set tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  private async clearTokens(): Promise<void> {
    try {
      await storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      await storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await storage.removeItem(STORAGE_KEYS.USER_DATA);
      await storage.removeItem(STORAGE_KEYS.SESSION_ID);
      this.sessionId = null;
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  private isPublicAuthRequest(url?: string | null): boolean {
    const normalizedUrl = String(url || '').split('?')[0];
    return PUBLIC_AUTH_PATHS.some((path) => normalizedUrl.startsWith(path));
  }

  // ==========================================================================
  // INTERCEPTORS
  // ==========================================================================

  private setupInterceptors(): void {
    // Request interceptor - inject JWT token and session ID
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const requestConfig = config as RequestConfigWithMetadata;
        const token = await this.getAccessToken();
        const sessionId = this.sessionId ?? await this.generateSessionId();
        const deviceFingerprint = await storage.getItem(DEVICE_FINGERPRINT_STORAGE_KEY);
        const resolvedDeviceId = deviceFingerprint || sessionId;
        
        if (token && !this.isPublicAuthRequest(requestConfig.url)) {
          requestConfig.headers.Authorization = `Bearer ${token}`;
        }

        requestConfig.headers['X-Session-ID'] = sessionId;
        requestConfig.headers['X-Device-ID'] = resolvedDeviceId;
        requestConfig.headers['X-Device-Name'] = 'MyChama Mobile';

        // Add request timestamp for debugging
        requestConfig.metadata = { startTime: Date.now() };

        return requestConfig;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors and token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        const config = response.config as RequestConfigWithMetadata;
        // Log response time in development
        if (__DEV__ && config.metadata) {
          const duration = Date.now() - config.metadata.startTime;
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url} - ${duration}ms`);
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config as RequestConfigWithMetadata;

        if (__DEV__ && !error.response && originalRequest?.url) {
          const requestTarget = `${originalRequest.baseURL || API_BASE_URL}${originalRequest.url}`;
          const errorCode = error.code || 'UNKNOWN';
          const errorMessage = error.message || 'Unknown error';
          
          let diagnosticInfo = '';
          if (error.code === 'ECONNABORTED') {
            diagnosticInfo = ' - Request timed out';
          } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
            diagnosticInfo = ' - Network unreachable or connection refused. Check if backend is running on ' + requestTarget;
          } else if (error.code === 'ENOTFOUND') {
            diagnosticInfo = ' - DNS lookup failed for ' + originalRequest.baseURL;
          } else if (error.code === 'ECONNREFUSED') {
            diagnosticInfo = ' - Connection refused. Is the backend running?';
          }
          
          console.warn(
            `[API] ${String(originalRequest.method || 'REQUEST').toUpperCase()} ${requestTarget} failed: ${errorCode}${diagnosticInfo}`
          );
        }

        // Handle 401 Unauthorized - attempt token refresh
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !this.isPublicAuthRequest(originalRequest?.url)
        ) {
          if (this.isRefreshing) {
            // Queue the request while token is being refreshed
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject, config: originalRequest });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await this.getRefreshToken();
            
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            // Attempt to refresh the token
            const response = await this.client.post<TokenResponse>('/v1/auth/refresh', {
              refresh: refreshToken,
            });

            const { access, refresh: newRefresh } = response.data;
            
            // Store new tokens
            await this.setTokens({ access, refresh: newRefresh });

            // Process queued requests with new token
            this.processQueue(null, access);

            // Retry the original request
            originalRequest.headers.Authorization = `Bearer ${access}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - clear session and reject queued requests
            this.processQueue(refreshError, null);
            await this.clearTokens();
            await useAuthStore.getState().markSessionExpired(
              'Your session expired. Please sign in again.'
            );
            
            // Return a specific error for session expiry
            return Promise.reject(new ApiError({
              code: 'SESSION_EXPIRED',
              message: 'Your session has expired. Please sign in again.',
              status: 401,
            }));
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle 403 Forbidden
        if (error.response?.status === 403) {
          return Promise.reject(new ApiError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to perform this action.',
            status: 403,
          }));
        }

        // Handle 429 Rate Limited
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          return Promise.reject(new ApiError({
            code: 'RATE_LIMITED',
            message: `Too many requests. Please try again in ${retryAfter || 'a few'} seconds.`,
            status: 429,
            retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
          }));
        }

        // Normalize other errors
        return Promise.reject(toApiError(error));
      }
    );
  }

  private processQueue(error: any, token: string | null): void {
    this.failedQueue.forEach(({ resolve, reject, config }) => {
      if (error) {
        reject(error);
      } else if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        resolve(this.client(config));
      }
    });
    this.failedQueue = [];
  }

  // ==========================================================================
  // REQUEST DEDUPLICATION
  // ==========================================================================

  private getRequestKey(method: string, url: string, data?: any): string {
    const dataKey = data ? JSON.stringify(data) : '';
    return `${method}:${url}:${dataKey}`;
  }

  private async deduplicatedRequest<T>(
    method: string,
    url: string,
    config?: AxiosRequestConfig,
    data?: any
  ): Promise<T> {
    const key = this.getRequestKey(method, url, data);
    
    // Check if same request is already in flight
    if (this.requestCache.has(key)) {
      return this.requestCache.get(key);
    }

    // Create new request
    const requestPromise = this.executeRequest<T>(method, url, config, data);
    
    // Cache the promise
    this.requestCache.set(key, requestPromise);
    
    // Clean up after request completes
    requestPromise.finally(() => {
      this.requestCache.delete(key);
    });

    return requestPromise;
  }

  private async executeRequest<T>(
    method: string,
    url: string,
    config?: AxiosRequestConfig,
    data?: any
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        let response: AxiosResponse<T>;
        const requestConfig = this.withEndpointTimeout(url, config);
        
        switch (method.toLowerCase()) {
          case 'get':
            response = await this.client.get<T>(url, requestConfig);
            break;
          case 'post':
            response = await this.client.post<T>(url, data, requestConfig);
            break;
          case 'put':
            response = await this.client.put<T>(url, data, requestConfig);
            break;
          case 'patch':
            response = await this.client.patch<T>(url, data, requestConfig);
            break;
          case 'delete':
            response = await this.client.delete<T>(url, requestConfig);
            break;
          default:
            throw new Error(`Unsupported HTTP method: ${method}`);
        }
        
        return response.data;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors (4xx) except 429
        if (error instanceof ApiError) {
          if (error.status >= 400 && error.status < 500 && error.status !== 429) {
            throw error;
          }
          
          // Handle rate limiting with retry
          if (error.status === 429 && error.retryAfter) {
            await this.delay(error.retryAfter * 1000);
            continue;
          }
        }
        
        // Retry on network errors or server errors (5xx)
        if (attempt < MAX_RETRY_ATTEMPTS) {
          await this.delay(RETRY_DELAY_MS * attempt);
        }
      }
    }
    
    throw lastError || new Error('Request failed after maximum retries');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==========================================================================
  // PUBLIC API METHODS
  // ==========================================================================

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.deduplicatedRequest<T>('get', url, config);
  }

  /**
   * Paginated GET request with cursor-based pagination
   */
  async getPaginated<T>(
    url: string,
    params: PaginationParams = {},
    config?: AxiosRequestConfig
  ): Promise<PaginatedResponse<T>> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.cursor) queryParams.append('cursor', params.cursor);
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const separator = url.includes('?') ? '&' : '?';
    const fullUrl = `${url}${separator}${queryParams.toString()}`;

    return this.deduplicatedRequest<PaginatedResponse<T>>('get', fullUrl, {
      ...config,
      timeout: this.getTimeoutForEndpoint(url),
    });
  }

  /**
   * Batch multiple GET requests within a time window
   */
  async batchGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({
        method: 'get',
        url,
        config,
        resolve,
        reject,
      });

      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.executeBatch(), BATCH_WINDOW_MS);
      }
    });
  }

  private async executeBatch(): Promise<void> {
    const batch = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimer = null;

    // Execute all batched requests in parallel
    await Promise.allSettled(
      batch.map(async (request) => {
        try {
          const result = await this.get(request.url, request.config);
          request.resolve(result);
        } catch (error) {
          request.reject(error);
        }
      })
    );
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.deduplicatedRequest<T>('post', url, config, data);
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.deduplicatedRequest<T>('put', url, config, data);
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.deduplicatedRequest<T>('patch', url, config, data);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.deduplicatedRequest<T>('delete', url, config);
  }

  // ==========================================================================
  // AUTHENTICATION METHODS
  // ==========================================================================

  async login(credentials: { phone: string; password: string }): Promise<unknown> {
    await this.clearTokens();
    this.requestCache.clear();
    await this.generateSessionId();

    const response = await this.client.post<unknown>(
      '/v1/auth/login',
      credentials,
      this.withEndpointTimeout('/v1/auth/login')
    );

    try {
      const tokens = extractTokens(response.data);
      await this.setTokens(tokens);
      return tokens;
    } catch {
      return response.data;
    }
  }

  async register<T>(data: any): Promise<T> {
    const response = await this.client.post<T>(
      '/v1/auth/register',
      data,
      this.withEndpointTimeout('/v1/auth/register')
    );
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      const refresh = await this.getRefreshToken();
      const payload = refresh ? { refresh } : {};
      await this.client.post('/v1/auth/logout', payload, this.withEndpointTimeout('/v1/auth/logout'));
    } catch (error) {
      // Ignore logout errors - we'll clear tokens anyway
      console.warn('Logout API call failed:', error);
    } finally {
      await this.clearTokens();
      this.requestCache.clear();
    }
  }

  async refreshTokens(): Promise<TokenResponse> {
    const refreshToken = await this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.client.post<TokenResponse & { family_id?: string }>(
      '/v1/auth/refresh',
      {
        refresh: refreshToken,
      },
      this.withEndpointTimeout('/v1/auth/refresh')
    );

    await this.setTokens(response.data);
    return response.data;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  async clearSession(): Promise<void> {
    await this.clearTokens();
    this.requestCache.clear();
  }

  getBaseURL(): string {
    return API_BASE_URL;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const apiClient = new SecureApiClient();
export type { TokenResponse, ApiError, PaginationParams, PaginatedResponse };
