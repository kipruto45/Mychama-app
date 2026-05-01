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
exports.addSentryWithBundledScriptsToBundleShellScript = exports.modifyExistingXcodeBuildScript = exports.withSentryIOS = void 0;
const config_plugins_1 = require("expo/config-plugins");
const path = __importStar(require("path"));
const utils_1 = require("./utils");
const SENTRY_REACT_NATIVE_XCODE_PATH = "`\"$NODE_BINARY\" --print \"require('path').dirname(require.resolve('@sentry/react-native/package.json')) + '/scripts/sentry-xcode.sh'\"`";
const SENTRY_REACT_NATIVE_XCODE_DEBUG_FILES_PATH = "`${NODE_BINARY:-node} --print \"require('path').dirname(require.resolve('@sentry/react-native/package.json')) + '/scripts/sentry-xcode-debug-files.sh'\"`";
const withSentryIOS = (config, sentryProperties) => {
    const cfg = (0, config_plugins_1.withXcodeProject)(config, config => {
        const xcodeProject = config.modResults;
        const sentryBuildPhase = xcodeProject.pbxItemByComment('Upload Debug Symbols to Sentry', 'PBXShellScriptBuildPhase');
        if (!sentryBuildPhase) {
            xcodeProject.addBuildPhase([], 'PBXShellScriptBuildPhase', 'Upload Debug Symbols to Sentry', null, {
                shellPath: '/bin/sh',
                shellScript: `/bin/sh ${SENTRY_REACT_NATIVE_XCODE_DEBUG_FILES_PATH}`,
            });
        }
        const bundleReactNativePhase = xcodeProject.pbxItemByComment('Bundle React Native code and images', 'PBXShellScriptBuildPhase');
        modifyExistingXcodeBuildScript(bundleReactNativePhase);
        return config;
    });
    return (0, config_plugins_1.withDangerousMod)(cfg, [
        'ios',
        config => {
            (0, utils_1.writeSentryPropertiesTo)(path.resolve(config.modRequest.projectRoot, 'ios'), sentryProperties);
            return config;
        },
    ]);
};
exports.withSentryIOS = withSentryIOS;
function modifyExistingXcodeBuildScript(script) {
    if (!script.shellScript.match(/(packager|scripts)\/react-native-xcode\.sh\b/)) {
        (0, utils_1.warnOnce)(`'react-native-xcode.sh' not found in 'Bundle React Native code and images'.
Please open a bug report at https://github.com/getsentry/sentry-react-native`);
        return;
    }
    if (script.shellScript.includes('sentry-xcode.sh')) {
        (0, utils_1.warnOnce)("The latest 'sentry-xcode.sh' script already exists in 'Bundle React Native code and images'.");
        return;
    }
    if (script.shellScript.includes('@sentry')) {
        (0, utils_1.warnOnce)(`Outdated or custom Sentry script found in 'Bundle React Native code and images'.
Regenerate the native project to use the latest script.
Run npx expo prebuild --clean`);
        return;
    }
    const code = JSON.parse(script.shellScript);
    script.shellScript = JSON.stringify(addSentryWithBundledScriptsToBundleShellScript(code));
}
exports.modifyExistingXcodeBuildScript = modifyExistingXcodeBuildScript;
function addSentryWithBundledScriptsToBundleShellScript(script) {
    return script.replace(/^.*?(packager|scripts)\/react-native-xcode\.sh\s*(\\'\\\\")?/m, 
    // eslint-disable-next-line no-useless-escape
    (match) => `/bin/sh ${SENTRY_REACT_NATIVE_XCODE_PATH} ${match}`);
}
exports.addSentryWithBundledScriptsToBundleShellScript = addSentryWithBundledScriptsToBundleShellScript;
