import type { Span, TransactionEvent } from '@sentry/core';
import { SentrySpan } from '@sentry/core';
/**
 *
 */
export declare function isSentrySpan(span: Span): span is SentrySpan;
/**
 *
 */
export declare function isRootSpan(span: Span): boolean;
/**
 *
 */
export declare function setEndTimeValue(span: Span, endTimestamp: number): void;
/**
 *
 */
export declare function convertSpanToTransaction(span: Span): TransactionEvent | undefined;
//# sourceMappingURL=span.d.ts.map
