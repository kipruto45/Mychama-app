import type { Integration } from '@sentry/core';
export declare const MOBILE_REPLAY_INTEGRATION_NAME = "MobileReplay";
export interface MobileReplayOptions {
    /**
     * Mask all text in recordings
     *
     * @default true
     */
    maskAllText?: boolean;
    /**
     * Mask all images in recordings
     *
     * @default true
     */
    maskAllImages?: boolean;
    /**
     * Mask all vector graphics in recordings
     * Supports `react-native-svg`
     *
     * @default true
     */
    maskAllVectors?: boolean;
    /**
     * Enables the up to 5x faster experimental view renderer used by the Session Replay integration on iOS.
     *
     * Enabling this flag will reduce the amount of time it takes to render each frame of the session replay on the main thread, therefore reducing
     * interruptions and visual lag.
     *
     * - Experiment: This is an experimental feature and is therefore disabled by default.
     *
     * @deprecated Use `enableViewRendererV2` instead.
     */
    enableExperimentalViewRenderer?: boolean;
    /**
     * Enables up to 5x faster new view renderer used by the Session Replay integration on iOS.
     *
     * Enabling this flag will reduce the amount of time it takes to render each frame of the session replay on the main thread, therefore reducing
     * interruptions and visual lag. [Our benchmarks](https://github.com/getsentry/sentry-cocoa/pull/4940) have shown a significant improvement of
     * **up to 4-5x faster rendering** (reducing `~160ms` to `~36ms` per frame) on older devices.
     *
     * - Experiment: In case you are noticing issues with the new view renderer, please report the issue on [GitHub](https://github.com/getsentry/sentry-cocoa).
     *               Eventually, we will remove this feature flag and use the new view renderer by default.
     *
     * @default true
     */
    enableViewRendererV2?: boolean;
    /**
     * Enables up to 5x faster but incomplete view rendering used by the Session Replay integration on iOS.
     *
     * Enabling this flag will reduce the amount of time it takes to render each frame of the session replay on the main thread, therefore reducing
     * interruptions and visual lag.
     *
     * - Note: This flag can only be used together with `enableExperimentalViewRenderer` with up to 20% faster render times.
     * - Experiment: This is an experimental feature and is therefore disabled by default.
     *
     * @default false
     */
    enableFastViewRendering?: boolean;
}
type MobileReplayIntegration = Integration & {
    options: Required<MobileReplayOptions>;
    getReplayId: () => string | null;
};
/**
 * The Mobile Replay Integration, let's you adjust the default mobile replay options.
 * To be passed to `Sentry.init` with `replaysOnErrorSampleRate` or `replaysSessionSampleRate`.
 *
 * ```javascript
 * Sentry.init({
 *  replaysOnErrorSampleRate: 1.0,
 *  replaysSessionSampleRate: 1.0,
 *  integrations: [mobileReplayIntegration({
 *    // Adjust the default options
 *  })],
 * });
 * ```
 *
 * @experimental
 */
export declare const mobileReplayIntegration: (initOptions?: MobileReplayOptions) => MobileReplayIntegration;
export {};
//# sourceMappingURL=mobilereplay.d.ts.map