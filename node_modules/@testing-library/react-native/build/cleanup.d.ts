type CleanUpFunction = () => void;
type CleanUpFunctionAsync = () => Promise<void>;
export default function cleanup(): void;
export declare function cleanupAsync(): Promise<void>;
export declare function addToCleanupQueue(fn: CleanUpFunction | CleanUpFunctionAsync): void;
export {};
