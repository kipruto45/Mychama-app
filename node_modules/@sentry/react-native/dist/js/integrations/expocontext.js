import { debug } from '@sentry/core';
import { isExpo, isExpoGo } from '../utils/environment';
import { getExpoDevice, getExpoUpdates } from '../utils/expomodules';
import { NATIVE } from '../wrapper';
const INTEGRATION_NAME = 'ExpoContext';
export const OTA_UPDATES_CONTEXT_KEY = 'ota_updates';
/** Load device context from expo modules. */
export const expoContextIntegration = () => {
    let _expoUpdatesContextCached;
    function setup(client) {
        client.on('afterInit', () => {
            if (!client.getOptions().enableNative) {
                return;
            }
            setExpoUpdatesNativeContext();
        });
    }
    function setExpoUpdatesNativeContext() {
        if (!isExpo() || isExpoGo()) {
            return;
        }
        const expoUpdates = getExpoUpdatesContextCached();
        try {
            // Ensures native errors and crashes have the same context as JS errors
            NATIVE.setContext(OTA_UPDATES_CONTEXT_KEY, expoUpdates);
        }
        catch (error) {
            debug.error('Error setting Expo updates context:', error);
        }
    }
    function processEvent(event) {
        if (!isExpo()) {
            return event;
        }
        addExpoGoContext(event);
        addExpoUpdatesContext(event);
        return event;
    }
    function addExpoUpdatesContext(event) {
        event.contexts = event.contexts || {};
        event.contexts[OTA_UPDATES_CONTEXT_KEY] = Object.assign({}, getExpoUpdatesContextCached());
    }
    function getExpoUpdatesContextCached() {
        if (_expoUpdatesContextCached) {
            return _expoUpdatesContextCached;
        }
        return (_expoUpdatesContextCached = getExpoUpdatesContext());
    }
    return {
        name: INTEGRATION_NAME,
        setup,
        processEvent,
    };
};
/**
 * @internal Exposed for testing purposes
 */
export function getExpoUpdatesContext() {
    const expoUpdates = getExpoUpdates();
    if (!expoUpdates) {
        return {
            is_enabled: false,
        };
    }
    const updatesContext = {
        is_enabled: !!expoUpdates.isEnabled,
        is_embedded_launch: !!expoUpdates.isEmbeddedLaunch,
        is_emergency_launch: !!expoUpdates.isEmergencyLaunch,
        is_using_embedded_assets: !!expoUpdates.isUsingEmbeddedAssets,
    };
    if (typeof expoUpdates.updateId === 'string' && expoUpdates.updateId) {
        updatesContext.update_id = expoUpdates.updateId.toLowerCase();
    }
    if (typeof expoUpdates.channel === 'string' && expoUpdates.channel) {
        updatesContext.channel = expoUpdates.channel.toLowerCase();
    }
    if (typeof expoUpdates.runtimeVersion === 'string' && expoUpdates.runtimeVersion) {
        updatesContext.runtime_version = expoUpdates.runtimeVersion.toLowerCase();
    }
    if (typeof expoUpdates.checkAutomatically === 'string' && expoUpdates.checkAutomatically) {
        updatesContext.check_automatically = expoUpdates.checkAutomatically.toLowerCase();
    }
    if (typeof expoUpdates.emergencyLaunchReason === 'string' && expoUpdates.emergencyLaunchReason) {
        updatesContext.emergency_launch_reason = expoUpdates.emergencyLaunchReason;
    }
    if (typeof expoUpdates.launchDuration === 'number') {
        updatesContext.launch_duration = expoUpdates.launchDuration;
    }
    if (expoUpdates.createdAt instanceof Date) {
        updatesContext.created_at = expoUpdates.createdAt.toISOString();
    }
    return updatesContext;
}
function addExpoGoContext(event) {
    if (!isExpoGo()) {
        return;
    }
    const expoDeviceContext = getExpoDeviceContext();
    if (expoDeviceContext) {
        event.contexts = event.contexts || {};
        event.contexts.device = Object.assign(Object.assign({}, expoDeviceContext), event.contexts.device);
    }
    const expoOsContext = getExpoOsContext();
    if (expoOsContext) {
        event.contexts = event.contexts || {};
        event.contexts.os = Object.assign(Object.assign({}, expoOsContext), event.contexts.os);
    }
}
/**
 * Returns the Expo Device context if present
 */
function getExpoDeviceContext() {
    const expoDevice = getExpoDevice();
    if (!expoDevice) {
        return undefined;
    }
    return {
        name: expoDevice.deviceName,
        simulator: !(expoDevice === null || expoDevice === void 0 ? void 0 : expoDevice.isDevice),
        model: expoDevice.modelName,
        manufacturer: expoDevice.manufacturer,
        memory_size: expoDevice.totalMemory,
    };
}
/**
 * Returns the Expo OS context if present
 */
function getExpoOsContext() {
    const expoDevice = getExpoDevice();
    if (!expoDevice) {
        return undefined;
    }
    return {
        build: expoDevice.osBuildId,
        version: expoDevice.osVersion,
        name: expoDevice.osName,
    };
}
//# sourceMappingURL=expocontext.js.map