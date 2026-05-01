export declare enum ReanimatedLogLevel {
    warn = 1,
    error = 2
}
type LogData = {
    level: ReanimatedLogLevel;
    message: string;
};
type LogFunction = (data: LogData) => void;
export type LoggerConfig = {
    level?: ReanimatedLogLevel;
    strict?: boolean;
};
export type LoggerConfigInternal = {
    logFunction: LogFunction;
} & Required<LoggerConfig>;
/**
 * Current logger config getter.
 *
 * @returns The current logger configuration object.
 */
export declare function getLoggerConfig(): LoggerConfigInternal;
/**
 * Updates logger configuration.
 *
 * @param currentConfig - The current logger configuration object.
 * @param options - The new logger configuration to apply.
 *
 *   - Level: The minimum log level to display.
 *   - Strict: Whether to log warnings and errors that are not strict. Defaults to
 *       false.
 */
export declare function updateLoggerConfig(currentConfig: LoggerConfigInternal, options?: Partial<LoggerConfig>): void;
type LogOptions = {
    strict?: boolean;
};
export declare const logger: {
    warn(message: string, options?: LogOptions): void;
    error(message: string, options?: LogOptions): void;
};
export {};
//# sourceMappingURL=logger.d.ts.map