import type { Scope } from '@sentry/core';
import * as React from 'react';
import type { ReactNativeOptions, ReactNativeWrapperOptions } from './options';
/**
 * Inits the SDK and returns the final options.
 */
export declare function init(passedOptions: ReactNativeOptions): void;
/**
 * Inits the Sentry React Native SDK with automatic instrumentation and wrapped features.
 */
export declare function wrap<P extends Record<string, unknown>>(RootComponent: React.ComponentType<P>, options?: ReactNativeWrapperOptions): React.ComponentType<P>;
/**
 * If native client is available it will trigger a native crash.
 * Use this only for testing purposes.
 */
export declare function nativeCrash(): void;
/**
 * Flushes all pending events in the queue to disk.
 * Use this before applying any realtime updates such as code-push or expo updates.
 */
export declare function flush(): Promise<boolean>;
/**
 * Closes the SDK, stops sending events.
 */
export declare function close(): Promise<void>;
/**
 * Creates a new scope with and executes the given operation within.
 * The scope is automatically removed once the operation
 * finishes or throws.
 *
 * This is essentially a convenience function for:
 *
 *     pushScope();
 *     callback();
 *     popScope();
 *
 * @param callback that will be enclosed into push/popScope.
 */
export declare function withScope<T>(callback: (scope: Scope) => T): T | undefined;
/**
 * Returns if the app crashed in the last run.
 */
export declare function crashedLastRun(): Promise<boolean | null>;
//# sourceMappingURL=sdk.d.ts.map