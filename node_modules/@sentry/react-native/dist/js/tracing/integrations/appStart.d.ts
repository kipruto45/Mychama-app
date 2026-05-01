import type { Integration } from '@sentry/core';
import type { NativeFramesResponse } from '../../NativeRNSentry';
export type AppStartIntegration = Integration & {
    captureStandaloneAppStart: () => Promise<void>;
};
interface AppStartEndData {
    timestampMs: number;
    endFrames: NativeFramesResponse | null;
}
/**
 * Records the application start end.
 * Used automatically by `Sentry.wrap` and `Sentry.ReactNativeProfiler`.
 */
export declare function captureAppStart(): Promise<void>;
/**
 * For internal use only.
 *
 * @private
 */
export declare function _captureAppStart({ isManual }: {
    isManual: boolean;
}): Promise<void>;
/**
 * Sets the root component first constructor call timestamp.
 * Used automatically by `Sentry.wrap` and `Sentry.ReactNativeProfiler`.
 */
export declare function setRootComponentCreationTimestampMs(timestampMs: number): void;
/**
 * For internal use only.
 *
 * @private
 */
export declare function _setRootComponentCreationTimestampMs(timestampMs: number): void;
/**
 * For internal use only.
 *
 * @private
 */
export declare const _setAppStartEndData: (data: AppStartEndData) => void;
/**
 * For testing purposes only.
 *
 * @private
 */
export declare function _clearRootComponentCreationTimestampMs(): void;
/**
 * Adds AppStart spans from the native layer to the transaction event.
 */
export declare const appStartIntegration: ({ standalone, }?: {
    /**
     * Should the integration send App Start as a standalone root span (transaction)?
     * If false, App Start will be added as a child span to the first transaction.
     *
     * @default false
     */
    standalone?: boolean | undefined;
}) => AppStartIntegration;
export {};
//# sourceMappingURL=appStart.d.ts.map