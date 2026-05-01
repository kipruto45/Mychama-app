"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifyAppBuildGradle = exports.withSentryAndroid = void 0;
const config_plugins_1 = require("expo/config-plugins");
const path = __importStar(require("path"));
const utils_1 = require("./utils");
const withSentryAndroid = (config, sentryProperties) => {
    const cfg = (0, config_plugins_1.withAppBuildGradle)(config, appBuildGradle => {
        if (appBuildGradle.modResults.language === 'groovy') {
            appBuildGradle.modResults.contents = modifyAppBuildGradle(appBuildGradle.modResults.contents);
        }
        else {
            throw new Error('Cannot configure Sentry in the app gradle because the build.gradle is not groovy');
        }
        return appBuildGradle;
    });
    return (0, config_plugins_1.withDangerousMod)(cfg, [
        'android',
        dangerousMod => {
            (0, utils_1.writeSentryPropertiesTo)(path.resolve(dangerousMod.modRequest.projectRoot, 'android'), sentryProperties);
            return dangerousMod;
        },
    ]);
};
exports.withSentryAndroid = withSentryAndroid;
const resolveSentryReactNativePackageJsonPath = '["node", "--print", "require(\'path\').dirname(require.resolve(\'@sentry/react-native/package.json\'))"].execute().text.trim()';
/**
 * Writes to projectDirectory/android/app/build.gradle,
 * adding the relevant @sentry/react-native script.
 */
function modifyAppBuildGradle(buildGradle) {
    if (buildGradle.includes('sentry.gradle')) {
        return buildGradle;
    }
    // Use the same location that sentry-wizard uses
    // See: https://github.com/getsentry/sentry-wizard/blob/e9b4522f27a852069c862bd458bdf9b07cab6e33/lib/Steps/Integrations/ReactNative.ts#L232
    const pattern = /^android {/m;
    if (!buildGradle.match(pattern)) {
        (0, utils_1.warnOnce)('Could not find `^android {` in `android/app/build.gradle`. Please open a bug report at https://github.com/getsentry/sentry-react-native.');
        return buildGradle;
    }
    const applyFrom = `apply from: new File(${resolveSentryReactNativePackageJsonPath}, "sentry.gradle")`;
    return buildGradle.replace(pattern, match => `${applyFrom}\n\n${match}`);
}
exports.modifyAppBuildGradle = modifyAppBuildGradle;
