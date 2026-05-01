import { Platform } from 'react-native';
import { RN_GLOBAL_OBJ } from '../utils/worldwide';
import { getExpoConstants, getExpoGo } from './expomodules';
import { ReactNativeLibraries } from './rnlibraries';
/** Checks if the React Native Hermes engine is running */
export function isHermesEnabled() {
    return !!RN_GLOBAL_OBJ.HermesInternal;
}
/** Checks if the React Native TurboModules are enabled */
export function isTurboModuleEnabled() {
    // Reference: https://github.com/facebook/react-native/blob/641a79dc5137b69a3c0813413b9fb82d0b9df783/packages/react-native/src/private/featureflags/ReactNativeFeatureFlagsBase.js#L110
    return RN_GLOBAL_OBJ.RN$Bridgeless === true || RN_GLOBAL_OBJ.__turboModuleProxy != null;
}
/** Checks if the React Native Fabric renderer is running */
export function isFabricEnabled() {
    return RN_GLOBAL_OBJ.nativeFabricUIManager != null;
}
/** Returns React Native Version as semver string */
export function getReactNativeVersion() {
    if (!ReactNativeLibraries.ReactNativeVersion) {
        return undefined;
    }
    const RNV = ReactNativeLibraries.ReactNativeVersion.version;
    return `${RNV.major}.${RNV.minor}.${RNV.patch}${RNV.prerelease != null ? `-${RNV.prerelease}` : ''}`;
}
/** Checks if Expo is present in the runtime */
export function isExpo() {
    return RN_GLOBAL_OBJ.expo != null;
}
/** Check if JS runs in Expo Go */
export function isExpoGo() {
    const expoGo = getExpoGo();
    return !!expoGo;
}
/** Check Expo Go version if available */
export function getExpoGoVersion() {
    const expoConstants = getExpoConstants();
    return typeof (expoConstants === null || expoConstants === void 0 ? void 0 : expoConstants.expoVersion) === 'string' ? expoConstants.expoVersion : undefined;
}
/** Returns Expo SDK version if available */
export function getExpoSdkVersion() {
    var _a;
    const expoConstants = getExpoConstants();
    const [, expoSdkVersion] = typeof ((_a = expoConstants === null || expoConstants === void 0 ? void 0 : expoConstants.manifest) === null || _a === void 0 ? void 0 : _a.runtimeVersion) === 'string' ? expoConstants.manifest.runtimeVersion.split(':') : [];
    return expoSdkVersion;
}
/** Checks if the current platform is web */
export function isWeb() {
    return Platform.OS === 'web';
}
/** Checks if the current platform is not web */
export function notWeb() {
    return Platform.OS !== 'web';
}
/** Checks if the current platform is supported mobile platform (iOS or Android) */
export function isMobileOs() {
    return Platform.OS === 'ios' || Platform.OS === 'android';
}
/** Checks if the current platform is not supported mobile platform (iOS or Android) */
export function notMobileOs() {
    return !isMobileOs();
}
/** Returns Hermes Version if hermes is present in the runtime */
export function getHermesVersion() {
    var _a, _b;
    return (_b = (_a = RN_GLOBAL_OBJ.HermesInternal) === null || _a === void 0 ? void 0 : _a.getRuntimeProperties) === null || _b === void 0 ? void 0 : _b.call(_a)['OSS Release Version'];
}
/** Returns default environment based on __DEV__ */
export function getDefaultEnvironment() {
    return typeof __DEV__ !== 'undefined' && __DEV__ ? 'development' : 'production';
}
/** Check if SDK runs in Metro Dev Server side */
export function isRunningInMetroDevServer() {
    var _a;
    if (typeof RN_GLOBAL_OBJ.process !== 'undefined' &&
        ((_a = RN_GLOBAL_OBJ.process.env) === null || _a === void 0 ? void 0 : _a.___SENTRY_METRO_DEV_SERVER___) === 'true') {
        return true;
    }
    return false;
}
//# sourceMappingURL=environment.js.map