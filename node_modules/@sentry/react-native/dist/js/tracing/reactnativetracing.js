/* eslint-disable max-lines */
import { instrumentOutgoingRequests } from '@sentry/browser';
import { getClient } from '@sentry/core';
import { isWeb } from '../utils/environment';
import { getDevServer } from './../integrations/debugsymbolicatorutils';
import { addDefaultOpForSpanFrom, addThreadInfoToSpan, defaultIdleOptions } from './span';
export const INTEGRATION_NAME = 'ReactNativeTracing';
function getDefaultTracePropagationTargets() {
    if (isWeb()) {
        return undefined;
    }
    return [/.*/];
}
export const defaultReactNativeTracingOptions = {
    // Fetch in React Native is a `whatwg-fetch` polyfill which uses XHR under the hood.
    // This causes duplicates when both `traceFetch` and `traceXHR` are enabled at the same time.
    // https://github.com/facebook/react-native/blob/28945c68da056ab2ac01de7e542a845b2bca6096/packages/react-native/Libraries/Network/fetch.js
    // (RN Web uses browsers native fetch implementation)
    traceFetch: isWeb() ? true : false,
    traceXHR: true,
    enableHTTPTimings: true,
};
export const reactNativeTracingIntegration = (options = {}) => {
    var _a, _b, _c, _d;
    const state = {
        currentRoute: undefined,
    };
    const finalOptions = Object.assign(Object.assign(Object.assign({}, defaultReactNativeTracingOptions), options), { beforeStartSpan: (_a = options.beforeStartSpan) !== null && _a !== void 0 ? _a : ((options) => options), finalTimeoutMs: (_b = options.finalTimeoutMs) !== null && _b !== void 0 ? _b : defaultIdleOptions.finalTimeout, idleTimeoutMs: (_c = options.idleTimeoutMs) !== null && _c !== void 0 ? _c : defaultIdleOptions.idleTimeout });
    const userShouldCreateSpanForRequest = finalOptions.shouldCreateSpanForRequest;
    // Drop Dev Server Spans
    const devServerUrl = (_d = getDevServer()) === null || _d === void 0 ? void 0 : _d.url;
    const finalShouldCreateSpanForRequest = devServerUrl === undefined
        ? userShouldCreateSpanForRequest
        : (url) => {
            if (url.startsWith(devServerUrl)) {
                return false;
            }
            if (userShouldCreateSpanForRequest) {
                return userShouldCreateSpanForRequest(url);
            }
            return true;
        };
    finalOptions.shouldCreateSpanForRequest = finalShouldCreateSpanForRequest;
    const setup = (client) => {
        addDefaultOpForSpanFrom(client);
        addThreadInfoToSpan(client);
        instrumentOutgoingRequests(client, {
            traceFetch: finalOptions.traceFetch,
            traceXHR: finalOptions.traceXHR,
            shouldCreateSpanForRequest: finalOptions.shouldCreateSpanForRequest,
            tracePropagationTargets: client.getOptions().tracePropagationTargets || getDefaultTracePropagationTargets(),
        });
    };
    const processEvent = (event) => {
        if (event.contexts && state.currentRoute) {
            event.contexts.app = Object.assign({ view_names: [state.currentRoute] }, event.contexts.app);
        }
        return event;
    };
    return {
        name: INTEGRATION_NAME,
        setup,
        processEvent,
        options: finalOptions,
        state,
        setCurrentRoute: (route) => {
            state.currentRoute = route;
        },
    };
};
/**
 * Returns the current React Native Tracing integration.
 */
export function getCurrentReactNativeTracingIntegration() {
    const client = getClient();
    if (!client) {
        return undefined;
    }
    return getReactNativeTracingIntegration(client);
}
/**
 * Returns React Native Tracing integration of given client.
 */
export function getReactNativeTracingIntegration(client) {
    return client.getIntegrationByName(INTEGRATION_NAME);
}
//# sourceMappingURL=reactnativetracing.js.map