import { captureException } from '@sentry/core';
import { NATIVE } from '../wrapper';
// This is a placeholder to match the example code with what Sentry SDK users would see.
const Sentry = {
    captureException,
    nativeCrash: () => {
        NATIVE.nativeCrash();
    },
};
/**
 * Example of error handling with Sentry integration.
 */
export const tryCatchExample = () => {
    try {
        // If you see the line below highlighted the source maps are working correctly.
        throw new Error('This is a test caught error.');
    }
    catch (e) {
        Sentry.captureException(e);
    }
};
/**
 * Example of an uncaught error causing a crash from JS.
 */
export const uncaughtErrorExample = () => {
    // If you see the line below highlighted the source maps are working correctly.
    throw new Error('This is a test uncaught error.');
};
/**
 * Example of a native crash.
 */
export const nativeCrashExample = () => {
    Sentry.nativeCrash();
};
//# sourceMappingURL=examples.js.map