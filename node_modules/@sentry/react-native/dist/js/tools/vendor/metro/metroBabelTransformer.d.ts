export interface CustomTransformOptions {
    [key: string]: unknown;
}
export type TransformProfile = 'default' | 'hermes-stable' | 'hermes-canary';
export interface BabelTransformerOptions {
    readonly customTransformOptions?: CustomTransformOptions;
    readonly dev: boolean;
    readonly enableBabelRCLookup?: boolean;
    readonly enableBabelRuntime: boolean | string;
    readonly extendsBabelConfigPath?: string;
    readonly experimentalImportSupport?: boolean;
    readonly hermesParser?: boolean;
    readonly hot: boolean;
    readonly minify: boolean;
    readonly unstable_disableES6Transforms?: boolean;
    readonly platform: string | null;
    readonly projectRoot: string;
    readonly publicPath: string;
    readonly unstable_transformProfile?: TransformProfile;
    readonly globalPrefix: string;
}
export interface BabelTransformerArgs {
    readonly filename: string;
    readonly options: BabelTransformerOptions;
    readonly plugins?: unknown;
    readonly src: string;
}
export interface BabelTransformer {
    transform: (args: BabelTransformerArgs) => {
        ast: unknown;
        metadata: unknown;
    };
    getCacheKey?: () => string;
}
//# sourceMappingURL=metroBabelTransformer.d.ts.map