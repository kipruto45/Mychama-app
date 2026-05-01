import type { Client, Scope, Span, SpanJSON, StartSpanOptions } from '@sentry/core';
export declare const DEFAULT_NAVIGATION_SPAN_NAME = "Route Change";
export declare const defaultIdleOptions: {
    /**
     * The time that has to pass without any span being created.
     * If this time is exceeded, the idle span will finish.
     *
     * @default 1_000 (ms)
     */
    finalTimeout: number;
    /**
     * The max. time an idle span may run.
     * If this time is exceeded, the idle span will finish no matter what.
     *
     * @default 60_0000 (ms)
     */
    idleTimeout: number;
};
export declare const startIdleNavigationSpan: (startSpanOption: StartSpanOptions, { finalTimeout, idleTimeout, }?: Partial<typeof defaultIdleOptions>) => Span | undefined;
/**
 * Starts an idle span from `@sentry/core` with React Native application
 * context awareness.
 *
 * - Span will be started with new propagation context.
 * - Span will be canceled if the app goes to background.
 */
export declare const startIdleSpan: (startSpanOption: StartSpanOptions, { finalTimeout, idleTimeout }: {
    finalTimeout: number | undefined;
    idleTimeout: number | undefined;
}) => Span;
/**
 * Returns the default options for the idle navigation span.
 */
export declare function getDefaultIdleNavigationSpanOptions(): StartSpanOptions;
/**
 * Checks if the span is a Sentry User Interaction span.
 */
export declare function isSentryInteractionSpan(span: Span): boolean;
export declare const SCOPE_SPAN_FIELD = "_sentrySpan";
export type ScopeWithMaybeSpan = Scope & {
    [SCOPE_SPAN_FIELD]?: Span;
};
/**
 * Removes the active span from the scope.
 */
export declare function clearActiveSpanFromScope(scope: ScopeWithMaybeSpan): void;
/**
 * Ensures that all created spans have an operation name.
 */
export declare function addDefaultOpForSpanFrom(client: Client): void;
export declare const SPAN_THREAD_NAME = "thread.name";
export declare const SPAN_THREAD_NAME_MAIN = "main";
export declare const SPAN_THREAD_NAME_JAVASCRIPT = "javascript";
/**
 * Adds Javascript thread info to spans.
 * Ref: https://reactnative.dev/architecture/threading-model
 */
export declare function addThreadInfoToSpan(client: Client): void;
/**
 * Sets the Main thread info to the span.
 */
export declare function setMainThreadInfo(spanJSON: SpanJSON): SpanJSON;
//# sourceMappingURL=span.d.ts.map