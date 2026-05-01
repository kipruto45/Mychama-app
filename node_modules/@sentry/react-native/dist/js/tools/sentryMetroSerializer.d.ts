import type { MixedOutput, Module, ReadOnlyGraph } from 'metro';
import type { MetroSerializer } from './utils';
/**
 * Adds Sentry Debug ID polyfill module to the bundle.
 */
export declare function unstableBeforeAssetSerializationDebugIdPlugin({ premodules, debugId, }: {
    graph: ReadOnlyGraph<MixedOutput>;
    premodules: Module[];
    debugId?: string;
}): Module[];
/**
 * Creates a Metro serializer that adds Debug ID module to the plain bundle.
 * The Debug ID module is a virtual module that provides a debug ID in runtime.
 *
 * RAM Bundles do not support custom serializers.
 */
export declare const createSentryMetroSerializer: (customSerializer?: MetroSerializer) => MetroSerializer;
//# sourceMappingURL=sentryMetroSerializer.d.ts.map