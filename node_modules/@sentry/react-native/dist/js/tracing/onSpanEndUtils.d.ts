import type { Client, Span } from '@sentry/core';
/**
 * Hooks on span end event to execute a callback when the span ends.
 */
export declare function onThisSpanEnd(client: Client, span: Span, callback: (span: Span) => void): void;
export declare const adjustTransactionDuration: (client: Client, span: Span, maxDurationMs: number) => void;
export declare const ignoreEmptyBackNavigation: (client: Client | undefined, span: Span | undefined) => void;
/**
 * Idle Transaction callback to only sample transactions with child spans.
 * To avoid side effects of other callbacks this should be hooked as the last callback.
 */
export declare const onlySampleIfChildSpans: (client: Client, span: Span) => void;
/**
 * Hooks on AppState change to cancel the span if the app goes background.
 */
export declare const cancelInBackground: (client: Client, span: Span) => void;
//# sourceMappingURL=onSpanEndUtils.d.ts.map