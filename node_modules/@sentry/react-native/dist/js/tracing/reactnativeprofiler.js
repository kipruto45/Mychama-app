import { debug, timestampInSeconds } from '@sentry/core';
import { getClient, Profiler } from '@sentry/react';
import { getAppRegistryIntegration } from '../integrations/appRegistry';
import { createIntegration } from '../integrations/factory';
import { _captureAppStart, _setRootComponentCreationTimestampMs } from '../tracing/integrations/appStart';
const ReactNativeProfilerGlobalState = {
    appStartReported: false,
    onRunApplicationHook: () => {
        ReactNativeProfilerGlobalState.appStartReported = false;
    },
};
/**
 * Custom profiler for the React Native app root.
 */
export class ReactNativeProfiler extends Profiler {
    constructor(props) {
        _setRootComponentCreationTimestampMs(timestampInSeconds() * 1000);
        super(props);
        this.name = 'ReactNativeProfiler';
    }
    /**
     * Get the app root mount time.
     */
    componentDidMount() {
        super.componentDidMount();
        if (!ReactNativeProfilerGlobalState.appStartReported) {
            this._reportAppStart();
            ReactNativeProfilerGlobalState.appStartReported = true;
        }
    }
    /**
     * Notifies the Tracing integration that the app start has finished.
     */
    _reportAppStart() {
        var _a;
        const client = getClient();
        if (!client) {
            // We can't use logger here because this will be logged before the `Sentry.init`.
            // eslint-disable-next-line no-console
            __DEV__ && console.warn('App Start Span could not be finished. `Sentry.wrap` was called before `Sentry.init`.');
            return;
        }
        (_a = client.addIntegration) === null || _a === void 0 ? void 0 : _a.call(client, createIntegration(this.name));
        const appRegistryIntegration = getAppRegistryIntegration(client);
        if (appRegistryIntegration && typeof appRegistryIntegration.onRunApplication === 'function') {
            appRegistryIntegration.onRunApplication(ReactNativeProfilerGlobalState.onRunApplicationHook);
        }
        else {
            debug.warn('AppRegistryIntegration.onRunApplication not found or invalid.');
        }
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        _captureAppStart({ isManual: false });
    }
}
//# sourceMappingURL=reactnativeprofiler.js.map