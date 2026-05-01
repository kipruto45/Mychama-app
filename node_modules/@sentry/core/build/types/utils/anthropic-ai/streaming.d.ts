import type { Span } from '../../types-hoist/span';
import type { AnthropicAiStreamingEvent } from './types';
/**
 * Instruments an async iterable stream of Anthropic events, updates the span with
 * streaming attributes and (optionally) the aggregated output text, and yields
 * each event from the input stream unchanged.
 */
export declare function instrumentStream(stream: AsyncIterable<AnthropicAiStreamingEvent>, span: Span, recordOutputs: boolean): AsyncGenerator<AnthropicAiStreamingEvent, void, unknown>;
//# sourceMappingURL=streaming.d.ts.map