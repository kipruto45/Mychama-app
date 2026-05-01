import { debug } from '@sentry/core';
import * as React from 'react';
import { UIManager, View } from 'react-native';
import { isExpoGo } from '../utils/environment';
const NativeComponentRegistry = require('react-native/Libraries/NativeComponent/NativeComponentRegistry');
const MaskNativeComponentName = 'RNSentryReplayMask';
const UnmaskNativeComponentName = 'RNSentryReplayUnmask';
const warnMessage = (component) => `[SentrySessionReplay] ${component} component is not supported on the current platform. If ${component} should be supported, please ensure that the application build is up to date.`;
const warn = (component) => {
    setTimeout(() => {
        // Missing mask component could cause leaking PII, we have to ensure that the warning is visible
        // even if the app is running without debug.
        // eslint-disable-next-line no-console
        console.warn(warnMessage(component));
    }, 0);
};
const MaskFallback = (viewProps) => {
    warn('Mask');
    return React.createElement(View, Object.assign({}, viewProps));
};
const UnmaskFallback = (viewProps) => {
    warn('Unmask');
    return React.createElement(View, Object.assign({}, viewProps));
};
const hasViewManagerConfig = (nativeComponentName) => { var _a; return (_a = UIManager.hasViewManagerConfig) === null || _a === void 0 ? void 0 : _a.call(UIManager, nativeComponentName); };
const Mask = (() => {
    if (isExpoGo() || !hasViewManagerConfig(MaskNativeComponentName)) {
        debug.warn(`[SentrySessionReplay] Can't load ${MaskNativeComponentName}.`);
        return MaskFallback;
    }
    // Based on @react-native/babel-plugin-codegen output
    // https://github.com/facebook/react-native/blob/b32c6c2cc1bc566a85a883901dbf5e23b5a75b61/packages/react-native-codegen/src/generators/components/GenerateViewConfigJs.js#L139
    return NativeComponentRegistry.get(MaskNativeComponentName, () => ({
        uiViewClassName: MaskNativeComponentName,
    }));
})();
const Unmask = (() => {
    if (isExpoGo() || !hasViewManagerConfig(UnmaskNativeComponentName)) {
        debug.warn(`[SentrySessionReplay] Can't load ${UnmaskNativeComponentName}.`);
        return UnmaskFallback;
    }
    // Based on @react-native/babel-plugin-codegen output
    // https://github.com/facebook/react-native/blob/b32c6c2cc1bc566a85a883901dbf5e23b5a75b61/packages/react-native-codegen/src/generators/components/GenerateViewConfigJs.js#L139
    return NativeComponentRegistry.get(UnmaskNativeComponentName, () => ({
        uiViewClassName: UnmaskNativeComponentName,
    }));
})();
export { Mask, Unmask, MaskFallback, UnmaskFallback };
//# sourceMappingURL=CustomMask.js.map