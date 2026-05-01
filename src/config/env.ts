/**
 * Environment Configuration
 * 
 * Handles environment-aware API configuration for:
 * - Physical Android device: uses LAN IP (e.g., 192.168.0.103:8000)
 * - Android emulator: uses 10.0.2.2 (Android localhost alias)
 * - iOS simulator: uses localhost
 * - Production: uses public API URL
 * 
 * Configuration (set via .env file):
 * - EXPO_PUBLIC_API_URL: Full base URL (e.g., http://192.168.0.103:8000/api)
 * - EXPO_PUBLIC_USE_EMULATOR: Set to 'true' to use 10.0.2.2 for Android emulator
 * - EXPO_PUBLIC_DEBUG_IP: Explicit IP to use in development (overrides auto-detection)
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_PRODUCTION_API_BASE_URL = 'https://api.my-cham-a.app/api';
const DEFAULT_DEVELOPMENT_API_PORT = '8000';
const DEFAULT_HEALTH_ENDPOINT = 'health/';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value.trim());

const normalizeApiBaseUrl = (value: string) => {
  const trimmed = trimTrailingSlash(value.trim());

  if (!trimmed) {
    return '';
  }

  if (trimmed.endsWith('/api/v1')) {
    return trimmed.slice(0, -'/v1'.length);
  }

  return trimmed;
};

const extractHostname = (value?: string | null) => {
  const trimmed = String(value || '').trim();

  if (!trimmed) {
    return '';
  }

  try {
    const url = trimmed.includes('://') ? new URL(trimmed) : new URL(`http://${trimmed}`);
    return url.hostname;
  } catch {
    return '';
  }
};

const isLocalDevelopmentHost = (hostname: string) => {
  if (!hostname) {
    return false;
  }

  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '10.0.2.2' ||
    hostname === '::1' ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
};

const getExpoDebuggerHost = () => {
  const constants = Constants as typeof Constants & {
    manifest?: { debuggerHost?: string } | null;
    manifest2?: {
      extra?: {
        expoGo?: {
          debuggerHost?: string;
        };
      };
    } | null;
  };

  const candidates = [
    constants.expoConfig?.hostUri,
    constants.manifest2?.extra?.expoGo?.debuggerHost,
    constants.manifest?.debuggerHost,
  ];

  for (const candidate of candidates) {
    const hostname = extractHostname(candidate);
    if (hostname) {
      return hostname;
    }
  }

  return '';
};

type DeviceType = 'physical' | 'emulator' | 'simulator' | 'unknown';

const detectDeviceType = (): DeviceType => {
  if (Platform.OS === 'ios') {
    const constants = Platform.constants || {};
    const osVersion = 'osVersion' in constants ? String(constants.osVersion) : '';
    return osVersion.includes('Simulator') ? 'simulator' : 'unknown';
  }
  
  if (Platform.OS === 'android') {
    const constants = Constants as typeof Constants & {
      platform?: { android?: { isEmulator?: boolean } };
    };
    if (constants.platform?.android?.isEmulator === true) {
      return 'emulator';
    }
    return 'physical';
  }
  
  return 'unknown';
};

const resolveDevelopmentApiBaseUrl = (configuredApiUrl: string) => {
  const deviceType = detectDeviceType();
  const useEmulator = process.env.EXPO_PUBLIC_USE_EMULATOR === 'true';
  const explicitDebugIp = process.env.EXPO_PUBLIC_DEBUG_IP?.trim();
  const forceExplicitDebugIp = process.env.EXPO_PUBLIC_FORCE_DEBUG_IP === 'true';
  const developmentApiPort =
    process.env.EXPO_PUBLIC_API_PORT?.trim() || DEFAULT_DEVELOPMENT_API_PORT;
  const expoDebuggerHost = getExpoDebuggerHost();
  
  if (!__DEV__) {
    return configuredApiUrl;
  }

  if (forceExplicitDebugIp && explicitDebugIp && isLocalDevelopmentHost(explicitDebugIp)) {
    const resolved = `http://${explicitDebugIp}:${developmentApiPort}/api`;
    if (__DEV__) {
      console.log('[ENV] Using explicit debug IP:', explicitDebugIp);
    }
    return resolved;
  }

  if (deviceType === 'emulator' || useEmulator) {
    const resolved = `http://10.0.2.2:${developmentApiPort}/api`;
    if (__DEV__) {
      console.log('[ENV] Using Android emulator URL (10.0.2.2):', resolved);
    }
    return resolved;
  }

  if (deviceType === 'simulator' || Platform.OS === 'ios') {
    const host = expoDebuggerHost || 'localhost';
    const resolved = `http://${host}:${developmentApiPort}/api`;
    if (__DEV__) {
      console.log('[ENV] Using iOS simulator/local URL:', resolved);
    }
    return resolved;
  }

  if (expoDebuggerHost && isLocalDevelopmentHost(expoDebuggerHost)) {
    const resolved = `http://${expoDebuggerHost}:${developmentApiPort}/api`;
    if (__DEV__) {
      console.log('[ENV] Using Expo debugger host:', resolved);
    }
    return resolved;
  }

  if (configuredApiUrl) {
    if (configuredApiUrl.includes('/api') || configuredApiUrl.includes(':8000')) {
      if (__DEV__) {
        console.log('[ENV] Using configured API URL:', configuredApiUrl);
      }
      return normalizeApiBaseUrl(configuredApiUrl);
    }
  }

  if (__DEV__) {
    console.log('[ENV] No auto-detected host. Set EXPO_PUBLIC_API_URL or EXPO_PUBLIC_DEBUG_IP');
  }
  return configuredApiUrl;
};

const getUrlOrigin = (value: string) => {
  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
};

const resolveUrlAgainstBase = (baseUrl: string, path: string) => {
  const trimmedBaseUrl = trimTrailingSlash(baseUrl);
  const trimmedPath = String(path || '').trim().replace(/^\/+/, '');

  if (!trimmedBaseUrl || !trimmedPath) {
    return trimmedPath || path;
  }

  return new URL(trimmedPath, `${trimmedBaseUrl}/`).toString();
};

const resolveApiBaseUrl = () => {
  const configuredApiUrl = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_URL || '');
  const developmentApiUrl = resolveDevelopmentApiBaseUrl(configuredApiUrl);

  if (developmentApiUrl) {
    if (__DEV__) {
      console.log('[ENV] Final API URL (dev):', developmentApiUrl);
    }
    return developmentApiUrl;
  }

  if (__DEV__) {
    console.log('[ENV] Final API URL:', configuredApiUrl || DEFAULT_PRODUCTION_API_BASE_URL);
  }
  return configuredApiUrl || DEFAULT_PRODUCTION_API_BASE_URL;
};

const resolveHealthEndpoint = (configuredEndpoint: string, apiBaseUrl: string) => {
  const trimmed = String(configuredEndpoint || '').trim();

  if (!trimmed) {
    return resolveUrlAgainstBase(getUrlOrigin(apiBaseUrl), DEFAULT_HEALTH_ENDPOINT);
  }

  if (isAbsoluteUrl(trimmed)) {
    return trimmed;
  }

  const normalizedPath = trimmed.replace(/^\/+/, '');
  const originBase =
    normalizedPath.startsWith('health/') || normalizedPath === 'health'
      ? getUrlOrigin(apiBaseUrl)
      : apiBaseUrl;

  return resolveUrlAgainstBase(originBase || apiBaseUrl, normalizedPath);
};

const resolvedApiBaseUrl = resolveApiBaseUrl();

const resolvedHealthEndpoint = resolveHealthEndpoint(
  process.env.EXPO_PUBLIC_HEALTH_ENDPOINT || DEFAULT_HEALTH_ENDPOINT,
  resolvedApiBaseUrl
);

const resolvedSupabaseUrl = trimTrailingSlash(
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
);
const resolvedSupabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  '';
const resolvedPosthogHost = trimTrailingSlash(
  process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
);

export const env = {
  apiBaseUrl: resolvedApiBaseUrl,
  healthEndpoint: resolvedHealthEndpoint,
  supabaseUrl: resolvedSupabaseUrl,
  supabaseAnonKey: resolvedSupabaseAnonKey,
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY || '',
  posthogHost: resolvedPosthogHost,
  expoProjectId: process.env.EXPO_PUBLIC_EXPO_PROJECT_ID || '',
  enablePushNotifications:
    (process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS || 'true').toLowerCase() !== 'false',
  firebaseAnalyticsEnabled:
    (process.env.EXPO_PUBLIC_FIREBASE_ANALYTICS_ENABLED || 'false').toLowerCase() === 'true',
  appName: 'MyChama',
};
