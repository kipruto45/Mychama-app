declare module '@react-native-async-storage/async-storage' {
  export interface AsyncStorageStatic {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    mergeItem(key: string, value: string): Promise<void>;
    clear(): Promise<void>;
    getAllKeys(): Promise<readonly string[]>;
    multiGet(keys: string[]): Promise<readonly [string, string | null][]>;
    multiSet(keyValuePairs: [string, string][]): Promise<void>;
    multiRemove(keys: string[]): Promise<void>;
    multiMerge(keyValuePairs: [string, string][]): Promise<void>;
  }

  const AsyncStorage: AsyncStorageStatic;
  export default AsyncStorage;
}
