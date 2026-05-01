/** Checks if the React Native Hermes engine is running */
export declare function isHermesEnabled(): boolean;
/** Checks if the React Native TurboModules are enabled */
export declare function isTurboModuleEnabled(): boolean;
/** Checks if the React Native Fabric renderer is running */
export declare function isFabricEnabled(): boolean;
/** Returns React Native Version as semver string */
export declare function getReactNativeVersion(): string | undefined;
/** Checks if Expo is present in the runtime */
export declare function isExpo(): boolean;
/** Check if JS runs in Expo Go */
export declare function isExpoGo(): boolean;
/** Check Expo Go version if available */
export declare function getExpoGoVersion(): string | undefined;
/** Returns Expo SDK version if available */
export declare function getExpoSdkVersion(): string | undefined;
/** Checks if the current platform is web */
export declare function isWeb(): boolean;
/** Checks if the current platform is not web */
export declare function notWeb(): boolean;
/** Checks if the current platform is supported mobile platform (iOS or Android) */
export declare function isMobileOs(): boolean;
/** Checks if the current platform is not supported mobile platform (iOS or Android) */
export declare function notMobileOs(): boolean;
/** Returns Hermes Version if hermes is present in the runtime */
export declare function getHermesVersion(): string | undefined;
/** Returns default environment based on __DEV__ */
export declare function getDefaultEnvironment(): 'development' | 'production';
/** Check if SDK runs in Metro Dev Server side */
export declare function isRunningInMetroDevServer(): boolean;
//# sourceMappingURL=environment.d.ts.map
