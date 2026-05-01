import type { Module, ReadOnlyGraph } from 'metro';
import type { MetroSerializer } from '../../utils';
/**
 * This function ensures that modules in source maps are sorted in the same
 * order as in a plain JS bundle.
 *
 * https://github.com/facebook/metro/blob/9b85f83c9cc837d8cd897aa7723be7da5b296067/packages/metro/src/Server.js#L984
 */
export declare const getSortedModules: (graph: ReadOnlyGraph, { createModuleId, }: {
    createModuleId: (file: string) => number;
}) => readonly Module[];
/**
 * Creates the default Metro plain bundle serializer.
 * Because Metro exports only the intermediate serializer functions, we need to
 * assemble the final serializer ourselves. We have to work with the modules the same as Metro does
 * to avoid unexpected changes in the final bundle.
 *
 * This is used when the user does not provide a custom serializer.
 *
 * https://github.com/facebook/metro/blob/9b85f83c9cc837d8cd897aa7723be7da5b296067/packages/metro/src/Server.js#L244-L277
 */
export declare const createDefaultMetroSerializer: () => MetroSerializer;
//# sourceMappingURL=utils.d.ts.map