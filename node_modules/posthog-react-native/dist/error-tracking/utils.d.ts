type ExceptionHook = (error: unknown, isFatal: boolean, syntheticException?: Error) => void;
export declare function trackUnhandledRejections(tracker: ExceptionHook): void;
export declare function trackUncaughtExceptions(tracker: ExceptionHook): void;
export declare function trackConsole(level: string, tracker: ExceptionHook): void;
export {};
