import type { StackFrame as SentryStackFrame } from '@sentry/core';
import type * as ReactNative from '../vendor/react-native';
/**
 * Fetches source context for the Sentry Middleware (/__sentry/context)
 *
 * @param frame StackFrame
 * @param getDevServer function from RN to get DevServer URL
 */
export declare function fetchSourceContext(frames: SentryStackFrame[]): Promise<SentryStackFrame[]>;
/**
 * Loads and calls RN Core Devtools parseErrorStack function.
 */
export declare function parseErrorStack(errorStack: string): Array<ReactNative.StackFrame>;
/**
 * Loads and calls RN Core Devtools symbolicateStackTrace function.
 */
export declare function symbolicateStackTrace(stack: Array<ReactNative.StackFrame>, extraData?: Record<string, unknown>): Promise<ReactNative.SymbolicatedStackTrace>;
/**
 * Loads and returns the RN DevServer URL.
 */
export declare function getDevServer(): ReactNative.DevServerInfo | undefined;
//# sourceMappingURL=debugsymbolicatorutils.d.ts.map
