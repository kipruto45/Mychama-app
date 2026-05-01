export declare function writeSentryPropertiesTo(filepath: string, sentryProperties: string): void;
declare const sdkPackage: {
    name: string;
    version: string;
};
declare const SDK_PACKAGE_NAME: string;
export declare function warnOnce(message: string): void;
export declare function logPrefix(): string;
/**
 * The same as `chalk.yellow`
 * This code is part of the SDK, we don't want to introduce a dependency on `chalk` just for this.
 */
export declare function yellow(message: string): string;
/**
 * The same as `chalk.bold`
 * This code is part of the SDK, we don't want to introduce a dependency on `chalk` just for this.
 */
export declare function bold(message: string): string;
export { sdkPackage, SDK_PACKAGE_NAME };
