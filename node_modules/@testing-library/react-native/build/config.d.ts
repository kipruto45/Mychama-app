import type { DebugOptions } from './helpers/debug';
/**
 * Global configuration options for React Native Testing Library.
 */
export type Config = {
    /** Default timeout, in ms, for `waitFor` and `findBy*` queries. */
    asyncUtilTimeout: number;
    /** Default value for `includeHiddenElements` query option. */
    defaultIncludeHiddenElements: boolean;
    /** Default options for `debug` helper. */
    defaultDebugOptions?: Partial<DebugOptions>;
    /**
     * Set to `false` to disable concurrent rendering.
     * Otherwise `render` will default to concurrent rendering.
     */
    concurrentRoot: boolean;
};
export type ConfigAliasOptions = {
    /** RTL-compatibility alias to `defaultIncludeHiddenElements` */
    defaultHidden: boolean;
};
/**
 * Configure global options for React Native Testing Library.
 */
export declare function configure(options: Partial<Config & ConfigAliasOptions>): void;
export declare function resetToDefaults(): void;
export declare function getConfig(): {
    /** Default timeout, in ms, for `waitFor` and `findBy*` queries. */
    asyncUtilTimeout: number;
    /** Default value for `includeHiddenElements` query option. */
    defaultIncludeHiddenElements: boolean;
    /** Default options for `debug` helper. */
    defaultDebugOptions?: Partial<DebugOptions>;
    /**
     * Set to `false` to disable concurrent rendering.
     * Otherwise `render` will default to concurrent rendering.
     */
    concurrentRoot: boolean;
};
