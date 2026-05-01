import type { WorkletFunction, WorkletRuntime } from './workletTypes';
/**
 * Lets you create a new JS runtime which can be used to run worklets possibly
 * on different threads than JS or UI thread.
 *
 * @param config - Runtime configuration object - {@link WorkletRuntimeConfig}.
 * @returns WorkletRuntime which is a
 *   `jsi::HostObject<worklets::WorkletRuntime>` - {@link WorkletRuntime}
 * @see https://docs.swmansion.com/react-native-worklets/docs/threading/createWorkletRuntime/
 */
export declare function createWorkletRuntime(config?: WorkletRuntimeConfig): WorkletRuntime;
/**
 * @deprecated Please use the new config object signature instead:
 *   `createWorkletRuntime({ name, initializer })`
 *
 *   Lets you create a new JS runtime which can be used to run worklets possibly
 *   on different threads than JS or UI thread.
 * @param name - A name used to identify the runtime which will appear in
 *   devices list in Chrome DevTools.
 * @param initializer - An optional worklet that will be run synchronously on
 *   the same thread immediately after the runtime is created.
 * @returns WorkletRuntime which is a
 *   `jsi::HostObject<worklets::WorkletRuntime>` - {@link WorkletRuntime}
 * @see https://docs.swmansion.com/react-native-worklets/docs/threading/createWorkletRuntime/
 */
export declare function createWorkletRuntime(name?: string, initializer?: () => void): WorkletRuntime;
export declare function runOnRuntime<Args extends unknown[], ReturnValue>(workletRuntime: WorkletRuntime, worklet: (...args: Args) => ReturnValue): WorkletFunction<Args, ReturnValue>;
/** Configuration object for creating a worklet runtime. */
export type WorkletRuntimeConfig = {
    /** The name of the worklet runtime. */
    name?: string;
    /**
     * A worklet that will be run immediately after the runtime is created and
     * before any other worklets.
     */
    initializer?: () => void;
    /**
     * Time interval in milliseconds between polling of frame callbacks scheduled
     * by requestAnimationFrame. If not specified, it defaults to 16 ms.
     */
    animationQueuePollingRate?: number;
    /**
     * Determines whether to enable the default Event Loop or not. The Event Loop
     * provides implementations for `setTimeout`, `setImmediate`, `setInterval`,
     * `requestAnimationFrame`, `queueMicrotask`, `clearTimeout`, `clearInterval`,
     * `clearImmediate`, and `cancelAnimationFrame` methods. If not specified, it
     * defaults to `true`.
     */
    enableEventLoop?: true;
} & ({
    /**
     * If true, the runtime will use the default queue implementation for
     * scheduling worklets. Defaults to true.
     */
    useDefaultQueue?: true;
    /**
     * An optional custom queue to be used for scheduling worklets.
     *
     * The queue has to implement the C++ `AsyncQueue` interface from
     * `<worklets/Public/AsyncQueue.h>`.
     */
    customQueue?: never;
} | {
    /**
     * If true, the runtime will use the default queue implementation for
     * scheduling worklets. Defaults to true.
     */
    useDefaultQueue: false;
    /**
     * An optional custom queue to be used for scheduling worklets.
     *
     * The queue has to implement the C++ `AsyncQueue` interface from
     * `<worklets/Public/AsyncQueue.h>`.
     */
    customQueue?: object;
});
//# sourceMappingURL=runtimes.d.ts.map