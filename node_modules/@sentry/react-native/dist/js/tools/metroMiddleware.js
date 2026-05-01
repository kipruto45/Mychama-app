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
exports.withSentryMiddleware = exports.createSentryMetroMiddleware = exports.stackFramesContextMiddleware = void 0;
const core_1 = require("@sentry/core");
const fs_1 = require("fs");
const util_1 = require("util");
const readFileAsync = (0, util_1.promisify)(fs_1.readFile);
/**
 * Accepts Sentry formatted stack frames and
 * adds source context to the in app frames.
 */
const stackFramesContextMiddleware = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    core_1.debug.log('[@sentry/react-native/metro] Received request for stack frames context.');
    request.setEncoding('utf8');
    const rawBody = yield getRawBody(request);
    let body = {};
    try {
        body = JSON.parse(rawBody);
    }
    catch (e) {
        core_1.debug.log('[@sentry/react-native/metro] Could not parse request body.', e);
        badRequest(response, 'Invalid request body. Expected a JSON object.');
        return;
    }
    const stack = body.stack;
    if (!Array.isArray(stack)) {
        core_1.debug.log('[@sentry/react-native/metro] Invalid stack frames.', stack);
        badRequest(response, 'Invalid stack frames. Expected an array.');
        return;
    }
    const stackWithSourceContext = yield Promise.all(stack.map(addSourceContext));
    response.setHeader('Content-Type', 'application/json');
    response.statusCode = 200;
    response.end(JSON.stringify({ stack: stackWithSourceContext }));
    core_1.debug.log('[@sentry/react-native/metro] Sent stack frames context.');
});
exports.stackFramesContextMiddleware = stackFramesContextMiddleware;
function addSourceContext(frame) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!frame.in_app) {
            return frame;
        }
        try {
            if (typeof frame.filename !== 'string') {
                core_1.debug.warn('[@sentry/react-native/metro] Could not read source context for frame without filename.');
                return frame;
            }
            const source = yield readFileAsync(frame.filename, { encoding: 'utf8' });
            const lines = source.split('\n');
            (0, core_1.addContextToFrame)(lines, frame);
        }
        catch (error) {
            core_1.debug.warn('[@sentry/react-native/metro] Could not read source context for frame.', error);
        }
        return frame;
    });
}
function badRequest(response, message) {
    response.statusCode = 400;
    response.end(message);
}
function getRawBody(request) {
    return new Promise((resolve, reject) => {
        let data = '';
        request.on('data', chunk => {
            data += chunk;
        });
        request.on('end', () => {
            resolve(data);
        });
        request.on('error', reject);
    });
}
const SENTRY_MIDDLEWARE_PATH = '/__sentry';
const SENTRY_CONTEXT_REQUEST_PATH = `${SENTRY_MIDDLEWARE_PATH}/context`;
/**
 * Creates a middleware that adds source context to the Sentry formatted stack frames.
 */
const createSentryMetroMiddleware = (middleware) => {
    return (request, response, next) => {
        var _a;
        if ((_a = request.url) === null || _a === void 0 ? void 0 : _a.startsWith(SENTRY_CONTEXT_REQUEST_PATH)) {
            return (0, exports.stackFramesContextMiddleware)(request, response);
        }
        return middleware(request, response, next);
    };
};
exports.createSentryMetroMiddleware = createSentryMetroMiddleware;
/**
 * Adds the Sentry middleware to the Metro server config.
 */
const withSentryMiddleware = (config) => {
    if (!config.server) {
        // @ts-expect-error server is typed read only
        config.server = {};
    }
    const originalEnhanceMiddleware = config.server.enhanceMiddleware;
    config.server.enhanceMiddleware = (middleware, server) => {
        const sentryMiddleware = (0, exports.createSentryMetroMiddleware)(middleware);
        return originalEnhanceMiddleware ? originalEnhanceMiddleware(sentryMiddleware, server) : sentryMiddleware;
    };
    return config;
};
exports.withSentryMiddleware = withSentryMiddleware;
//# sourceMappingURL=metroMiddleware.js.map