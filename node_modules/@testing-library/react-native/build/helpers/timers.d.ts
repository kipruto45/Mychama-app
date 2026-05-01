declare function runWithRealTimers<T>(callback: () => T): T;
declare const jestFakeTimersAreEnabled: () => boolean;
declare const clearTimeoutFn: typeof clearTimeout, setImmediateFn: typeof setImmediate, setTimeoutFn: typeof setTimeout;
export { clearTimeoutFn as clearTimeout, jestFakeTimersAreEnabled, runWithRealTimers, setImmediateFn as setImmediate, setTimeoutFn as setTimeout, };
