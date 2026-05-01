"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSentryMetroSerializer = exports.unstableBeforeAssetSerializationDebugIdPlugin = void 0;
const crypto = require("crypto");
const utils_1 = require("./utils");
const utils_2 = require("./vendor/metro/utils");
const DEBUG_ID_PLACE_HOLDER = '__debug_id_place_holder__';
const DEBUG_ID_MODULE_PATH = '__debugid__';
const SOURCE_MAP_COMMENT = '//# sourceMappingURL=';
const DEBUG_ID_COMMENT = '//# debugId=';
/**
 * Adds Sentry Debug ID polyfill module to the bundle.
 */
function unstableBeforeAssetSerializationDebugIdPlugin({ premodules, debugId, }) {
    if (!debugId) {
        return premodules;
    }
    const debugIdModuleExists = premodules.findIndex(module => module.path === DEBUG_ID_MODULE_PATH) != -1;
    if (debugIdModuleExists) {
        // eslint-disable-next-line no-console
        console.warn('\n\nDebug ID module found. Skipping Sentry Debug ID module...\n\n');
        return premodules;
    }
    const debugIdModule = createDebugIdModule(debugId);
    return (0, utils_1.prependModule)(premodules, debugIdModule);
}
exports.unstableBeforeAssetSerializationDebugIdPlugin = unstableBeforeAssetSerializationDebugIdPlugin;
/**
 * Creates a Metro serializer that adds Debug ID module to the plain bundle.
 * The Debug ID module is a virtual module that provides a debug ID in runtime.
 *
 * RAM Bundles do not support custom serializers.
 */
const createSentryMetroSerializer = (customSerializer) => {
    const serializer = customSerializer || (0, utils_2.createDefaultMetroSerializer)();
    return function (entryPoint, preModules, graph, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (graph.transformOptions.hot) {
                return serializer(entryPoint, preModules, graph, options);
            }
            const debugIdModuleExists = preModules.findIndex(module => module.path === DEBUG_ID_MODULE_PATH) != -1;
            if (debugIdModuleExists) {
                // eslint-disable-next-line no-console
                console.warn('Debug ID module found. Skipping Sentry Debug ID module...');
                return serializer(entryPoint, preModules, graph, options);
            }
            const debugIdModule = createDebugIdModule(DEBUG_ID_PLACE_HOLDER);
            options.sentryBundleCallback = createSentryBundleCallback(debugIdModule);
            const modifiedPreModules = (0, utils_1.prependModule)(preModules, debugIdModule);
            // Run wrapped serializer
            const serializerResult = serializer(entryPoint, modifiedPreModules, graph, options);
            const { code: bundleCode, map: bundleMapString } = yield extractSerializerResult(serializerResult);
            // Add debug id comment to the bundle
            const debugId = (0, utils_1.determineDebugIdFromBundleSource)(bundleCode);
            if (!debugId) {
                throw new Error('Debug ID was not found in the bundle. Call `options.sentryBundleCallback` if you are using a custom serializer.');
            }
            // Only print debug id for command line builds => not hot reload from dev server
            // eslint-disable-next-line no-console
            console.log('info ' + `Bundle Debug ID: ${debugId}`);
            const debugIdComment = `${DEBUG_ID_COMMENT}${debugId}`;
            const indexOfSourceMapComment = bundleCode.lastIndexOf(SOURCE_MAP_COMMENT);
            const bundleCodeWithDebugId = indexOfSourceMapComment === -1
                ? // If source map comment is missing lets just add the debug id comment
                    `${bundleCode}\n${debugIdComment}`
                : // If source map comment is present lets add the debug id comment before it
                    `${bundleCode.substring(0, indexOfSourceMapComment) + debugIdComment}\n${bundleCode.substring(indexOfSourceMapComment)}`;
            const bundleMap = JSON.parse(bundleMapString);
            // For now we write both fields until we know what will become the standard - if ever.
            bundleMap['debug_id'] = debugId;
            bundleMap['debugId'] = debugId;
            return {
                code: bundleCodeWithDebugId,
                map: JSON.stringify(bundleMap),
            };
        });
    };
};
exports.createSentryMetroSerializer = createSentryMetroSerializer;
/**
 * This function is expected to be called after serializer creates the final bundle object
 * and before the source maps are generated.
 *
 * It injects a debug ID into the bundle and returns the modified bundle.
 *
 * Access it via `options.sentryBundleCallback` in your custom serializer.
 */
function createSentryBundleCallback(debugIdModule) {
    return (bundle) => {
        const debugId = calculateDebugId(bundle);
        debugIdModule.setSource(injectDebugId(debugIdModule.getSource().toString(), debugId));
        bundle.pre = injectDebugId(bundle.pre, debugId);
        return bundle;
    };
}
function extractSerializerResult(serializerResult) {
    return __awaiter(this, void 0, void 0, function* () {
        if (typeof serializerResult === 'string') {
            return { code: serializerResult, map: '{}' };
        }
        if ('map' in serializerResult) {
            return { code: serializerResult.code, map: serializerResult.map };
        }
        const awaitedResult = yield serializerResult;
        if (typeof awaitedResult === 'string') {
            return { code: awaitedResult, map: '{}' };
        }
        return { code: awaitedResult.code, map: awaitedResult.map };
    });
}
function createDebugIdModule(debugId) {
    return (0, utils_1.createVirtualJSModule)(DEBUG_ID_MODULE_PATH, (0, utils_1.createDebugIdSnippet)(debugId));
}
function calculateDebugId(bundle) {
    const hash = crypto.createHash('md5');
    hash.update(bundle.pre);
    for (const [, code] of bundle.modules) {
        hash.update(code);
    }
    hash.update(bundle.post);
    const debugId = (0, utils_1.stringToUUID)(hash.digest('hex'));
    return debugId;
}
function injectDebugId(code, debugId) {
    // eslint-disable-next-line @sentry-internal/sdk/no-regexp-constructor
    return code.replace(new RegExp(DEBUG_ID_PLACE_HOLDER, 'g'), debugId);
}
//# sourceMappingURL=sentryMetroSerializer.js.map