import type { InputConfigT, Middleware } from 'metro-config';
/**
 * Accepts Sentry formatted stack frames and
 * adds source context to the in app frames.
 */
export declare const stackFramesContextMiddleware: Middleware;
/**
 * Creates a middleware that adds source context to the Sentry formatted stack frames.
 */
export declare const createSentryMetroMiddleware: (middleware: HandleFunction) => HandleFunction;
/**
 * Adds the Sentry middleware to the Metro server config.
 */
export declare const withSentryMiddleware: (config: InputConfigT) => InputConfigT;
//# sourceMappingURL=metroMiddleware.d.ts.map