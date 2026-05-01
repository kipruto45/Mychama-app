export interface ExtendedError extends Error {
    framesToPop?: number | undefined;
    cause?: Error | undefined;
}
/**
 * Creates synthetic trace. By default pops 2 frames - `createSyntheticError` and the caller
 */
export declare function createSyntheticError(framesToPop?: number): ExtendedError;
/**
 * Returns the number of frames to pop from the stack trace.
 * @param error ExtendedError
 */
export declare function getFramesToPop(error: ExtendedError): number;
/**
 * Check if `potentialError` is an object with string stack property.
 */
export declare function isErrorLike(potentialError: unknown): potentialError is {
    stack: string;
};
//# sourceMappingURL=error.d.ts.map
