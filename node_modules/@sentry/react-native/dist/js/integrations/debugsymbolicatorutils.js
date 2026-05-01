var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { debug } from '@sentry/core';
import { ReactNativeLibraries } from '../utils/rnlibraries';
import { createStealthXhr, XHR_READYSTATE_DONE } from '../utils/xhr';
/**
 * Fetches source context for the Sentry Middleware (/__sentry/context)
 *
 * @param frame StackFrame
 * @param getDevServer function from RN to get DevServer URL
 */
export function fetchSourceContext(frames) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => {
            try {
                const xhr = createStealthXhr();
                if (!xhr) {
                    resolve(frames);
                    return;
                }
                const url = getSentryMetroSourceContextUrl();
                if (!url) {
                    debug.error('Could not fetch source context. No dev server URL found.');
                    resolve(frames);
                    return;
                }
                xhr.open('POST', url, true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send(JSON.stringify({ stack: frames }));
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === XHR_READYSTATE_DONE) {
                        if (xhr.status !== 200) {
                            resolve(frames);
                        }
                        try {
                            const response = JSON.parse(xhr.responseText);
                            if (Array.isArray(response.stack)) {
                                resolve(response.stack);
                            }
                            else {
                                resolve(frames);
                            }
                        }
                        catch (error) {
                            resolve(frames);
                        }
                    }
                };
                xhr.onerror = () => {
                    resolve(frames);
                };
            }
            catch (error) {
                debug.error('Could not fetch source context.', error);
                resolve(frames);
            }
        });
    });
}
function getSentryMetroSourceContextUrl() {
    const devServer = getDevServer();
    if (!devServer) {
        return undefined;
    }
    return `${devServer.url}__sentry/context`;
}
/**
 * Loads and calls RN Core Devtools parseErrorStack function.
 */
export function parseErrorStack(errorStack) {
    if (!ReactNativeLibraries.Devtools) {
        throw new Error('React Native Devtools not available.');
    }
    return ReactNativeLibraries.Devtools.parseErrorStack(errorStack);
}
/**
 * Loads and calls RN Core Devtools symbolicateStackTrace function.
 */
export function symbolicateStackTrace(stack, extraData) {
    if (!ReactNativeLibraries.Devtools) {
        throw new Error('React Native Devtools not available.');
    }
    return ReactNativeLibraries.Devtools.symbolicateStackTrace(stack, extraData);
}
/**
 * Loads and returns the RN DevServer URL.
 */
export function getDevServer() {
    var _a;
    try {
        return (_a = ReactNativeLibraries.Devtools) === null || _a === void 0 ? void 0 : _a.getDevServer();
    }
    catch (_oO) {
        // We can't load devserver URL
    }
    return undefined;
}
//# sourceMappingURL=debugsymbolicatorutils.js.map