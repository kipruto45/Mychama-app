var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { debug, severityLevelFromString } from '@sentry/core';
import { AppState } from 'react-native';
import { breadcrumbFromObject } from '../breadcrumb';
import { NATIVE } from '../wrapper';
const INTEGRATION_NAME = 'DeviceContext';
/** Load device context from native. */
export const deviceContextIntegration = () => {
    return {
        name: INTEGRATION_NAME,
        setupOnce: () => {
            /* noop */
        },
        processEvent,
    };
};
function processEvent(event, _hint, client) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        let native = null;
        try {
            native = yield NATIVE.fetchNativeDeviceContexts();
        }
        catch (e) {
            debug.log(`Failed to get device context from native: ${e}`);
        }
        if (!native) {
            return event;
        }
        const nativeUser = native.user;
        if (!event.user && nativeUser) {
            event.user = nativeUser;
        }
        let nativeContexts = native.contexts;
        if (AppState.currentState !== 'unknown') {
            nativeContexts = nativeContexts || {};
            nativeContexts.app = Object.assign(Object.assign({}, nativeContexts.app), { in_foreground: AppState.currentState === 'active' });
        }
        if (nativeContexts) {
            event.contexts = Object.assign(Object.assign({}, nativeContexts), event.contexts);
            if (nativeContexts.app) {
                event.contexts.app = Object.assign(Object.assign({}, nativeContexts.app), event.contexts.app);
            }
        }
        const nativeTags = native.tags;
        if (nativeTags) {
            event.tags = Object.assign(Object.assign({}, nativeTags), event.tags);
        }
        const nativeExtra = native.extra;
        if (nativeExtra) {
            event.extra = Object.assign(Object.assign({}, nativeExtra), event.extra);
        }
        const nativeFingerprint = native.fingerprint;
        if (nativeFingerprint) {
            event.fingerprint = ((_a = event.fingerprint) !== null && _a !== void 0 ? _a : []).concat(nativeFingerprint.filter(item => { var _a; return ((_a = event.fingerprint) !== null && _a !== void 0 ? _a : []).indexOf(item) < 0; }));
        }
        const nativeLevel = typeof native['level'] === 'string' ? severityLevelFromString(native['level']) : undefined;
        if (!event.level && nativeLevel) {
            event.level = nativeLevel;
        }
        const nativeEnvironment = native['environment'];
        if (!event.environment && nativeEnvironment) {
            event.environment = nativeEnvironment;
        }
        const nativeBreadcrumbs = Array.isArray(native['breadcrumbs'])
            ? native['breadcrumbs'].map(breadcrumbFromObject)
            : undefined;
        if (nativeBreadcrumbs) {
            const maxBreadcrumbs = (_b = client === null || client === void 0 ? void 0 : client.getOptions().maxBreadcrumbs) !== null && _b !== void 0 ? _b : 100; // Default is 100.
            event.breadcrumbs = nativeBreadcrumbs
                .concat(event.breadcrumbs || []) // concatenate the native and js breadcrumbs
                .sort((a, b) => { var _a, _b; return ((_a = a.timestamp) !== null && _a !== void 0 ? _a : 0) - ((_b = b.timestamp) !== null && _b !== void 0 ? _b : 0); }) // sort by timestamp
                .slice(-maxBreadcrumbs); // keep the last maxBreadcrumbs
        }
        return event;
    });
}
//# sourceMappingURL=devicecontext.js.map