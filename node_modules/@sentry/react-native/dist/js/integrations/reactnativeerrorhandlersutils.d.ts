/**
 * Polyfill the global promise instance with one we can be sure that we can attach the tracking to.
 *
 * In newer RN versions >=0.63, the global promise is not the same reference as the one imported from the promise library.
 * This is due to a version mismatch between promise versions.
 * Originally we tried a solution where we would have you put a package resolution to ensure the promise instances match. However,
 * - Using a package resolution requires the you to manually troubleshoot.
 * - The package resolution fix no longer works with 0.67 on iOS Hermes.
 */
export declare function polyfillPromise(): void;
/**
 * Single source of truth for the Promise implementation we want to use.
 * This is important for verifying that the rejected promise tracing will work as expected.
 */
export declare function getPromisePolyfill(): unknown;
/**
 * Lazy require the rejection tracking module
 */
export declare function requireRejectionTracking(): {
    disable: () => void;
    enable: (arg: unknown) => void;
};
/**
 * Checks if the promise is the same one or not, if not it will warn the user
 */
export declare function checkPromiseAndWarn(): void;
//# sourceMappingURL=reactnativeerrorhandlersutils.d.ts.map