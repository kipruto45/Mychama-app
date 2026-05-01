import type { MetroConfig } from 'metro';
import type { DefaultConfigOptions } from './vendor/expo/expoconfig';
export * from './sentryMetroSerializer';
export interface SentryMetroConfigOptions {
    /**
     * Annotates React components with Sentry data.
     * @default false
     */
    annotateReactComponents?: boolean | {
        ignoredComponents?: string[];
    };
    /**
     * Adds the Sentry replay package for web.
     * @default true
     */
    includeWebReplay?: boolean;
    /**
     * Add Sentry Metro Server Middleware which
     * enables the app to fetch stack frames source context.
     * @default true
     */
    enableSourceContextInDevelopment?: boolean;
}
export interface SentryExpoConfigOptions {
    /**
     * Pass a custom `getDefaultConfig` function to override the default Expo configuration getter.
     */
    getDefaultConfig?: typeof getSentryExpoConfig;
    /**
     * For Expo Web, inject `release` and `version` options from `app.json`, the Expo Application Config.
     *
     * @default true
     */
    injectReleaseForWeb?: boolean;
}
/**
 * Adds Sentry to the Metro config.
 *
 * Adds Debug ID to the output bundle and source maps.
 * Collapses Sentry frames from the stack trace view in LogBox.
 */
export declare function withSentryConfig(config: MetroConfig, { annotateReactComponents, includeWebReplay, enableSourceContextInDevelopment, }?: SentryMetroConfigOptions): MetroConfig;
/**
 * This function returns Default Expo configuration with Sentry plugins.
 */
export declare function getSentryExpoConfig(projectRoot: string, options?: DefaultConfigOptions & SentryExpoConfigOptions & SentryMetroConfigOptions): MetroConfig;
/**
 * Adds Sentry Babel transformer to the Metro config.
 */
export declare function withSentryBabelTransformer(config: MetroConfig, annotateReactComponents: true | {
    ignoredComponents?: string[];
}): MetroConfig;
/**
 * Includes `@sentry/replay` packages based on the `includeWebReplay` flag and current bundle `platform`.
 */
export declare function withSentryResolver(config: MetroConfig, includeWebReplay: boolean | undefined): MetroConfig;
/**
 * Collapses Sentry internal frames from the stack trace view in LogBox.
 */
export declare function withSentryFramesCollapsed(config: MetroConfig): MetroConfig;
//# sourceMappingURL=metroconfig.d.ts.map