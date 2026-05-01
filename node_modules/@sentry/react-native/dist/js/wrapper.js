var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { debug, normalize, SentryError } from '@sentry/core';
import { NativeModules, Platform } from 'react-native';
import { isHardCrash } from './misc';
import { encodeUTF8 } from './utils/encode';
import { isTurboModuleEnabled } from './utils/environment';
import { convertToNormalizedObject } from './utils/normalize';
import { ReactNativeLibraries } from './utils/rnlibraries';
import { base64StringFromByteArray } from './vendor';
/**
 * Returns the RNSentry module. Dynamically resolves if NativeModule or TurboModule is used.
 */
export function getRNSentryModule() {
    var _a;
    return isTurboModuleEnabled()
        ? (_a = ReactNativeLibraries.TurboModuleRegistry) === null || _a === void 0 ? void 0 : _a.get('RNSentry')
        : NativeModules.RNSentry;
}
const RNSentry = getRNSentryModule();
const EOL = encodeUTF8('\n');
/**
 * Our internal interface for calling native functions
 */
export const NATIVE = {
    fetchModules() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                throw this._DisabledNativeError;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                throw this._NativeClientError;
            }
            const raw = yield RNSentry.fetchModules();
            if (raw) {
                return JSON.parse(raw);
            }
            return null;
        });
    },
    /**
     * Sending the envelope over the bridge to native
     * @param envelope Envelope
     */
    sendEnvelope(envelope) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                debug.warn('Event was skipped as native SDK is not enabled.');
                return;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                throw this._NativeClientError;
            }
            const [envelopeHeader, envelopeItems] = envelope;
            const headerString = JSON.stringify(envelopeHeader);
            const headerBytes = encodeUTF8(headerString);
            let envelopeBytes = new Uint8Array(headerBytes.length + EOL.length);
            envelopeBytes.set(headerBytes);
            envelopeBytes.set(EOL, headerBytes.length);
            let hardCrashed = false;
            for (const rawItem of envelopeItems) {
                const [itemHeader, itemPayload] = this._processItem(rawItem);
                let bytesContentType;
                let bytesPayload;
                if (typeof itemPayload === 'string') {
                    bytesContentType = 'text/plain';
                    bytesPayload = encodeUTF8(itemPayload);
                }
                else if (itemPayload instanceof Uint8Array) {
                    bytesContentType =
                        typeof itemHeader.content_type === 'string' ? itemHeader.content_type : 'application/octet-stream';
                    bytesPayload = itemPayload;
                }
                else {
                    bytesContentType = 'application/vnd.sentry.items.log+json';
                    bytesPayload = encodeUTF8(JSON.stringify(itemPayload));
                    if (!hardCrashed) {
                        hardCrashed = isHardCrash(itemPayload);
                    }
                }
                // Content type is not inside BaseEnvelopeItemHeaders.
                itemHeader.content_type = bytesContentType;
                itemHeader.length = bytesPayload.length;
                const serializedItemHeader = JSON.stringify(itemHeader);
                const bytesItemHeader = encodeUTF8(serializedItemHeader);
                const newBytes = new Uint8Array(envelopeBytes.length + bytesItemHeader.length + EOL.length + bytesPayload.length + EOL.length);
                newBytes.set(envelopeBytes);
                newBytes.set(bytesItemHeader, envelopeBytes.length);
                newBytes.set(EOL, envelopeBytes.length + bytesItemHeader.length);
                newBytes.set(bytesPayload, envelopeBytes.length + bytesItemHeader.length + EOL.length);
                newBytes.set(EOL, envelopeBytes.length + bytesItemHeader.length + EOL.length + bytesPayload.length);
                envelopeBytes = newBytes;
            }
            yield RNSentry.captureEnvelope(base64StringFromByteArray(envelopeBytes), { hardCrashed });
        });
    },
    /**
     * Starts native with the provided options.
     * @param options ReactNativeClientOptions
     */
    initNativeSdk(originalOptions) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const options = Object.assign({ enableNative: true, autoInitializeNativeSdk: true }, originalOptions);
            if (!options.enableNative) {
                if (options.enableNativeNagger) {
                    debug.warn('Note: Native Sentry SDK is disabled.');
                }
                this.enableNative = false;
                return false;
            }
            if (!options.autoInitializeNativeSdk) {
                if (options.enableNativeNagger) {
                    debug.warn('Note: Native Sentry SDK was not initialized automatically, you will need to initialize it manually. If you wish to disable the native SDK and get rid of this warning, pass enableNative: false');
                }
                this.enableNative = true;
                return false;
            }
            if (!options.dsn) {
                debug.warn('Warning: No DSN was provided. The Sentry SDK will be disabled. Native SDK will also not be initalized.');
                this.enableNative = false;
                return false;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                throw this._NativeClientError;
            }
            const ignoreErrorsStr = (_a = options.ignoreErrors) === null || _a === void 0 ? void 0 : _a.filter(item => typeof item === 'string');
            const ignoreErrorsRegex = (_b = options.ignoreErrors) === null || _b === void 0 ? void 0 : _b.filter(item => item instanceof RegExp).map(item => item.source);
            if (ignoreErrorsStr && ignoreErrorsStr.length > 0) {
                options.ignoreErrorsStr = ignoreErrorsStr;
            }
            if (ignoreErrorsRegex && ignoreErrorsRegex.length > 0) {
                options.ignoreErrorsRegex = ignoreErrorsRegex;
            }
            // filter out all the options that would crash native.
            /* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
            const { beforeSend, beforeBreadcrumb, beforeSendTransaction, integrations, ignoreErrors } = options, filteredOptions = __rest(options, ["beforeSend", "beforeBreadcrumb", "beforeSendTransaction", "integrations", "ignoreErrors"]);
            /* eslint-enable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
            const nativeIsReady = yield RNSentry.initNativeSdk(filteredOptions);
            this.nativeIsReady = nativeIsReady;
            this.enableNative = true;
            return nativeIsReady;
        });
    },
    /**
     * Fetches the attributes to be set into logs from Native
     */
    fetchNativeLogAttributes() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                throw this._DisabledNativeError;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                throw this._NativeClientError;
            }
            return RNSentry.fetchNativeLogAttributes();
        });
    },
    /**
     * Fetches the release from native
     */
    fetchNativeRelease() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                throw this._DisabledNativeError;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                throw this._NativeClientError;
            }
            return RNSentry.fetchNativeRelease();
        });
    },
    /**
     * Fetches the Sdk info for the native sdk.
     */
    fetchNativeSdkInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                throw this._DisabledNativeError;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                throw this._NativeClientError;
            }
            return RNSentry.fetchNativeSdkInfo();
        });
    },
    /**
     * Fetches the device contexts. Not used on Android.
     */
    fetchNativeDeviceContexts() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                throw this._DisabledNativeError;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                throw this._NativeClientError;
            }
            return RNSentry.fetchNativeDeviceContexts();
        });
    },
    fetchNativeAppStart() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                debug.warn(this._DisabledNativeError);
                return null;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                debug.error(this._NativeClientError);
                return null;
            }
            return RNSentry.fetchNativeAppStart();
        });
    },
    fetchNativeFrames() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                throw this._DisabledNativeError;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                throw this._NativeClientError;
            }
            return RNSentry.fetchNativeFrames();
        });
    },
    /**
     * Triggers a native crash.
     * Use this only for testing purposes.
     */
    nativeCrash() {
        if (!this.enableNative) {
            return;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            throw this._NativeClientError;
        }
        RNSentry.crash();
    },
    /**
     * Sets the user in the native scope.
     * Passing null clears the user.
     */
    setUser(user) {
        if (!this.enableNative) {
            return;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            throw this._NativeClientError;
        }
        // separate and serialize all non-default user keys.
        let userKeys = null;
        let userDataKeys = null;
        if (user) {
            const { id, ip_address, email, username, segment } = user, otherKeys = __rest(user, ["id", "ip_address", "email", "username", "segment"]);
            // TODO: Update native impl to use geo
            const requiredUser = {
                id,
                ip_address,
                email,
                username,
                segment,
            };
            userKeys = this._serializeObject(requiredUser);
            userDataKeys = this._serializeObject(otherKeys);
        }
        RNSentry.setUser(userKeys, userDataKeys);
    },
    /**
     * Sets a tag in the native module.
     * @param key string
     * @param value string
     */
    setTag(key, value) {
        if (!this.enableNative) {
            return;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            throw this._NativeClientError;
        }
        const stringifiedValue = typeof value === 'string' ? value : JSON.stringify(value);
        RNSentry.setTag(key, stringifiedValue);
    },
    /**
     * Sets an extra in the native scope, will stringify
     * extra value if it isn't already a string.
     * @param key string
     * @param extra any
     */
    setExtra(key, extra) {
        if (!this.enableNative) {
            return;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            throw this._NativeClientError;
        }
        if (typeof extra === 'string') {
            return RNSentry.setExtra(key, extra);
        }
        if (typeof extra === 'undefined') {
            return RNSentry.setExtra(key, 'undefined');
        }
        let stringifiedExtra;
        try {
            const normalizedExtra = normalize(extra);
            stringifiedExtra = JSON.stringify(normalizedExtra);
        }
        catch (e) {
            debug.error('Extra for key ${key} not passed to native SDK, because it contains non-stringifiable values', e);
        }
        if (typeof stringifiedExtra === 'string') {
            return RNSentry.setExtra(key, stringifiedExtra);
        }
        return RNSentry.setExtra(key, '**non-stringifiable**');
    },
    /**
     * Adds breadcrumb to the native scope.
     * @param breadcrumb Breadcrumb
     */
    addBreadcrumb(breadcrumb) {
        if (!this.enableNative) {
            return;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            throw this._NativeClientError;
        }
        RNSentry.addBreadcrumb(Object.assign(Object.assign({}, breadcrumb), { 
            // Process and convert deprecated levels
            level: breadcrumb.level ? this._processLevel(breadcrumb.level) : undefined }));
    },
    /**
     * Clears breadcrumbs on the native scope.
     */
    clearBreadcrumbs() {
        if (!this.enableNative) {
            return;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            throw this._NativeClientError;
        }
        RNSentry.clearBreadcrumbs();
    },
    /**
     * Sets context on the native scope.
     * @param key string
     * @param context key-value map
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setContext(key, context) {
        if (!this.enableNative) {
            return;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            throw this._NativeClientError;
        }
        if (context === null) {
            return RNSentry.setContext(key, null);
        }
        let normalizedContext;
        try {
            normalizedContext = convertToNormalizedObject(context);
        }
        catch (e) {
            debug.error('Context for key ${key} not passed to native SDK, because it contains non-serializable values', e);
        }
        if (normalizedContext) {
            RNSentry.setContext(key, normalizedContext);
        }
        else {
            RNSentry.setContext(key, { error: '**non-serializable**' });
        }
    },
    /**
     * Closes the Native Layer SDK
     */
    closeNativeSdk() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                return;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                return;
            }
            return RNSentry.closeNativeSdk().then(() => {
                this.enableNative = false;
            });
        });
    },
    disableNativeFramesTracking() {
        if (!this.enableNative) {
            return;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            return;
        }
        RNSentry.disableNativeFramesTracking();
    },
    enableNativeFramesTracking() {
        if (!this.enableNative) {
            return;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            return;
        }
        RNSentry.enableNativeFramesTracking();
    },
    isNativeAvailable() {
        return this._isModuleLoaded(RNSentry);
    },
    captureScreenshot() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                debug.warn(this._DisabledNativeError);
                return null;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                debug.error(this._NativeClientError);
                return null;
            }
            let raw;
            try {
                raw = yield RNSentry.captureScreenshot();
            }
            catch (e) {
                debug.warn('Failed to capture screenshot', e);
            }
            if (raw) {
                return raw.map((item) => (Object.assign(Object.assign({}, item), { data: new Uint8Array(item.data) })));
            }
            else {
                return null;
            }
        });
    },
    fetchViewHierarchy() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                throw this._DisabledNativeError;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                throw this._NativeClientError;
            }
            const raw = yield RNSentry.fetchViewHierarchy();
            return raw ? new Uint8Array(raw) : null;
        });
    },
    startProfiling(platformProfilers) {
        if (!this.enableNative) {
            throw this._DisabledNativeError;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            throw this._NativeClientError;
        }
        const { started, error } = RNSentry.startProfiling(platformProfilers);
        if (started) {
            debug.log('[NATIVE] Start Profiling');
        }
        else {
            debug.error('[NATIVE] Start Profiling Failed', error);
        }
        return !!started;
    },
    stopProfiling() {
        if (!this.enableNative) {
            throw this._DisabledNativeError;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            throw this._NativeClientError;
        }
        const { profile, nativeProfile, androidProfile, error } = RNSentry.stopProfiling();
        if (!profile || error) {
            debug.error('[NATIVE] Stop Profiling Failed', error);
            return null;
        }
        if (Platform.OS === 'ios' && !nativeProfile) {
            debug.warn('[NATIVE] Stop Profiling Failed: No Native Profile');
        }
        if (Platform.OS === 'android' && !androidProfile) {
            debug.warn('[NATIVE] Stop Profiling Failed: No Android Profile');
        }
        try {
            return {
                hermesProfile: JSON.parse(profile),
                nativeProfile: nativeProfile,
                androidProfile: androidProfile,
            };
        }
        catch (e) {
            debug.error('[NATIVE] Failed to parse Hermes Profile JSON', e);
            return null;
        }
    },
    fetchNativePackageName() {
        if (!this.enableNative) {
            return null;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            return null;
        }
        return RNSentry.fetchNativePackageName() || null;
    },
    fetchNativeStackFramesBy(instructionsAddr) {
        if (!this.enableNative) {
            return null;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            return null;
        }
        return RNSentry.fetchNativeStackFramesBy(instructionsAddr) || null;
    },
    initNativeReactNavigationNewFrameTracking() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                return;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                return;
            }
            return RNSentry.initNativeReactNavigationNewFrameTracking();
        });
    },
    captureReplay(isHardCrash) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                debug.warn(`[NATIVE] \`${this.captureReplay.name}\` is not available when native is disabled.`);
                return Promise.resolve(null);
            }
            if (!this._isModuleLoaded(RNSentry)) {
                debug.warn(`[NATIVE] \`${this.captureReplay.name}\` is not available when native is not available.`);
                return Promise.resolve(null);
            }
            return (yield RNSentry.captureReplay(isHardCrash)) || null;
        });
    },
    getCurrentReplayId() {
        if (!this.enableNative) {
            debug.warn(`[NATIVE] \`${this.getCurrentReplayId.name}\` is not available when native is disabled.`);
            return null;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            debug.warn(`[NATIVE] \`${this.getCurrentReplayId.name}\` is not available when native is not available.`);
            return null;
        }
        return RNSentry.getCurrentReplayId() || null;
    },
    crashedLastRun() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                return null;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                return null;
            }
            const result = yield RNSentry.crashedLastRun();
            return typeof result === 'boolean' ? result : null;
        });
    },
    getNewScreenTimeToDisplay() {
        if (!this.enableNative || !this._isModuleLoaded(RNSentry)) {
            return Promise.resolve(null);
        }
        return RNSentry.getNewScreenTimeToDisplay();
    },
    getDataFromUri(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative || !this._isModuleLoaded(RNSentry)) {
                return null;
            }
            try {
                const data = yield RNSentry.getDataFromUri(uri);
                return new Uint8Array(data);
            }
            catch (error) {
                debug.error('Error:', error);
                return null;
            }
        });
    },
    popTimeToDisplayFor(key) {
        if (!this.enableNative || !this._isModuleLoaded(RNSentry)) {
            return Promise.resolve(null);
        }
        try {
            return RNSentry.popTimeToDisplayFor(key);
        }
        catch (error) {
            debug.error('Error:', error);
            return Promise.resolve(null);
        }
    },
    setActiveSpanId(spanId) {
        if (!this.enableNative || !this._isModuleLoaded(RNSentry)) {
            return undefined;
        }
        try {
            RNSentry.setActiveSpanId(spanId);
        }
        catch (error) {
            debug.error('Error:', error);
            return undefined;
        }
    },
    encodeToBase64(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative || !this._isModuleLoaded(RNSentry)) {
                return Promise.resolve(null);
            }
            try {
                const byteArray = Array.from(data);
                const base64 = yield RNSentry.encodeToBase64(byteArray);
                return base64 || null;
            }
            catch (error) {
                debug.error('Error:', error);
                return Promise.resolve(null);
            }
        });
    },
    primitiveProcessor: function (value) {
        return value;
    },
    /**
     * Gets the event from envelopeItem and applies the level filter to the selected event.
     * @param data An envelope item containing the event.
     * @returns The event from envelopeItem or undefined.
     */
    _processItem(item) {
        const [itemHeader, itemPayload] = item;
        if (itemHeader.type == 'event' || itemHeader.type == 'transaction') {
            const event = this._processLevels(itemPayload);
            if (NATIVE.platform === 'android') {
                if ('message' in event) {
                    // @ts-expect-error Android still uses the old message object, without this the serialization of events will break.
                    event.message = { message: event.message };
                }
            }
            return [itemHeader, event];
        }
        return item;
    },
    /**
     * Serializes all values of root-level keys into strings.
     * @param data key-value map.
     * @returns An object where all root-level values are strings.
     */
    _serializeObject(data) {
        const serialized = {};
        Object.keys(data).forEach(dataKey => {
            const value = data[dataKey];
            serialized[dataKey] = typeof value === 'string' ? value : JSON.stringify(value);
        });
        return serialized;
    },
    /**
     * Convert js severity level in event.level and event.breadcrumbs to more widely supported levels.
     * @param event
     * @returns Event with more widely supported Severity level strings
     */
    _processLevels(event) {
        var _a;
        const processed = Object.assign(Object.assign({}, event), { level: event.level ? this._processLevel(event.level) : undefined, breadcrumbs: (_a = event.breadcrumbs) === null || _a === void 0 ? void 0 : _a.map(breadcrumb => (Object.assign(Object.assign({}, breadcrumb), { level: breadcrumb.level ? this._processLevel(breadcrumb.level) : undefined }))) });
        return processed;
    },
    /**
     * Convert js severity level which has critical and log to more widely supported levels.
     * @param level
     * @returns More widely supported Severity level strings
     */
    _processLevel(level) {
        if (level == 'log') {
            return 'debug';
        }
        return level;
    },
    /**
     * Checks whether the RNSentry module is loaded.
     */
    _isModuleLoaded(module) {
        return !!module;
    },
    _setPrimitiveProcessor: function (processor) {
        this.primitiveProcessor = processor;
    },
    _DisabledNativeError: new SentryError('Native is disabled'),
    _NativeClientError: new SentryError("Native Client is not available, can't start on native."),
    enableNative: true,
    nativeIsReady: false,
    platform: Platform.OS,
};
/**
 * Fethces the data from the given uri in Uint8Array format.
 * @param uri string
 * @returns Uint8Array | null
 */
export function getDataFromUri(uri) {
    return __awaiter(this, void 0, void 0, function* () {
        return NATIVE.getDataFromUri(uri);
    });
}
//# sourceMappingURL=wrapper.js.map