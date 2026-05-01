import type { ExpoConfig } from '@expo/config-types';
export interface SentryAndroidGradlePluginOptions {
    enableAndroidGradlePlugin?: boolean;
    includeProguardMapping?: boolean;
    dexguardEnabled?: boolean;
    autoUploadNativeSymbols?: boolean;
    autoUploadProguardMapping?: boolean;
    uploadNativeSymbols?: boolean;
    includeNativeSources?: boolean;
    includeSourceContext?: boolean;
}
export declare const sentryAndroidGradlePluginVersion = "5.11.0";
/**
 * Adds the Sentry Android Gradle Plugin to the project.
 * https://docs.sentry.io/platforms/react-native/manual-setup/manual-setup/#enable-sentry-agp
 */
export declare function withSentryAndroidGradlePlugin(config: ExpoConfig, { includeProguardMapping, dexguardEnabled, autoUploadProguardMapping, uploadNativeSymbols, autoUploadNativeSymbols, includeNativeSources, includeSourceContext, }?: SentryAndroidGradlePluginOptions): ExpoConfig;
