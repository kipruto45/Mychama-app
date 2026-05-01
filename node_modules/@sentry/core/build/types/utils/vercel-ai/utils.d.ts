import type { TraceContext } from '../../types-hoist/context';
import type { Span, SpanJSON } from '../../types-hoist/span';
import type { TokenSummary } from './types';
/**
 * Accumulates token data from a span to its parent in the token accumulator map.
 * This function extracts token usage from the current span and adds it to the
 * accumulated totals for its parent span.
 */
export declare function accumulateTokensForParent(span: SpanJSON, tokenAccumulator: Map<string, TokenSummary>): void;
/**
 * Applies accumulated token data to the `gen_ai.invoke_agent` span.
 * Only immediate children of the `gen_ai.invoke_agent` span are considered,
 * since aggregation will automatically occur for each parent span.
 */
export declare function applyAccumulatedTokens(spanOrTrace: SpanJSON | TraceContext, tokenAccumulator: Map<string, TokenSummary>): void;
/**
 * Get the span associated with a tool call ID
 */
export declare function _INTERNAL_getSpanForToolCallId(toolCallId: string): Span | undefined;
/**
 * Clean up the span mapping for a tool call ID
 */
export declare function _INTERNAL_cleanupToolCallSpan(toolCallId: string): void;
//# sourceMappingURL=utils.d.ts.map