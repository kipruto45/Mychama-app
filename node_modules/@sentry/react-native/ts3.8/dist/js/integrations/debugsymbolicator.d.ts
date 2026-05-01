import type { Integration } from '@sentry/core';
/**
 * React Native Error
 */
export type ReactNativeError = Error & {
    framesToPop?: number;
    jsEngine?: string;
    preventSymbolication?: boolean;
    componentStack?: string;
};
/** Tries to symbolicate the JS stack trace on the device. */
export declare const debugSymbolicatorIntegration: () => Integration;
//# sourceMappingURL=debugsymbolicator.d.ts.map
