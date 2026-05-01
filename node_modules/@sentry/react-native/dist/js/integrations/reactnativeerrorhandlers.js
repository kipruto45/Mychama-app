var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { addExceptionMechanism, addGlobalUnhandledRejectionInstrumentationHandler, captureException, debug, getClient, getCurrentScope, } from '@sentry/core';
import { isHermesEnabled, isWeb } from '../utils/environment';
import { createSyntheticError, isErrorLike } from '../utils/error';
import { RN_GLOBAL_OBJ } from '../utils/worldwide';
import { checkPromiseAndWarn, polyfillPromise, requireRejectionTracking } from './reactnativeerrorhandlersutils';
const INTEGRATION_NAME = 'ReactNativeErrorHandlers';
/** ReactNativeErrorHandlers Integration */
export const reactNativeErrorHandlersIntegration = (options = {}) => {
    return {
        name: INTEGRATION_NAME,
        setupOnce: () => setup(Object.assign({ onerror: true, onunhandledrejection: true, patchGlobalPromise: true }, options)),
    };
};
function setup(options) {
    options.onunhandledrejection && setupUnhandledRejectionsTracking(options.patchGlobalPromise);
    options.onerror && setupErrorUtilsGlobalHandler();
}
/**
 * Setup unhandled promise rejection tracking
 */
function setupUnhandledRejectionsTracking(patchGlobalPromise) {
    var _a, _b, _c;
    try {
        if (isHermesEnabled() &&
            ((_a = RN_GLOBAL_OBJ.HermesInternal) === null || _a === void 0 ? void 0 : _a.enablePromiseRejectionTracker) &&
            ((_c = (_b = RN_GLOBAL_OBJ === null || RN_GLOBAL_OBJ === void 0 ? void 0 : RN_GLOBAL_OBJ.HermesInternal) === null || _b === void 0 ? void 0 : _b.hasPromise) === null || _c === void 0 ? void 0 : _c.call(_b))) {
            debug.log('Using Hermes native promise rejection tracking');
            RN_GLOBAL_OBJ.HermesInternal.enablePromiseRejectionTracker({
                allRejections: true,
                onUnhandled: promiseRejectionTrackingOptions.onUnhandled,
                onHandled: promiseRejectionTrackingOptions.onHandled,
            });
            debug.log('Unhandled promise rejections will be caught by Sentry.');
        }
        else if (isWeb()) {
            debug.log('Using Browser JS promise rejection tracking for React Native Web');
            // Use Sentry's built-in global unhandled rejection handler
            addGlobalUnhandledRejectionInstrumentationHandler((error) => {
                captureException(error, {
                    originalException: error,
                    syntheticException: isErrorLike(error) ? undefined : createSyntheticError(),
                    mechanism: { handled: false, type: 'onunhandledrejection' },
                });
            });
        }
        else if (patchGlobalPromise) {
            // For JSC and other environments, use the existing approach
            polyfillPromise();
            attachUnhandledRejectionHandler();
            checkPromiseAndWarn();
        }
        else {
            // For JSC and other environments, patching was disabled by user configuration
            debug.log('Unhandled promise rejections will not be caught by Sentry.');
        }
    }
    catch (e) {
        debug.warn('Failed to set up promise rejection tracking. ' +
            'Unhandled promise rejections will not be caught by Sentry.' +
            'See https://docs.sentry.io/platforms/react-native/troubleshooting/ for more details.');
    }
}
const promiseRejectionTrackingOptions = {
    onUnhandled: (id, error, rejection = {}) => {
        if (__DEV__) {
            debug.warn(`Possible Unhandled Promise Rejection (id: ${id}):\n${rejection}`);
        }
        // Marking the rejection as handled to avoid breaking crash rate calculations.
        // See: https://github.com/getsentry/sentry-react-native/issues/4141
        captureException(error, {
            data: { id },
            originalException: error,
            syntheticException: isErrorLike(error) ? undefined : createSyntheticError(),
            mechanism: { handled: true, type: 'onunhandledrejection' },
        });
    },
    onHandled: id => {
        if (__DEV__) {
            debug.warn(`Promise Rejection Handled (id: ${id})\n` +
                'This means you can ignore any previous messages of the form ' +
                `"Possible Unhandled Promise Rejection (id: ${id}):"`);
        }
    },
};
function attachUnhandledRejectionHandler() {
    const tracking = requireRejectionTracking();
    tracking.enable({
        allRejections: true,
        onUnhandled: promiseRejectionTrackingOptions.onUnhandled,
        onHandled: promiseRejectionTrackingOptions.onHandled,
    });
}
function setupErrorUtilsGlobalHandler() {
    var _a;
    let handlingFatal = false;
    const errorUtils = RN_GLOBAL_OBJ.ErrorUtils;
    if (!errorUtils) {
        debug.warn('ErrorUtils not found. Can be caused by different environment for example react-native-web.');
        return;
    }
    const defaultHandler = (_a = errorUtils.getGlobalHandler) === null || _a === void 0 ? void 0 : _a.call(errorUtils);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errorUtils.setGlobalHandler((error, isFatal) => __awaiter(this, void 0, void 0, function* () {
        // We want to handle fatals, but only in production mode.
        const shouldHandleFatal = isFatal && !__DEV__;
        if (shouldHandleFatal) {
            if (handlingFatal) {
                debug.log('Encountered multiple fatals in a row. The latest:', error);
                return;
            }
            handlingFatal = true;
        }
        const client = getClient();
        if (!client) {
            debug.error('Sentry client is missing, the error event might be lost.', error);
            // If there is no client something is fishy, anyway we call the default handler
            defaultHandler(error, isFatal);
            return;
        }
        const hint = {
            originalException: error,
            attachments: getCurrentScope().getScopeData().attachments,
        };
        const event = yield client.eventFromException(error, hint);
        if (isFatal) {
            event.level = 'fatal';
            addExceptionMechanism(event, {
                handled: false,
                type: 'onerror',
            });
        }
        else {
            event.level = 'error';
            addExceptionMechanism(event, {
                handled: true,
                type: 'generic',
            });
        }
        client.captureEvent(event, hint);
        if (__DEV__) {
            // If in dev, we call the default handler anyway and hope the error will be sent
            // Just for a better dev experience
            defaultHandler(error, isFatal);
            return;
        }
        void client.flush(client.getOptions().shutdownTimeout || 2000).then(() => {
            defaultHandler(error, isFatal);
        }, (reason) => {
            debug.error('[ReactNativeErrorHandlers] Error while flushing the event cache after uncaught error.', reason);
        });
    }));
}
//# sourceMappingURL=reactnativeerrorhandlers.js.map