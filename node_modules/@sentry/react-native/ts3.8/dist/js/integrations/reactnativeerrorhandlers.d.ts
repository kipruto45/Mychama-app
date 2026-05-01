import type { Integration } from '@sentry/core';
/** ReactNativeErrorHandlers Options */
interface ReactNativeErrorHandlersOptions {
    onerror: boolean;
    onunhandledrejection: boolean;
    patchGlobalPromise: boolean;
}
/** ReactNativeErrorHandlers Integration */
export declare const reactNativeErrorHandlersIntegration: (options?: Partial<ReactNativeErrorHandlersOptions>) => Integration;
export {};
//# sourceMappingURL=reactnativeerrorhandlers.d.ts.map
