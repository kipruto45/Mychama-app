import { debug, getClient } from '@sentry/core';
import { isWeb } from '../utils/environment';
import { fillTyped } from '../utils/fill';
import { ReactNativeLibraries } from '../utils/rnlibraries';
export const INTEGRATION_NAME = 'AppRegistry';
export const appRegistryIntegration = () => {
    const callbacks = [];
    return {
        name: INTEGRATION_NAME,
        setupOnce: () => {
            if (isWeb()) {
                return;
            }
            patchAppRegistryRunApplication(callbacks);
        },
        onRunApplication: (callback) => {
            if (callbacks.includes(callback)) {
                debug.log('[AppRegistryIntegration] Callback already registered.');
                return;
            }
            callbacks.push(callback);
        },
    };
};
export const patchAppRegistryRunApplication = (callbacks) => {
    const { AppRegistry } = ReactNativeLibraries;
    if (!AppRegistry) {
        return;
    }
    fillTyped(AppRegistry, 'runApplication', originalRunApplication => {
        return (...args) => {
            callbacks.forEach(callback => callback());
            return originalRunApplication(...args);
        };
    });
};
export const getAppRegistryIntegration = (client = getClient()) => {
    if (!client) {
        return undefined;
    }
    return client.getIntegrationByName(INTEGRATION_NAME);
};
//# sourceMappingURL=appRegistry.js.map