import type { Client, Integration, StartSpanOptions } from '@sentry/core';
export declare const INTEGRATION_NAME = "ReactNativeTracing";
export interface ReactNativeTracingOptions {
    /**
     * The time that has to pass without any span being created.
     * If this time is exceeded, the idle span will finish.
     *
     * @default 1_000 (ms)
     */
    idleTimeoutMs?: number;
    /**
     * The max. time an idle span may run.
     * If this time is exceeded, the idle span will finish no matter what.
     *
     * @default 60_0000 (ms)
     */
    finalTimeoutMs?: number;
    /**
     * Flag to disable patching all together for fetch requests.
     *
     * Fetch in React Native is a `whatwg-fetch` polyfill which uses XHR under the hood.
     * This causes duplicates when both `traceFetch` and `traceXHR` are enabled at the same time.
     *
     * @default false
     */
    traceFetch: boolean;
    /**
     * Flag to disable patching all together for xhr requests.
     *
     * @default true
     */
    traceXHR: boolean;
    /**
     * If true, Sentry will capture http timings and add them to the corresponding http spans.
     *
     * @default true
     */
    enableHTTPTimings: boolean;
    /**
     * A callback which is called before a span for a navigation is started.
     * It receives the options passed to `startSpan`, and expects to return an updated options object.
     */
    beforeStartSpan?: (options: StartSpanOptions) => StartSpanOptions;
    /**
     * This function will be called before creating a span for a request with the given url.
     * Return false if you don't want a span for the given url.
     *
     * @default (url: string) => true
     */
    shouldCreateSpanForRequest?(this: void, url: string): boolean;
}
export declare const defaultReactNativeTracingOptions: ReactNativeTracingOptions;
export type ReactNativeTracingState = {
    currentRoute: string | undefined;
};
export declare const reactNativeTracingIntegration: (options?: Partial<ReactNativeTracingOptions>) => Integration & {
    options: ReactNativeTracingOptions;
    state: ReactNativeTracingState;
    setCurrentRoute: (route: string) => void;
};
export type ReactNativeTracingIntegration = ReturnType<typeof reactNativeTracingIntegration>;
/**
 * Returns the current React Native Tracing integration.
 */
export declare function getCurrentReactNativeTracingIntegration(): ReactNativeTracingIntegration | undefined;
/**
 * Returns React Native Tracing integration of given client.
 */
export declare function getReactNativeTracingIntegration(client: Client): ReactNativeTracingIntegration | undefined;
//# sourceMappingURL=reactnativetracing.d.ts.map