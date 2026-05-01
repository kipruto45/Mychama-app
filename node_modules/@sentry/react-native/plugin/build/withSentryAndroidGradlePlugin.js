"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withSentryAndroidGradlePlugin = exports.sentryAndroidGradlePluginVersion = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const utils_1 = require("./utils");
exports.sentryAndroidGradlePluginVersion = '5.11.0';
/**
 * Adds the Sentry Android Gradle Plugin to the project.
 * https://docs.sentry.io/platforms/react-native/manual-setup/manual-setup/#enable-sentry-agp
 */
function withSentryAndroidGradlePlugin(config, { includeProguardMapping = true, dexguardEnabled = false, autoUploadProguardMapping = true, uploadNativeSymbols = true, autoUploadNativeSymbols = true, includeNativeSources = true, includeSourceContext = false, } = {}) {
    // Modify android/build.gradle
    const withSentryProjectBuildGradle = (config) => {
        return (0, config_plugins_1.withProjectBuildGradle)(config, projectBuildGradle => {
            if (!projectBuildGradle.modResults?.contents) {
                (0, utils_1.warnOnce)('android/build.gradle content is missing or undefined.');
                return projectBuildGradle;
            }
            if (projectBuildGradle.modResults.language !== 'groovy') {
                (0, utils_1.warnOnce)('Cannot configure Sentry in android/build.gradle because it is not in Groovy.');
                return projectBuildGradle;
            }
            const dependency = `classpath("io.sentry:sentry-android-gradle-plugin:${exports.sentryAndroidGradlePluginVersion}")`;
            if (projectBuildGradle.modResults.contents.includes(dependency)) {
                (0, utils_1.warnOnce)('sentry-android-gradle-plugin dependency in already in android/build.gradle.');
                return projectBuildGradle;
            }
            try {
                const updatedContents = projectBuildGradle.modResults.contents.replace(/dependencies\s*{/, `dependencies {\n        ${dependency}`);
                if (updatedContents === projectBuildGradle.modResults.contents) {
                    (0, utils_1.warnOnce)('Failed to inject the dependency. Could not find `dependencies` in build.gradle.');
                }
                else {
                    projectBuildGradle.modResults.contents = updatedContents;
                }
            }
            catch (error) {
                (0, utils_1.warnOnce)('An error occurred while trying to modify build.gradle');
            }
            return projectBuildGradle;
        });
    };
    // Modify android/app/build.gradle
    const withSentryAppBuildGradle = (config) => {
        return (0, config_plugins_1.withAppBuildGradle)(config, appBuildGradle => {
            if (appBuildGradle.modResults.language !== 'groovy') {
                (0, utils_1.warnOnce)('Cannot configure Sentry in android/app/build.gradle because it is not in Groovy.');
                return appBuildGradle;
            }
            const sentryPlugin = 'apply plugin: "io.sentry.android.gradle"';
            const sentryConfig = `
  sentry {
      autoUploadProguardMapping = ${autoUploadProguardMapping ? 'shouldSentryAutoUpload()' : 'false'}
      includeProguardMapping = ${includeProguardMapping}
      dexguardEnabled = ${dexguardEnabled}
      uploadNativeSymbols = ${uploadNativeSymbols ? 'shouldSentryAutoUpload()' : 'false'}
      autoUploadNativeSymbols = ${autoUploadNativeSymbols ? 'shouldSentryAutoUpload()' : 'false'}
      includeNativeSources = ${includeNativeSources}
      includeSourceContext = ${includeSourceContext ? 'shouldSentryAutoUpload()' : 'false'}
      tracingInstrumentation {
          enabled = false
      }
      autoInstallation {
          enabled = false
      }
  }`;
            let contents = appBuildGradle.modResults.contents;
            if (!contents.includes(sentryPlugin)) {
                contents = `${sentryPlugin}\n${contents}`;
            }
            if (!contents.includes('sentry {')) {
                contents = `${contents}\n${sentryConfig}`;
            }
            appBuildGradle.modResults.contents = contents;
            return appBuildGradle;
        });
    };
    return withSentryAppBuildGradle(withSentryProjectBuildGradle(config));
}
exports.withSentryAndroidGradlePlugin = withSentryAndroidGradlePlugin;
