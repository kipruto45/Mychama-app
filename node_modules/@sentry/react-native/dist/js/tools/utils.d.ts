import type { MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
import type CountingSet from 'metro/src/lib/CountingSet';
export type VirtualJSOutput = {
    type: 'js/script/virtual';
    data: {
        code: string;
        lineCount: number;
        map: [];
    };
};
export type Bundle = {
    modules: Array<[id: number, code: string]>;
    post: string;
    pre: string;
};
export type SentryMetroSerializerOptionsExtras = {
    sentryBundleCallback?: (bundle: Bundle) => Bundle;
};
export type SerializedBundle = {
    code: string;
    map: string;
};
export type MetroSerializerOutput = string | SerializedBundle | Promise<string | SerializedBundle>;
export type MetroSerializer = (entryPoint: string, preModules: ReadonlyArray<Module>, graph: ReadOnlyGraph, options: SerializerOptions & SentryMetroSerializerOptionsExtras) => MetroSerializerOutput;
/**
 * Returns minified Debug ID code snippet.
 */
export declare function createDebugIdSnippet(debugId: string): string;
/**
 * Deterministically hashes a string and turns the hash into a uuid.
 *
 * https://github.com/getsentry/sentry-javascript-bundler-plugins/blob/58271f1af2ade6b3e64d393d70376ae53bc5bd2f/packages/bundler-plugin-core/src/utils.ts#L174
 */
export declare function stringToUUID(str: string): string;
/**
 * Looks for a particular string pattern (`sdbid-[debug ID]`) in the bundle
 * source and extracts the bundle's debug ID from it.
 *
 * The string pattern is injected via the debug ID injection snipped.
 *
 * https://github.com/getsentry/sentry-javascript-bundler-plugins/blob/40f918458ed449d8b3eabaf64d13c08218213f65/packages/bundler-plugin-core/src/debug-id-upload.ts#L293-L294
 */
export declare function determineDebugIdFromBundleSource(code: string): string | undefined;
export declare const createSet: () => CountingSet<string>;
/**
 * Prepends the module after default required prelude modules.
 */
export declare function prependModule(modules: readonly Module<MixedOutput>[], module: Module<VirtualJSOutput>): Module<MixedOutput>[];
/**
 * Creates a virtual JS module with the given path and code.
 */
export declare function createVirtualJSModule(modulePath: string, moduleCode: string): Module<VirtualJSOutput> & {
    setSource: (code: string) => void;
};
/**
 * Tries to load Expo config using `@expo/config` package.
 */
export declare function getExpoConfig(projectRoot: string): Partial<{
    name: string;
    version: string;
}>;
//# sourceMappingURL=utils.d.ts.map