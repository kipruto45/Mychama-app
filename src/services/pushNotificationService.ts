import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { env } from '@/config/env';
import { notificationService } from '@/services/notificationService';

type PushModule = {
  AndroidImportance?: { MAX: number };
  setNotificationHandler?: (handler: unknown) => void;
  setNotificationChannelAsync?: (name: string, config: Record<string, unknown>) => Promise<void>;
  getPermissionsAsync?: () => Promise<{ status?: string }>;
  requestPermissionsAsync?: () => Promise<{ status?: string }>;
  getExpoPushTokenAsync?: (options?: Record<string, unknown>) => Promise<{ data: string }>;
};

export type PushRuntimeEnvironment = {
  isExpoGo: boolean;
  isDevelopmentBuild: boolean;
  isProductionBuild: boolean;
  platform: 'android' | 'ios' | 'web';
  isDevice: boolean;
  canUseRemotePush: boolean;
  displayName: string;
};

export function getPushRuntimeEnvironment(): PushRuntimeEnvironment {
  const appOwnership = (Constants as any)?.appOwnership as string | undefined;
  const executionEnvironment = (Constants as any)?.executionEnvironment as string | undefined;

  // Expo Go detection: prefer executionEnvironment when available; otherwise appOwnership.
  // If the environment is unknown, default to "not safe for remote push" (skip).
  const isExpoGo =
    executionEnvironment === 'storeClient' ||
    appOwnership === 'expo' ||
    appOwnership === 'guest';

  const isDevelopmentBuild = !isExpoGo && executionEnvironment === 'bare';
  const isProductionBuild = !__DEV__ && !isDevelopmentBuild && !isExpoGo;

  const platform =
    Platform.OS === 'android' || Platform.OS === 'ios'
      ? (Platform.OS as 'android' | 'ios')
      : 'web';

  let isDevice = false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const device = require('expo-device');
    isDevice = device?.isDevice === true;
  } catch {
    isDevice = false;
  }

  // Remote push should only be attempted on physical devices and outside Expo Go.
  const canUseRemotePush = !isExpoGo && platform !== 'web' && isDevice;

  const displayName = isExpoGo
    ? `Expo Go (${platform})`
    : isDevelopmentBuild
      ? `Development Build (${platform})`
      : isProductionBuild
        ? `Production Build (${platform})`
        : `Unknown Runtime (${platform})`;

  return {
    isExpoGo,
    isDevelopmentBuild,
    isProductionBuild,
    platform,
    isDevice,
    canUseRemotePush,
    displayName,
  };
}

class PushNotificationService {
  private initialized = false;
  private notifications: PushModule | null = null;
  private lastExpoPushToken: string | null = null;
  private expoGoWarningLogged = false;
  private env: PushRuntimeEnvironment | null = null;

  initialize() {
    if (this.initialized) {
      return;
    }

    this.env = getPushRuntimeEnvironment();
    console.log('[Push] Environment:', this.env);

    if (this.env.isExpoGo) {
      this.notifications = null;
      this.initialized = true;
      if (!this.expoGoWarningLogged) {
        this.expoGoWarningLogged = true;
        console.log('Push notifications are unavailable in Expo Go. Use a development build.');
      }
      return;
    }

    try {
      this.notifications = this.loadNotificationsModule();
      this.notifications?.setNotificationHandler?.({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    } catch (error) {
      console.warn('Push notifications initialization failed:', error);
      this.notifications = null;
    }
    this.initialized = true;
  }

  async registerDevice() {
    try {
      this.initialize();

      const runtime = this.env ?? getPushRuntimeEnvironment();

      if (!env.enablePushNotifications) {
        console.log('[Push] Disabled via EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS');
        return null;
      }

      if (!runtime.canUseRemotePush) {
        // In Expo Go, on web, or on simulators/emulators: never attempt remote push token APIs.
        console.log('[Push] Remote push unavailable in this environment:', runtime.displayName);
        return null;
      }

      if (!this.notifications) {
        console.log('[Push] expo-notifications unavailable; skipping push registration');
        return null;
      }

      const permissions = await this.notifications.getPermissionsAsync?.();
      let finalStatus = permissions?.status;

      if (finalStatus !== 'granted') {
        const requested = await this.notifications.requestPermissionsAsync?.();
        finalStatus = requested?.status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Push] Permission not granted:', finalStatus);
        return null;
      }

      if (Platform.OS === 'android') {
        try {
          await this.notifications.setNotificationChannelAsync?.('default', {
            name: 'default',
            importance: this.notifications.AndroidImportance?.MAX,
          });
        } catch (error) {
          console.warn('[Push] Android notification channel setup failed (non-blocking):', error);
        }
      }

      const resolvedProjectId =
        env.expoProjectId ||
        (Constants as any)?.expoConfig?.extra?.eas?.projectId ||
        undefined;

      const token = await this.notifications.getExpoPushTokenAsync?.({
        projectId: resolvedProjectId,
      });
      const pushToken = token?.data;

      if (!pushToken) {
        console.warn('[Push] Expo push token not returned');
        return null;
      }

      this.lastExpoPushToken = pushToken;

      await notificationService.registerPushToken(pushToken, {
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        deviceName: this.getDeviceName(),
        appVersion: this.getAppVersion(),
      });

      return pushToken;
    } catch (error) {
      console.warn('Push device registration failed:', error);
      return null;
    }
  }

  async unregisterDevice() {
    try {
      if (!this.lastExpoPushToken) {
        return;
      }
      await notificationService.unregisterPushToken(this.lastExpoPushToken);
      this.lastExpoPushToken = null;
    } catch (error) {
      console.warn('[Push] Device unregistration failed (non-blocking):', error);
    }
  }

  private loadNotificationsModule(): PushModule | null {
    try {
      // Optional dependency: install expo-notifications to enable push registration.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('expo-notifications') as PushModule;
    } catch (error) {
      console.warn('expo-notifications is not installed:', error);
      return null;
    }
  }

  private getDeviceName() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const device = require('expo-device');
      return device.deviceName || device.modelName || '';
    } catch {
      return '';
    }
  }

  private getAppVersion() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const constants = require('expo-constants');
      return constants.default?.expoConfig?.version || '';
    } catch {
      return '';
    }
  }
}

export const pushNotificationService = new PushNotificationService();
