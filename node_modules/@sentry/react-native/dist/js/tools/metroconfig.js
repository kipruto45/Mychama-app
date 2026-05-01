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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withSentryFramesCollapsed = exports.withSentryResolver = exports.withSentryBabelTransformer = exports.getSentryExpoConfig = exports.withSentryConfig = void 0;
const core_1 = require("@sentry/core");
const process = require("process");
const process_1 = require("process");
const enableLogger_1 = require("./enableLogger");
const metroMiddleware_1 = require("./metroMiddleware");
const sentryBabelTransformerUtils_1 = require("./sentryBabelTransformerUtils");
const sentryMetroSerializer_1 = require("./sentryMetroSerializer");
const sentryReleaseInjector_1 = require("./sentryReleaseInjector");
__exportStar(require("./sentryMetroSerializer"), exports);
(0, enableLogger_1.enableLogger)();
/**
 * Adds Sentry to the Metro config.
 *
 * Adds Debug ID to the output bundle and source maps.
 * Collapses Sentry frames from the stack trace view in LogBox.
 */
function withSentryConfig(config, { annotateReactComponents = false, includeWebReplay = true, enableSourceContextInDevelopment = true, } = {}) {
    setSentryMetroDevServerEnvFlag();
    let newConfig = config;
    newConfig = withSentryDebugId(newConfig);
    newConfig = withSentryFramesCollapsed(newConfig);
    if (annotateReactComponents) {
        newConfig = withSentryBabelTransformer(newConfig, annotateReactComponents);
    }
    if (includeWebReplay === false) {
        newConfig = withSentryResolver(newConfig, includeWebReplay);
    }
    if (enableSourceContextInDevelopment) {
        newConfig = (0, metroMiddleware_1.withSentryMiddleware)(newConfig);
    }
    return newConfig;
}
exports.withSentryConfig = withSentryConfig;
/**
 * This function returns Default Expo configuration with Sentry plugins.
 */
function getSentryExpoConfig(projectRoot, options = {}) {
    var _a, _b;
    setSentryMetroDevServerEnvFlag();
    const getDefaultConfig = options.getDefaultConfig || loadExpoMetroConfigModule().getDefaultConfig;
    const config = getDefaultConfig(projectRoot, Object.assign(Object.assign({}, options), { unstable_beforeAssetSerializationPlugins: [
            ...(options.unstable_beforeAssetSerializationPlugins || []),
            ...(((_a = options.injectReleaseForWeb) !== null && _a !== void 0 ? _a : true) ? [(0, sentryReleaseInjector_1.unstableReleaseConstantsPlugin)(projectRoot)] : []),
            sentryMetroSerializer_1.unstableBeforeAssetSerializationDebugIdPlugin,
        ] }));
    let newConfig = withSentryFramesCollapsed(config);
    if (options.annotateReactComponents) {
        newConfig = withSentryBabelTransformer(newConfig, options.annotateReactComponents);
    }
    if (options.includeWebReplay === false) {
        newConfig = withSentryResolver(newConfig, options.includeWebReplay);
    }
    if ((_b = options.enableSourceContextInDevelopment) !== null && _b !== void 0 ? _b : true) {
        newConfig = (0, metroMiddleware_1.withSentryMiddleware)(newConfig);
    }
    return newConfig;
}
exports.getSentryExpoConfig = getSentryExpoConfig;
function loadExpoMetroConfigModule() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require('expo/metro-config');
    }
    catch (e) {
        throw new Error('Unable to load `expo/metro-config`. Make sure you have Expo installed.');
    }
}
/**
 * Adds Sentry Babel transformer to the Metro config.
 */
function withSentryBabelTransformer(config, annotateReactComponents) {
    var _a;
    const defaultBabelTransformerPath = (_a = config.transformer) === null || _a === void 0 ? void 0 : _a.babelTransformerPath;
    core_1.debug.log('Default Babel transformer path from `config.transformer`:', defaultBabelTransformerPath);
    if (!defaultBabelTransformerPath) {
        // This has to be console.warn because the options is enabled but won't be used
        // eslint-disable-next-line no-console
        console.warn('`transformer.babelTransformerPath` is undefined.');
        // eslint-disable-next-line no-console
        console.warn('Sentry Babel transformer cannot be used. Not adding it...');
        return config;
    }
    if (defaultBabelTransformerPath) {
        (0, sentryBabelTransformerUtils_1.setSentryDefaultBabelTransformerPathEnv)(defaultBabelTransformerPath);
    }
    if (typeof annotateReactComponents === 'object') {
        (0, sentryBabelTransformerUtils_1.setSentryBabelTransformerOptions)({
            annotateReactComponents,
        });
    }
    return Object.assign(Object.assign({}, config), { transformer: Object.assign(Object.assign({}, config.transformer), { babelTransformerPath: require.resolve('./sentryBabelTransformer') }) });
}
exports.withSentryBabelTransformer = withSentryBabelTransformer;
function withSentryDebugId(config) {
    var _a;
    const customSerializer = (0, sentryMetroSerializer_1.createSentryMetroSerializer)(((_a = config.serializer) === null || _a === void 0 ? void 0 : _a.customSerializer) || undefined);
    // MetroConfig types customSerializers as async only, but sync returns are also supported
    // The default serializer is sync
    return Object.assign(Object.assign({}, config), { serializer: Object.assign(Object.assign({}, config.serializer), { customSerializer }) });
}
/**
 * Includes `@sentry/replay` packages based on the `includeWebReplay` flag and current bundle `platform`.
 */
function withSentryResolver(config, includeWebReplay) {
    var _a;
    const originalResolver = (_a = config.resolver) === null || _a === void 0 ? void 0 : _a.resolveRequest;
    const sentryResolverRequest = (context, moduleName, platform, oldMetroModuleName) => {
        if ((includeWebReplay === false ||
            (includeWebReplay === undefined && (platform === 'android' || platform === 'ios'))) &&
            !!(oldMetroModuleName !== null && oldMetroModuleName !== void 0 ? oldMetroModuleName : moduleName).match(/@sentry(?:-internal)?\/replay/)) {
            return { type: 'empty' };
        }
        if (originalResolver) {
            return oldMetroModuleName
                ? originalResolver(context, moduleName, platform, oldMetroModuleName)
                : originalResolver(context, moduleName, platform);
        }
        // Prior 0.68, resolve context.resolveRequest is sentryResolver itself, where on later version it is the default resolver.
        if (context.resolveRequest === sentryResolverRequest) {
            // eslint-disable-next-line no-console
            console.error(`Error: [@sentry/react-native/metro] Can not resolve the defaultResolver on Metro older than 0.68.
Please follow one of the following options:
- Include your resolverRequest on your metroconfig.
- Update your Metro version to 0.68 or higher.
- Set includeWebReplay as true on your metro config.
- If you are still facing issues, report the issue at http://www.github.com/getsentry/sentry-react-native/issues`);
            // Return required for test.
            return process.exit(-1);
        }
        return context.resolveRequest(context, moduleName, platform);
    };
    return Object.assign(Object.assign({}, config), { resolver: Object.assign(Object.assign({}, config.resolver), { resolveRequest: sentryResolverRequest }) });
}
exports.withSentryResolver = withSentryResolver;
/**
 * Collapses Sentry internal frames from the stack trace view in LogBox.
 */
function withSentryFramesCollapsed(config) {
    var _a;
    const originalCustomizeFrame = (_a = config.symbolicator) === null || _a === void 0 ? void 0 : _a.customizeFrame;
    const collapseSentryInternalFrames = (frame) => typeof frame.file === 'string' &&
        (frame.file.includes('node_modules/@sentry/core/cjs/instrument.js') ||
            frame.file.includes('node_modules/@sentry/core/cjs/debug.js'));
    const customizeFrame = (frame) => {
        const originalOrSentryCustomizeFrame = (originalCustomization) => (Object.assign(Object.assign({}, originalCustomization), { collapse: (originalCustomization === null || originalCustomization === void 0 ? void 0 : originalCustomization.collapse) || collapseSentryInternalFrames(frame) }));
        const maybePromiseCustomization = (originalCustomizeFrame === null || originalCustomizeFrame === void 0 ? void 0 : originalCustomizeFrame(frame)) || undefined;
        if (maybePromiseCustomization !== undefined && 'then' in maybePromiseCustomization) {
            return maybePromiseCustomization.then(originalCustomization => originalOrSentryCustomizeFrame(originalCustomization));
        }
        return originalOrSentryCustomizeFrame(maybePromiseCustomization);
    };
    return Object.assign(Object.assign({}, config), { symbolicator: Object.assign(Object.assign({}, config.symbolicator), { customizeFrame }) });
}
exports.withSentryFramesCollapsed = withSentryFramesCollapsed;
/**
 * Sets the `___SENTRY_METRO_DEV_SERVER___` environment flag.
 * This is used to determine if the SDK is running in Node in Metro Dev Server.
 * For example during static routes generation in `expo-router`.
 */
function setSentryMetroDevServerEnvFlag() {
    process_1.env.___SENTRY_METRO_DEV_SERVER___ = 'true';
}
//# sourceMappingURL=metroconfig.js.map