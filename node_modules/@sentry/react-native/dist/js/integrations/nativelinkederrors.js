import { exceptionFromError } from '@sentry/browser';
import { isInstanceOf, isPlainObject, isString } from '@sentry/core';
import { NATIVE } from '../wrapper';
const INTEGRATION_NAME = 'NativeLinkedErrors';
const DEFAULT_KEY = 'cause';
const DEFAULT_LIMIT = 5;
/**
 * Processes JS and RN native linked errors.
 */
export const nativeLinkedErrorsIntegration = (options = {}) => {
    const key = options.key || DEFAULT_KEY;
    const limit = options.limit || DEFAULT_LIMIT;
    return {
        name: INTEGRATION_NAME,
        setupOnce: () => {
            // noop
        },
        preprocessEvent: (event, hint, client) => preprocessEvent(event, hint, client, limit, key),
    };
};
function preprocessEvent(event, hint, client, limit, key) {
    var _a;
    if (!((_a = event.exception) === null || _a === void 0 ? void 0 : _a.values) || !hint || !isInstanceOf(hint.originalException, Error)) {
        return;
    }
    const parser = client.getOptions().stackParser;
    const { exceptions: linkedErrors, debugImages } = walkErrorTree(parser, limit, hint.originalException, key);
    event.exception.values = [...event.exception.values, ...linkedErrors];
    event.debug_meta = event.debug_meta || {};
    event.debug_meta.images = event.debug_meta.images || [];
    event.debug_meta.images.push(...(debugImages || []));
}
/**
 * Walks linked errors and created Sentry exceptions chain.
 * Collects debug images from native errors stack frames.
 */
function walkErrorTree(parser, limit, error, key, exceptions = [], debugImages = []) {
    const linkedError = error[key];
    if (!linkedError || exceptions.length + 1 >= limit) {
        return {
            exceptions,
            debugImages,
        };
    }
    let exception;
    let exceptionDebugImages;
    if (isString(linkedError)) {
        exception = {
            value: linkedError,
        };
    }
    else if ('stackElements' in linkedError) {
        // isJavaException
        exception = exceptionFromJavaStackElements(linkedError);
    }
    else if ('stackReturnAddresses' in linkedError) {
        // isObjCException
        const { appleException, appleDebugImages } = exceptionFromAppleStackReturnAddresses(linkedError);
        exception = appleException;
        exceptionDebugImages = appleDebugImages;
    }
    else if (isInstanceOf(linkedError, Error)) {
        exception = exceptionFromError(parser, error[key]);
    }
    else if (isPlainObject(linkedError)) {
        exception = {
            type: typeof linkedError.name === 'string' ? linkedError.name : undefined,
            value: typeof linkedError.message === 'string' ? linkedError.message : undefined,
        };
    }
    else {
        return {
            exceptions,
            debugImages,
        };
    }
    return walkErrorTree(parser, limit, linkedError, key, [...exceptions, exception], [...debugImages, ...(exceptionDebugImages || [])]);
}
/**
 * Converts a Java Throwable to an SentryException
 */
function exceptionFromJavaStackElements(javaThrowable) {
    const nativePackage = fetchNativePackage();
    return {
        type: javaThrowable.name,
        value: javaThrowable.message,
        stacktrace: {
            frames: javaThrowable.stackElements
                .map(stackElement => ({
                platform: 'java',
                module: stackElement.className,
                filename: stackElement.fileName,
                lineno: stackElement.lineNumber >= 0 ? stackElement.lineNumber : undefined,
                function: stackElement.methodName,
                in_app: nativePackage !== null && stackElement.className.startsWith(nativePackage) ? true : undefined,
            }))
                .reverse(),
        },
    };
}
/**
 * Converts StackAddresses to a SentryException with DebugMetaImages
 */
function exceptionFromAppleStackReturnAddresses(objCException) {
    const nativeStackFrames = fetchNativeStackFrames(objCException.stackReturnAddresses);
    return {
        appleException: {
            type: objCException.name,
            value: objCException.message,
            stacktrace: {
                frames: (nativeStackFrames === null || nativeStackFrames === void 0 ? void 0 : nativeStackFrames.frames.reverse()) || [],
            },
        },
        appleDebugImages: (nativeStackFrames === null || nativeStackFrames === void 0 ? void 0 : nativeStackFrames.debugMetaImages) || [],
    };
}
let nativePackage = null;
/**
 * Fetches the native package/image name from the native layer
 */
function fetchNativePackage() {
    if (nativePackage === null) {
        nativePackage = NATIVE.fetchNativePackageName();
    }
    return nativePackage;
}
/**
 * Fetches native debug image information on iOS
 */
function fetchNativeStackFrames(instructionsAddr) {
    return NATIVE.fetchNativeStackFramesBy(instructionsAddr);
}
//# sourceMappingURL=nativelinkederrors.js.map