"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withSentry = exports.getSentryProperties = void 0;
const config_plugins_1 = require("expo/config-plugins");
const utils_1 = require("./utils");
const withSentryAndroid_1 = require("./withSentryAndroid");
const withSentryAndroidGradlePlugin_1 = require("./withSentryAndroidGradlePlugin");
const withSentryIOS_1 = require("./withSentryIOS");
const withSentryPlugin = (config, props) => {
    const sentryProperties = getSentryProperties(props);
    if (props?.authToken) {
        // If not removed, the plugin config with the authToken will be written to the application package
        delete props.authToken;
    }
    let cfg = config;
    if (sentryProperties !== null) {
        try {
            cfg = (0, withSentryAndroid_1.withSentryAndroid)(cfg, sentryProperties);
        }
        catch (e) {
            (0, utils_1.warnOnce)(`There was a problem with configuring your native Android project: ${e}`);
        }
        // if `enableAndroidGradlePlugin` is provided configure the Sentry Android Gradle Plugin
        if (props?.experimental_android && props?.experimental_android?.enableAndroidGradlePlugin) {
            try {
                cfg = (0, withSentryAndroidGradlePlugin_1.withSentryAndroidGradlePlugin)(cfg, props.experimental_android);
            }
            catch (e) {
                (0, utils_1.warnOnce)(`There was a problem with configuring Sentry Android Gradle Plugin: ${e}`);
            }
        }
        try {
            cfg = (0, withSentryIOS_1.withSentryIOS)(cfg, sentryProperties);
        }
        catch (e) {
            (0, utils_1.warnOnce)(`There was a problem with configuring your native iOS project: ${e}`);
        }
    }
    return cfg;
};
const missingProjectMessage = '# no project found, falling back to SENTRY_PROJECT environment variable';
const missingOrgMessage = '# no org found, falling back to SENTRY_ORG environment variable';
const existingAuthTokenMessage = '# DO NOT COMMIT the auth token, use SENTRY_AUTH_TOKEN instead, see https://docs.sentry.io/platforms/react-native/manual-setup/';
const missingAuthTokenMessage = '# Using SENTRY_AUTH_TOKEN environment variable';
function getSentryProperties(props) {
    const { organization, project, authToken, url = 'https://sentry.io/' } = props ?? {};
    // eslint-disable-next-line no-prototype-builtins
    const missingProperties = ['organization', 'project'].filter(each => !props?.hasOwnProperty(each));
    if (missingProperties.length) {
        const missingPropertiesString = (0, utils_1.bold)(missingProperties.join(', '));
        const warningMessage = `Missing config for ${missingPropertiesString}. Environment variables will be used as a fallback during the build. https://docs.sentry.io/platforms/react-native/manual-setup/`;
        (0, utils_1.warnOnce)(warningMessage);
    }
    if (authToken) {
        (0, utils_1.warnOnce)(`Detected unsecure use of 'authToken' in Sentry plugin configuration. To avoid exposing the token use ${(0, utils_1.bold)('SENTRY_AUTH_TOKEN')} environment variable instead. https://docs.sentry.io/platforms/react-native/manual-setup/`);
    }
    return `defaults.url=${url}
${organization ? `defaults.org=${organization}` : missingOrgMessage}
${project ? `defaults.project=${project}` : missingProjectMessage}
${authToken ? `${existingAuthTokenMessage}\nauth.token=${authToken}` : missingAuthTokenMessage}`;
}
exports.getSentryProperties = getSentryProperties;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const withSentry = (0, config_plugins_1.createRunOncePlugin)(withSentryPlugin, utils_1.sdkPackage.name, utils_1.sdkPackage.version);
exports.withSentry = withSentry;
