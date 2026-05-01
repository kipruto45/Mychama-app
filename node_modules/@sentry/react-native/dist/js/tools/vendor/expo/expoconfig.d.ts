import type { MixedOutput, Module, ReadOnlyGraph } from 'metro';
export interface DefaultConfigOptions {
    /** @deprecated */
    mode?: 'exotic';
    /**
     * **Experimental:** Enable CSS support for Metro web, and shim on native.
     *
     * This is an experimental feature and may change in the future. The underlying implementation
     * is subject to change, and native support for CSS Modules may be added in the future during a non-major SDK release.
     */
    isCSSEnabled?: boolean;
    /**
     * **Experimental:** Modify premodules before a code asset is serialized
     *
     * This is an experimental feature and may change in the future. The underlying implementation
     * is subject to change.
     */
    unstable_beforeAssetSerializationPlugins?: ((serializationInput: {
        graph: ReadOnlyGraph<MixedOutput>;
        premodules: Module[];
        debugId?: string;
    }) => Module[])[];
}
//# sourceMappingURL=expoconfig.d.ts.map