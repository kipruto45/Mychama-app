var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { debug, getClient, getGlobalScope, getIntegrationsToSetup, getIsolationScope, initAndBind, makeDsn, stackParserFromStackParserOptions, withScope as coreWithScope, } from '@sentry/core';
import { defaultStackParser, makeFetchTransport, Profiler } from '@sentry/react';
import * as React from 'react';
import { ReactNativeClient } from './client';
import { FeedbackWidgetProvider } from './feedback/FeedbackWidgetProvider';
import { getDevServer } from './integrations/debugsymbolicatorutils';
import { getDefaultIntegrations } from './integrations/default';
import { shouldEnableNativeNagger } from './options';
import { enableSyncToNative } from './scopeSync';
import { TouchEventBoundary } from './touchevents';
import { ReactNativeProfiler } from './tracing';
import { useEncodePolyfill } from './transports/encodePolyfill';
import { DEFAULT_BUFFER_SIZE, makeNativeTransportFactory } from './transports/native';
import { getDefaultEnvironment, isExpoGo, isRunningInMetroDevServer, isWeb } from './utils/environment';
import { getDefaultRelease } from './utils/release';
import { safeFactory, safeTracesSampler } from './utils/safe';
import { NATIVE } from './wrapper';
const DEFAULT_OPTIONS = {
    enableNativeCrashHandling: true,
    enableNativeNagger: true,
    autoInitializeNativeSdk: true,
    enableAutoPerformanceTracing: true,
    enableWatchdogTerminationTracking: true,
    patchGlobalPromise: true,
    sendClientReports: true,
    maxQueueSize: DEFAULT_BUFFER_SIZE,
    attachStacktrace: true,
    enableCaptureFailedRequests: false,
    enableNdk: true,
    enableAppStartTracking: true,
    enableNativeFramesTracking: true,
    enableStallTracking: true,
    enableUserInteractionTracing: false,
};
/**
 * Inits the SDK and returns the final options.
 */
export function init(passedOptions) {
    var _a, _b, _c, _d, _e, _f;
    if (isRunningInMetroDevServer()) {
        return;
    }
    const maxQueueSize = (_c = (_a = passedOptions.maxQueueSize) !== null && _a !== void 0 ? _a : (_b = passedOptions.transportOptions) === null || _b === void 0 ? void 0 : _b.bufferSize) !== null && _c !== void 0 ? _c : DEFAULT_OPTIONS.maxQueueSize;
    const enableNative = passedOptions.enableNative === undefined || passedOptions.enableNative
        ? NATIVE.isNativeAvailable()
        : false;
    useEncodePolyfill();
    if (enableNative) {
        enableSyncToNative(getGlobalScope());
        enableSyncToNative(getIsolationScope());
    }
    const getURLFromDSN = (dsn) => {
        if (!dsn) {
            return undefined;
        }
        const dsnComponents = makeDsn(dsn);
        if (!dsnComponents) {
            debug.error('Failed to extract url from DSN: ', dsn);
            return undefined;
        }
        const port = dsnComponents.port ? `:${dsnComponents.port}` : '';
        return `${dsnComponents.protocol}://${dsnComponents.host}${port}`;
    };
    const userBeforeBreadcrumb = safeFactory(passedOptions.beforeBreadcrumb, { loggerMessage: 'The beforeBreadcrumb threw an error' });
    // Exclude Dev Server and Sentry Dsn request from Breadcrumbs
    const devServerUrl = (_d = getDevServer()) === null || _d === void 0 ? void 0 : _d.url;
    const dsn = getURLFromDSN(passedOptions.dsn);
    const defaultBeforeBreadcrumb = (breadcrumb, _hint) => {
        var _a;
        const type = breadcrumb.type || '';
        const url = typeof ((_a = breadcrumb.data) === null || _a === void 0 ? void 0 : _a.url) === 'string' ? breadcrumb.data.url : '';
        if (type === 'http' && ((devServerUrl && url.startsWith(devServerUrl)) || (dsn && url.startsWith(dsn)))) {
            return null;
        }
        return breadcrumb;
    };
    const chainedBeforeBreadcrumb = (breadcrumb, hint) => {
        let modifiedBreadcrumb = breadcrumb;
        if (userBeforeBreadcrumb) {
            const result = userBeforeBreadcrumb(breadcrumb, hint);
            if (result === null) {
                return null;
            }
            modifiedBreadcrumb = result;
        }
        return defaultBeforeBreadcrumb(modifiedBreadcrumb, hint);
    };
    const options = Object.assign(Object.assign(Object.assign({}, DEFAULT_OPTIONS), passedOptions), { release: (_e = passedOptions.release) !== null && _e !== void 0 ? _e : getDefaultRelease(), enableNative, enableNativeNagger: shouldEnableNativeNagger(passedOptions.enableNativeNagger), 
        // If custom transport factory fails the SDK won't initialize
        transport: passedOptions.transport
            || makeNativeTransportFactory({
                enableNative,
            })
            || makeFetchTransport, transportOptions: Object.assign(Object.assign(Object.assign({}, DEFAULT_OPTIONS.transportOptions), ((_f = passedOptions.transportOptions) !== null && _f !== void 0 ? _f : {})), { bufferSize: maxQueueSize }), maxQueueSize, integrations: [], stackParser: stackParserFromStackParserOptions(passedOptions.stackParser || defaultStackParser), beforeBreadcrumb: chainedBeforeBreadcrumb, initialScope: safeFactory(passedOptions.initialScope, { loggerMessage: 'The initialScope threw an error' }) });
    if ('tracesSampler' in options) {
        options.tracesSampler = safeTracesSampler(options.tracesSampler);
    }
    if (!('environment' in options)) {
        options.environment = getDefaultEnvironment();
    }
    const defaultIntegrations = passedOptions.defaultIntegrations === undefined
        ? getDefaultIntegrations(options)
        : passedOptions.defaultIntegrations;
    options.integrations = getIntegrationsToSetup({
        integrations: safeFactory(passedOptions.integrations, { loggerMessage: 'The integrations threw an error' }),
        defaultIntegrations,
    });
    initAndBind(ReactNativeClient, options);
    if (isExpoGo()) {
        debug.log('Offline caching, native errors features are not available in Expo Go.');
        debug.log('Use EAS Build / Native Release Build to test these features.');
    }
}
/**
 * Inits the Sentry React Native SDK with automatic instrumentation and wrapped features.
 */
export function wrap(RootComponent, options) {
    var _a;
    const profilerProps = Object.assign(Object.assign({}, (options === null || options === void 0 ? void 0 : options.profilerProps)), { name: (_a = RootComponent.displayName) !== null && _a !== void 0 ? _a : 'Root', updateProps: {} });
    const ProfilerComponent = isWeb() ? Profiler : ReactNativeProfiler;
    const RootApp = appProps => {
        var _a;
        return (React.createElement(TouchEventBoundary, Object.assign({}, ((_a = options === null || options === void 0 ? void 0 : options.touchEventBoundaryProps) !== null && _a !== void 0 ? _a : {})),
            React.createElement(ProfilerComponent, Object.assign({}, profilerProps),
                React.createElement(FeedbackWidgetProvider, null,
                    React.createElement(RootComponent, Object.assign({}, appProps))))));
    };
    return RootApp;
}
/**
 * If native client is available it will trigger a native crash.
 * Use this only for testing purposes.
 */
export function nativeCrash() {
    NATIVE.nativeCrash();
}
/**
 * Flushes all pending events in the queue to disk.
 * Use this before applying any realtime updates such as code-push or expo updates.
 */
export function flush() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const client = getClient();
            if (client) {
                const result = yield client.flush();
                return result;
            }
            // eslint-disable-next-line no-empty
        }
        catch (_) { }
        debug.error('Failed to flush the event queue.');
        return false;
    });
}
/**
 * Closes the SDK, stops sending events.
 */
export function close() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const client = getClient();
            if (client) {
                yield client.close();
            }
        }
        catch (e) {
            debug.error('Failed to close the SDK');
        }
    });
}
/**
 * Creates a new scope with and executes the given operation within.
 * The scope is automatically removed once the operation
 * finishes or throws.
 *
 * This is essentially a convenience function for:
 *
 *     pushScope();
 *     callback();
 *     popScope();
 *
 * @param callback that will be enclosed into push/popScope.
 */
export function withScope(callback) {
    const safeCallback = (scope) => {
        try {
            return callback(scope);
        }
        catch (e) {
            debug.error('Error while running withScope callback', e);
            return undefined;
        }
    };
    return coreWithScope(safeCallback);
}
/**
 * Returns if the app crashed in the last run.
 */
export function crashedLastRun() {
    return __awaiter(this, void 0, void 0, function* () {
        return NATIVE.crashedLastRun();
    });
}
//# sourceMappingURL=sdk.js.map