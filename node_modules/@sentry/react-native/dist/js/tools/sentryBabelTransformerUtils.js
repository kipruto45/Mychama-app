"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSentryBabelTransformer = exports.getSentryBabelTransformerOptions = exports.setSentryBabelTransformerOptions = exports.loadDefaultBabelTransformer = exports.getSentryDefaultBabelTransformerPathEnv = exports.setSentryDefaultBabelTransformerPathEnv = exports.SENTRY_BABEL_TRANSFORMER_OPTIONS = exports.SENTRY_DEFAULT_BABEL_TRANSFORMER_PATH = void 0;
const babel_plugin_component_annotate_1 = require("@sentry/babel-plugin-component-annotate");
const core_1 = require("@sentry/core");
const process = require("process");
exports.SENTRY_DEFAULT_BABEL_TRANSFORMER_PATH = 'SENTRY_DEFAULT_BABEL_TRANSFORMER_PATH';
exports.SENTRY_BABEL_TRANSFORMER_OPTIONS = 'SENTRY_BABEL_TRANSFORMER_OPTIONS';
/**
 * Sets default Babel transformer path to the environment variables.
 */
function setSentryDefaultBabelTransformerPathEnv(defaultBabelTransformerPath) {
    process.env[exports.SENTRY_DEFAULT_BABEL_TRANSFORMER_PATH] = defaultBabelTransformerPath;
    core_1.debug.log(`Saved default Babel transformer path ${defaultBabelTransformerPath}`);
}
exports.setSentryDefaultBabelTransformerPathEnv = setSentryDefaultBabelTransformerPathEnv;
/**
 * Reads default Babel transformer path from the environment variables.
 */
function getSentryDefaultBabelTransformerPathEnv() {
    return process.env[exports.SENTRY_DEFAULT_BABEL_TRANSFORMER_PATH];
}
exports.getSentryDefaultBabelTransformerPathEnv = getSentryDefaultBabelTransformerPathEnv;
/**
 * Loads default Babel transformer from `@react-native/metro-config` -> `@react-native/metro-babel-transformer`.
 */
function loadDefaultBabelTransformer() {
    const defaultBabelTransformerPath = getSentryDefaultBabelTransformerPathEnv();
    if (!defaultBabelTransformerPath) {
        throw new Error(`Default Babel transformer path environment variable ${exports.SENTRY_DEFAULT_BABEL_TRANSFORMER_PATH} is not set.`);
    }
    core_1.debug.log(`Loading default Babel transformer from ${defaultBabelTransformerPath}`);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(defaultBabelTransformerPath);
}
exports.loadDefaultBabelTransformer = loadDefaultBabelTransformer;
/**
 *
 */
function setSentryBabelTransformerOptions(options) {
    let optionsString = null;
    try {
        core_1.debug.log('Stringifying Sentry Babel transformer options', options);
        optionsString = JSON.stringify(options);
    }
    catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to stringify Sentry Babel transformer options', e);
    }
    if (!optionsString) {
        return;
    }
    core_1.debug.log(`Sentry Babel transformer options set to ${exports.SENTRY_BABEL_TRANSFORMER_OPTIONS}`, optionsString);
    process.env[exports.SENTRY_BABEL_TRANSFORMER_OPTIONS] = optionsString;
}
exports.setSentryBabelTransformerOptions = setSentryBabelTransformerOptions;
/**
 *
 */
function getSentryBabelTransformerOptions() {
    const optionsString = process.env[exports.SENTRY_BABEL_TRANSFORMER_OPTIONS];
    if (!optionsString) {
        core_1.debug.log(`Sentry Babel transformer options environment variable ${exports.SENTRY_BABEL_TRANSFORMER_OPTIONS} is not set`);
        return undefined;
    }
    try {
        core_1.debug.log(`Parsing Sentry Babel transformer options from ${optionsString}`);
        return JSON.parse(optionsString);
    }
    catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to parse Sentry Babel transformer options', e);
        return undefined;
    }
}
exports.getSentryBabelTransformerOptions = getSentryBabelTransformerOptions;
/**
 * Creates a Babel transformer with Sentry component annotation plugin.
 */
function createSentryBabelTransformer() {
    const defaultTransformer = loadDefaultBabelTransformer();
    const options = getSentryBabelTransformerOptions();
    // Using spread operator to avoid any conflicts with the default transformer
    const transform = (...args) => {
        const transformerArgs = args[0];
        addSentryComponentAnnotatePlugin(transformerArgs, options === null || options === void 0 ? void 0 : options.annotateReactComponents);
        return defaultTransformer.transform(...args);
    };
    return Object.assign(Object.assign({}, defaultTransformer), { transform });
}
exports.createSentryBabelTransformer = createSentryBabelTransformer;
function addSentryComponentAnnotatePlugin(args, options) {
    if (!args || typeof args.filename !== 'string' || !Array.isArray(args.plugins)) {
        return undefined;
    }
    if (!args.filename.includes('node_modules')) {
        if (options) {
            args.plugins.push([babel_plugin_component_annotate_1.default, options]);
        }
        else {
            args.plugins.push(babel_plugin_component_annotate_1.default);
        }
    }
}
//# sourceMappingURL=sentryBabelTransformerUtils.js.map