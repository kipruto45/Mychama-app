/**
 * Collects JS modules from source paths.
 */
export default class ModulesCollector {
    /** Collect method */
    static collect(sources: unknown[], modulesPaths: string[]): Record<string, string>;
    /**
     * Runs collection of modules.
     */
    static run({ sourceMapPath, outputModulesPath, modulesPaths, collect, }: Partial<{
        sourceMapPath: string;
        outputModulesPath: string;
        modulesPaths: string[];
        collect: (sources: unknown[], modulesPaths: string[]) => Record<string, string>;
    }>): void;
}
//# sourceMappingURL=ModulesCollector.d.ts.map