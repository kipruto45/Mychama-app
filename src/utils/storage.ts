import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

type StorageValue = string | null;
type WebStorage = Storage | null;

const getWebStorage = (): WebStorage => {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }

  return globalThis.localStorage;
};

const canUseWebStorage =
  Platform.OS === 'web' &&
  getWebStorage() !== null;

const webStorage = {
  async setItem(key: string, value: string): Promise<void> {
    getWebStorage()?.setItem(key, value);
  },

  async getItem(key: string): Promise<StorageValue> {
    return getWebStorage()?.getItem(key) ?? null;
  },

  async removeItem(key: string): Promise<void> {
    getWebStorage()?.removeItem(key);
  },
};

const secureStorage = {
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  getItem: (key: string) => SecureStore.getItemAsync(key),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const baseStorage = canUseWebStorage ? webStorage : secureStorage;

export const storage = {
  async setItem(key: string, value: string): Promise<void> {
    await baseStorage.setItem(key, value);
  },

  async getItem(key: string): Promise<StorageValue> {
    return await baseStorage.getItem(key);
  },

  async removeItem(key: string): Promise<void> {
    await baseStorage.removeItem(key);
  },

  async setJSON(key: string, value: unknown): Promise<void> {
    await baseStorage.setItem(key, JSON.stringify(value));
  },

  async getJSON<T>(key: string): Promise<T | null> {
    const value = await baseStorage.getItem(key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    }
    return null;
  },

  async clear(): Promise<void> {
    const keys = ['access_token', 'refresh_token', 'user_data'];
    for (const key of keys) {
      await baseStorage.removeItem(key);
    }
  },
};

export const zustandStorage = {
  setItem: (key: string, value: string) => baseStorage.setItem(key, value),
  getItem: (key: string) => baseStorage.getItem(key),
  removeItem: (key: string) => baseStorage.removeItem(key),
};
