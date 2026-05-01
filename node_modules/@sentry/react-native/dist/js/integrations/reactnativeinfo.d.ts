import type { Context, Integration } from '@sentry/core';
export interface ReactNativeContext extends Context {
    js_engine?: string;
    turbo_module: boolean;
    fabric: boolean;
    expo: boolean;
    hermes_version?: string;
    react_native_version?: string;
    component_stack?: string;
    hermes_debug_info?: boolean;
    expo_go_version?: string;
    expo_sdk_version?: string;
}
/** Loads React Native context at runtime */
export declare const reactNativeInfoIntegration: () => Integration;
//# sourceMappingURL=reactnativeinfo.d.ts.map