import type { ReactTestRendererJSON } from 'react-test-renderer';
import type { FormatElementOptions } from './format-element';
export type DebugOptions = {
    message?: string;
} & FormatElementOptions;
/**
 * Log pretty-printed deep test component instance
 */
export declare function debug(instance: ReactTestRendererJSON | ReactTestRendererJSON[], { message, ...formatOptions }?: DebugOptions): void;
