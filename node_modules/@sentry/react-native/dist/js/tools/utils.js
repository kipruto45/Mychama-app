"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpoConfig = exports.createVirtualJSModule = exports.prependModule = exports.createSet = exports.determineDebugIdFromBundleSource = exports.stringToUUID = exports.createDebugIdSnippet = void 0;
const crypto = require("crypto");
const countLines_1 = require("./vendor/metro/countLines");
/**
 * Returns minified Debug ID code snippet.
 */
function createDebugIdSnippet(debugId) {
    return `var _sentryDebugIds,_sentryDebugIdIdentifier;void 0===_sentryDebugIds&&(_sentryDebugIds={});try{var stack=(new Error).stack;stack&&(_sentryDebugIds[stack]="${debugId}",_sentryDebugIdIdentifier="sentry-dbid-${debugId}")}catch(e){}`;
}
exports.createDebugIdSnippet = createDebugIdSnippet;
/**
 * Deterministically hashes a string and turns the hash into a uuid.
 *
 * https://github.com/getsentry/sentry-javascript-bundler-plugins/blob/58271f1af2ade6b3e64d393d70376ae53bc5bd2f/packages/bundler-plugin-core/src/utils.ts#L174
 */
function stringToUUID(str) {
    const md5sum = crypto.createHash('md5');
    md5sum.update(str);
    const md5Hash = md5sum.digest('hex');
    // Position 16 is fixed to either 8, 9, a, or b in the uuid v4 spec (10xx in binary)
    // RFC 4122 section 4.4
    const v4variant = ['8', '9', 'a', 'b'][md5Hash.substring(16, 17).charCodeAt(0) % 4];
    return `${md5Hash.substring(0, 8)}-${md5Hash.substring(8, 12)}-4${md5Hash.substring(13, 16)}-${v4variant}${md5Hash.substring(17, 20)}-${md5Hash.substring(20)}`.toLowerCase();
}
exports.stringToUUID = stringToUUID;
/**
 * Looks for a particular string pattern (`sdbid-[debug ID]`) in the bundle
 * source and extracts the bundle's debug ID from it.
 *
 * The string pattern is injected via the debug ID injection snipped.
 *
 * https://github.com/getsentry/sentry-javascript-bundler-plugins/blob/40f918458ed449d8b3eabaf64d13c08218213f65/packages/bundler-plugin-core/src/debug-id-upload.ts#L293-L294
 */
function determineDebugIdFromBundleSource(code) {
    const match = code.match(/sentry-dbid-([0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12})/);
    return match ? match[1] : undefined;
}
exports.determineDebugIdFromBundleSource = determineDebugIdFromBundleSource;
/**
 * CountingSet was added in Metro 0.72.0 before that NodeJS Set was used.
 *
 * https://github.com/facebook/metro/blob/fc29a1177f883144674cf85a813b58567f69d545/packages/metro/src/lib/CountingSet.js
 */
function resolveSetCreator() {
    const CountingSetFromPrivate = safeRequireCountingSetFromPrivate();
    if (CountingSetFromPrivate) {
        return () => new CountingSetFromPrivate.default();
    }
    const CountingSetFromSrc = safeRequireCountingSetFromSrc();
    if (CountingSetFromSrc) {
        return () => new CountingSetFromSrc.default();
    }
    return () => new Set();
}
/**
 * CountingSet was added in Metro 0.72.0 before that NodeJS Set was used.
 *
 * https://github.com/facebook/metro/blob/fc29a1177f883144674cf85a813b58567f69d545/packages/metro/src/lib/CountingSet.js
 */
function safeRequireCountingSetFromSrc() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-extraneous-dependencies
        return require('metro/src/lib/CountingSet');
    }
    catch (e) {
        return undefined;
    }
}
/**
 * CountingSet was moved to private in Metro 0.83.0. (all src exports were moved to private)
 *
 * https://github.com/facebook/metro/commit/ae6f42372ed361611b5672705f22081c2022cf28
 */
function safeRequireCountingSetFromPrivate() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-extraneous-dependencies
        return require('metro/private/lib/CountingSet');
    }
    catch (e) {
        return undefined;
    }
}
exports.createSet = resolveSetCreator();
const PRELUDE_MODULE_PATH = '__prelude__';
/**
 * Prepends the module after default required prelude modules.
 */
function prependModule(modules, module) {
    const modifiedPreModules = [...modules];
    if (modifiedPreModules.length > 0 &&
        modifiedPreModules[0] !== undefined &&
        modifiedPreModules[0].path === PRELUDE_MODULE_PATH) {
        // prelude module must be first as it measures the bundle startup time
        modifiedPreModules.unshift(modules[0]);
        modifiedPreModules[1] = module;
    }
    else {
        modifiedPreModules.unshift(module);
    }
    return modifiedPreModules;
}
exports.prependModule = prependModule;
/**
 * Creates a virtual JS module with the given path and code.
 */
function createVirtualJSModule(modulePath, moduleCode) {
    let sourceCode = moduleCode;
    return {
        setSource: (code) => {
            sourceCode = code;
        },
        dependencies: new Map(),
        getSource: () => Buffer.from(sourceCode),
        inverseDependencies: (0, exports.createSet)(),
        path: modulePath,
        output: [
            {
                type: 'js/script/virtual',
                data: {
                    code: sourceCode,
                    lineCount: (0, countLines_1.default)(sourceCode),
                    map: [],
                },
            },
        ],
    };
}
exports.createVirtualJSModule = createVirtualJSModule;
/**
 * Tries to load Expo config using `@expo/config` package.
 */
function getExpoConfig(projectRoot) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-extraneous-dependencies
        const expoConfig = require('@expo/config');
        if (expoConfig.getConfig) {
            const { exp } = expoConfig.getConfig(projectRoot);
            return {
                name: typeof exp.name === 'string' && exp.name ? exp.name : undefined,
                version: typeof exp.version === 'string' && exp.version ? exp.version : undefined,
            };
        }
    }
    catch (_a) {
        // @expo/config not available, do nothing
    }
    return {};
}
exports.getExpoConfig = getExpoConfig;
//# sourceMappingURL=utils.js.map