import { env } from '@/config/env';

export type SupabaseHealthState =
  | 'healthy'
  | 'degraded'
  | 'unconfigured'
  | 'unreachable';

export interface SupabaseHealthResult {
  status: SupabaseHealthState;
  message: string;
  details?: Record<string, unknown>;
}

type SupabaseBody = string | FormData | Blob | ArrayBuffer;

interface SupabaseRequestOptions {
  accessToken?: string;
  body?: SupabaseBody | Record<string, unknown> | null;
  headers?: Record<string, string>;
  method?: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 8000;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const encodeStoragePath = (value: string) =>
  value
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

const supabaseUrl = trimTrailingSlash(env.supabaseUrl || '');
const supabaseAnonKey = env.supabaseAnonKey || '';

const isJsonBody = (
  value: SupabaseRequestOptions['body']
): value is Record<string, unknown> =>
  Boolean(value) &&
  typeof value === 'object' &&
  !(value instanceof FormData) &&
  !(value instanceof Blob) &&
  !(value instanceof ArrayBuffer);

const buildHeaders = ({
  accessToken,
  headers,
  includeJsonContentType,
}: {
  accessToken?: string;
  headers?: Record<string, string>;
  includeJsonContentType: boolean;
}) => {
  const resolvedHeaders: Record<string, string> = {
    Accept: 'application/json',
    apikey: supabaseAnonKey,
    ...headers,
  };

  if (accessToken) {
    resolvedHeaders.Authorization = `Bearer ${accessToken}`;
  }

  if (includeJsonContentType && !resolvedHeaders['Content-Type']) {
    resolvedHeaders['Content-Type'] = 'application/json';
  }

  return resolvedHeaders;
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
};

const buildTimeoutSignal = (timeoutMs: number) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timer),
  };
};

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseRestUrl = supabaseUrl ? `${supabaseUrl}/rest/v1` : '';
export const supabaseAuthUrl = supabaseUrl ? `${supabaseUrl}/auth/v1` : '';
export const supabaseStorageUrl = supabaseUrl ? `${supabaseUrl}/storage/v1` : '';

export const createSupabasePublicUrl = (bucket: string, objectPath: string) => {
  if (!supabaseStorageUrl) {
    return '';
  }

  const safeBucket = encodeURIComponent(bucket.trim());
  const safePath = encodeStoragePath(objectPath);
  return `${supabaseStorageUrl}/object/public/${safeBucket}/${safePath}`;
};

export const supabaseRequest = async <T>(
  path: string,
  options: SupabaseRequestOptions = {}
): Promise<T> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const method = options.method || 'GET';
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const target = path.startsWith('http')
    ? path
    : `${supabaseUrl}/${path.replace(/^\/+/, '')}`;
  const includeJsonContentType = isJsonBody(options.body);
  const { signal, cleanup } = buildTimeoutSignal(timeoutMs);

  try {
    const response = await fetch(target, {
      method,
      headers: buildHeaders({
        accessToken: options.accessToken,
        headers: options.headers,
        includeJsonContentType,
      }),
      body:
        options.body == null
          ? undefined
          : includeJsonContentType
            ? JSON.stringify(options.body)
            : (options.body as SupabaseBody),
      signal,
    });

    const payload = await parseResponseBody(response);

    if (!response.ok) {
      const description =
        typeof payload === 'string'
          ? payload
          : payload && typeof payload === 'object' && 'message' in payload
            ? String((payload as { message?: unknown }).message || '')
            : '';
      throw new Error(
        `Supabase request failed (${response.status})${description ? `: ${description}` : ''}`
      );
    }

    return payload as T;
  } finally {
    cleanup();
  }
};

export const checkSupabaseHealth = async (): Promise<SupabaseHealthResult> => {
  if (!supabaseUrl) {
    return {
      status: 'unconfigured',
      message: 'Supabase URL is missing.',
      details: { configured: false },
    };
  }

  if (!supabaseAnonKey) {
    return {
      status: 'degraded',
      message: 'Supabase anon key is missing.',
      details: { configured: false, url: supabaseUrl },
    };
  }

  try {
    const { signal, cleanup } = buildTimeoutSignal(DEFAULT_TIMEOUT_MS);
    try {
      const response = await fetch(`${supabaseAuthUrl}/settings`, {
        method: 'GET',
        headers: buildHeaders({ includeJsonContentType: false }),
        signal,
      });

      if (response.ok) {
        return {
          status: 'healthy',
          message: 'Supabase is reachable.',
          details: { url: supabaseUrl, statusCode: response.status },
        };
      }

      return {
        status: response.status < 500 ? 'degraded' : 'unreachable',
        message: `Supabase responded with status ${response.status}.`,
        details: { url: supabaseUrl, statusCode: response.status },
      };
    } finally {
      cleanup();
    }
  } catch (error) {
    return {
      status: 'unreachable',
      message: error instanceof Error ? error.message : 'Supabase request failed.',
      details: { url: supabaseUrl },
    };
  }
};

export const supabase = {
  authUrl: supabaseAuthUrl,
  createPublicUrl: createSupabasePublicUrl,
  isConfigured: isSupabaseConfigured,
  request: supabaseRequest,
  restUrl: supabaseRestUrl,
  storageUrl: supabaseStorageUrl,
  url: supabaseUrl,
};
