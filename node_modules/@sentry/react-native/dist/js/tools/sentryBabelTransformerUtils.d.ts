import type { BabelTransformer } from './vendor/metro/metroBabelTransformer';
export type SentryBabelTransformerOptions = {
    annotateReactComponents?: {
        ignoredComponents?: string[];
    };
};
export declare const SENTRY_DEFAULT_BABEL_TRANSFORMER_PATH = "SENTRY_DEFAULT_BABEL_TRANSFORMER_PATH";
export declare const SENTRY_BABEL_TRANSFORMER_OPTIONS = "SENTRY_BABEL_TRANSFORMER_OPTIONS";
/**
 * Sets default Babel transformer path to the environment variables.
 */
export declare function setSentryDefaultBabelTransformerPathEnv(defaultBabelTransformerPath: string): void;
/**
 * Reads default Babel transformer path from the environment variables.
 */
export declare function getSentryDefaultBabelTransformerPathEnv(): string | undefined;
/**
 * Loads default Babel transformer from `@react-native/metro-config` -> `@react-native/metro-babel-transformer`.
 */
export declare function loadDefaultBabelTransformer(): BabelTransformer;
/**
 *
 */
export declare function setSentryBabelTransformerOptions(options: SentryBabelTransformerOptions): void;
/**
 *
 */
export declare function getSentryBabelTransformerOptions(): SentryBabelTransformerOptions | undefined;
/**
 * Creates a Babel transformer with Sentry component annotation plugin.
 */
export declare function createSentryBabelTransformer(): BabelTransformer;
//# sourceMappingURL=sentryBabelTransformerUtils.d.ts.map