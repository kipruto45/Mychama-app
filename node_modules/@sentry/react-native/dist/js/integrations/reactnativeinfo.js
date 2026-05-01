import { getExpoGoVersion, getExpoSdkVersion, getHermesVersion, getReactNativeVersion, isExpo, isFabricEnabled, isHermesEnabled, isTurboModuleEnabled, } from '../utils/environment';
const INTEGRATION_NAME = 'ReactNativeInfo';
/** Loads React Native context at runtime */
export const reactNativeInfoIntegration = () => {
    return {
        name: INTEGRATION_NAME,
        setupOnce: () => {
            // noop
        },
        processEvent,
    };
};
function processEvent(event, hint) {
    const reactNativeError = (hint === null || hint === void 0 ? void 0 : hint.originalException) ? hint === null || hint === void 0 ? void 0 : hint.originalException : undefined;
    const reactNativeContext = {
        turbo_module: isTurboModuleEnabled(),
        fabric: isFabricEnabled(),
        react_native_version: getReactNativeVersion(),
        expo: isExpo(),
    };
    if (isHermesEnabled()) {
        reactNativeContext.js_engine = 'hermes';
        const hermesVersion = getHermesVersion();
        if (hermesVersion) {
            reactNativeContext.hermes_version = hermesVersion;
        }
        reactNativeContext.hermes_debug_info = !isEventWithHermesBytecodeFrames(event);
    }
    else if (reactNativeError === null || reactNativeError === void 0 ? void 0 : reactNativeError.jsEngine) {
        reactNativeContext.js_engine = reactNativeError.jsEngine;
    }
    if (reactNativeContext.js_engine === 'hermes') {
        event.tags = Object.assign({ hermes: true }, event.tags);
    }
    if (reactNativeError === null || reactNativeError === void 0 ? void 0 : reactNativeError.componentStack) {
        reactNativeContext.component_stack = reactNativeError.componentStack;
    }
    const expoGoVersion = getExpoGoVersion();
    if (expoGoVersion) {
        reactNativeContext.expo_go_version = expoGoVersion;
    }
    const expoSdkVersion = getExpoSdkVersion();
    if (expoSdkVersion) {
        reactNativeContext.expo_sdk_version = expoSdkVersion;
    }
    event.contexts = Object.assign({ react_native_context: reactNativeContext }, event.contexts);
    return event;
}
/**
 * Guess if the event contains frames with Hermes bytecode
 * (thus Hermes bundle doesn't contain debug info)
 * based on the event exception/threads frames.
 *
 * This function can be relied on only if Hermes is enabled!
 *
 * Hermes bytecode position is always line 1 and column 0-based number.
 * If Hermes bundle has debug info, the bytecode frames pos are calculated
 * back to the plain bundle source code positions and line will be > 1.
 *
 * Line 1 contains start time var, it's safe to assume it won't crash.
 * The above only applies when Hermes is enabled.
 *
 * Javascript/Hermes bytecode frames have platform === undefined.
 * Native (Java, ObjC, C++) frames have platform === 'android'/'ios'/'native'.
 */
function isEventWithHermesBytecodeFrames(event) {
    var _a, _b, _c;
    for (const value of ((_a = event.exception) === null || _a === void 0 ? void 0 : _a.values) || ((_b = event.threads) === null || _b === void 0 ? void 0 : _b.values) || []) {
        for (const frame of ((_c = value.stacktrace) === null || _c === void 0 ? void 0 : _c.frames) || []) {
            // platform === undefined we assume it's javascript (only native frames use the platform attribute)
            if (frame.platform === undefined && frame.lineno === 1) {
                return true;
            }
        }
    }
    return false;
}
//# sourceMappingURL=reactnativeinfo.js.map