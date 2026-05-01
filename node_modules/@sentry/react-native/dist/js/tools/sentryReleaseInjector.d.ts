import type { MixedOutput, Module, ReadOnlyGraph } from 'metro';
/**
 * Adds Sentry Release constants to the bundle.
 */
export declare const unstableReleaseConstantsPlugin: (projectRoot: string) => ({ graph, premodules }: {
    graph: ReadOnlyGraph<MixedOutput>;
    premodules: Module[];
    debugId?: string | undefined;
}) => Module[];
//# sourceMappingURL=sentryReleaseInjector.d.ts.map