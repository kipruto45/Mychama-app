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
import { isExpoGo, notWeb } from '../utils/environment';
import { SDK_NAME, SDK_PACKAGE_NAME, SDK_VERSION } from '../version';
import { NATIVE } from '../wrapper';
const INTEGRATION_NAME = 'SdkInfo';
export const defaultSdkInfo = {
    name: SDK_NAME,
    packages: [
        {
            name: SDK_PACKAGE_NAME,
            version: SDK_VERSION,
        },
    ],
    version: SDK_VERSION,
};
/** Default SdkInfo instrumentation */
export const sdkInfoIntegration = () => {
    const fetchNativeSdkInfo = createCachedFetchNativeSdkInfo();
    return {
        name: INTEGRATION_NAME,
        setupOnce: () => {
            // noop
        },
        processEvent: (event) => processEvent(event, fetchNativeSdkInfo),
    };
};
function processEvent(event, fetchNativeSdkInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const nativeSdkPackage = yield fetchNativeSdkInfo();
        event.platform = event.platform || 'javascript';
        event.sdk = event.sdk || {};
        event.sdk.name = event.sdk.name || defaultSdkInfo.name;
        event.sdk.version = event.sdk.version || defaultSdkInfo.version;
        event.sdk.packages = [
            // default packages are added by js client and should not be added here
            ...(event.sdk.packages || []),
            ...((nativeSdkPackage && [nativeSdkPackage]) || []),
        ];
        return event;
    });
}
function createCachedFetchNativeSdkInfo() {
    if (!notWeb() || isExpoGo()) {
        return () => {
            return Promise.resolve(null);
        };
    }
    let isCached = false;
    let nativeSdkPackageCache = null;
    return () => __awaiter(this, void 0, void 0, function* () {
        if (isCached) {
            return nativeSdkPackageCache;
        }
        try {
            nativeSdkPackageCache = yield NATIVE.fetchNativeSdkInfo();
            isCached = true;
        }
        catch (e) {
            debug.warn('Could not fetch native sdk info.', e);
        }
        return nativeSdkPackageCache;
    });
}
//# sourceMappingURL=sdkinfo.js.map