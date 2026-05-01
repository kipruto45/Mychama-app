import { eventFromException, eventFromMessage } from '@sentry/browser';
import { _INTERNAL_flushLogsBuffer, addAutoIpAddressToSession, Client, dateTimestampInSeconds, debug, SentryError, } from '@sentry/core';
import { Alert } from 'react-native';
import { getDevServer } from './integrations/debugsymbolicatorutils';
import { defaultSdkInfo } from './integrations/sdkinfo';
import { getDefaultSidecarUrl } from './integrations/spotlight';
import { MOBILE_REPLAY_INTEGRATION_NAME } from './replay/mobilereplay';
import { createUserFeedbackEnvelope, items } from './utils/envelope';
import { ignoreRequireCycleLogs } from './utils/ignorerequirecyclelogs';
import { mergeOutcomes } from './utils/outcome';
import { ReactNativeLibraries } from './utils/rnlibraries';
import { NATIVE } from './wrapper';
const DEFAULT_FLUSH_INTERVAL = 5000;
/**
 * The Sentry React Native SDK Client.
 *
 * @see ReactNativeClientOptions for documentation on configuration options.
 * @see SentryClient for usage documentation.
 */
export class ReactNativeClient extends Client {
    /**
     * Creates a new React Native SDK instance.
     * @param options Configuration options for this SDK.
     */
    constructor(options) {
        var _a, _b;
        ignoreRequireCycleLogs((_a = ReactNativeLibraries.ReactNativeVersion) === null || _a === void 0 ? void 0 : _a.version);
        options._metadata = options._metadata || {};
        options._metadata.sdk = options._metadata.sdk || defaultSdkInfo;
        // Only allow IP inferral by Relay if sendDefaultPii is true
        if ((_b = options._metadata) === null || _b === void 0 ? void 0 : _b.sdk) {
            options._metadata.sdk.settings = Object.assign({ infer_ip: options.sendDefaultPii ? 'auto' : 'never' }, options._metadata.sdk.settings);
        }
        // We default this to true, as it is the safer scenario
        options.parentSpanIsAlwaysRootSpan =
            options.parentSpanIsAlwaysRootSpan === undefined ? true : options.parentSpanIsAlwaysRootSpan;
        super(options);
        this._outcomesBuffer = [];
        if (options.sendDefaultPii === true) {
            this.on('beforeSendSession', addAutoIpAddressToSession);
        }
        if (options.enableLogs) {
            this.on('flush', () => {
                _INTERNAL_flushLogsBuffer(this);
            });
            this.on('afterCaptureLog', () => {
                if (this._logFlushIdleTimeout) {
                    clearTimeout(this._logFlushIdleTimeout);
                }
                this._logFlushIdleTimeout = setTimeout(() => {
                    _INTERNAL_flushLogsBuffer(this);
                }, DEFAULT_FLUSH_INTERVAL);
            });
        }
    }
    /**
     * @inheritDoc
     */
    eventFromException(exception, hint = {}) {
        return eventFromException(this._options.stackParser, exception, hint, this._options.attachStacktrace);
    }
    /**
     * @inheritDoc
     */
    eventFromMessage(message, level, hint) {
        return eventFromMessage(this._options.stackParser, message, level, hint, this._options.attachStacktrace);
    }
    /**
     * If native client is available it will trigger a native crash.
     * Use this only for testing purposes.
     */
    nativeCrash() {
        NATIVE.nativeCrash();
    }
    /**
     * @inheritDoc
     */
    close() {
        // As super.close() flushes queued events, we wait for that to finish before closing the native SDK.
        return super.close().then((result) => {
            return NATIVE.closeNativeSdk().then(() => result);
        });
    }
    /**
     * Sends user feedback to Sentry.
     * @deprecated Use `Sentry.captureFeedback` instead.
     */
    captureUserFeedback(feedback) {
        const envelope = createUserFeedbackEnvelope(feedback, {
            metadata: this._options._metadata,
            dsn: this.getDsn(),
            tunnel: undefined,
        });
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.sendEnvelope(envelope);
    }
    /**
     * @inheritdoc
     */
    sendEnvelope(envelope) {
        const outcomes = this._clearOutcomes();
        this._outcomesBuffer = mergeOutcomes(this._outcomesBuffer, outcomes);
        if (this._options.sendClientReports) {
            this._attachClientReportTo(this._outcomesBuffer, envelope);
        }
        let shouldClearOutcomesBuffer = true;
        if (this._isEnabled() && this._transport && this._dsn) {
            this.emit('beforeEnvelope', envelope);
            this._transport.send(envelope).then(null, reason => {
                if (reason instanceof SentryError) {
                    // SentryError is thrown by SyncPromise
                    shouldClearOutcomesBuffer = false;
                    // If this is called asynchronously we want the _outcomesBuffer to be cleared
                    debug.error('SentryError while sending event, keeping outcomes buffer:', reason);
                }
                else {
                    debug.error('Error while sending event:', reason);
                }
            });
        }
        else {
            debug.error('Transport disabled');
        }
        if (shouldClearOutcomesBuffer) {
            this._outcomesBuffer = []; // if send fails synchronously the _outcomesBuffer will stay intact
        }
        return Promise.resolve({});
    }
    /**
     * @inheritDoc
     */
    init() {
        super.init();
        this._initNativeSdk();
    }
    /**
     * Register a hook on this client.
     *
     * (Generic method signature to allow for custom React Native Client events.)
     */
    on(hook, callback) {
        // @ts-expect-error on from the base class doesn't support generic types
        return super.on(hook, callback);
    }
    /**
     * Emit a hook that was previously registered via `on()`.
     *
     * (Generic method signature to allow for custom React Native Client events.)
     */
    emit(hook, ...rest) {
        // @ts-expect-error emit from the base class doesn't support generic types
        super.emit(hook, ...rest);
    }
    /**
     * Starts native client with dsn and options
     */
    _initNativeSdk() {
        var _a;
        NATIVE.initNativeSdk(Object.assign(Object.assign({}, this._options), { defaultSidecarUrl: getDefaultSidecarUrl(), devServerUrl: ((_a = getDevServer()) === null || _a === void 0 ? void 0 : _a.url) || '', mobileReplayOptions: this._integrations[MOBILE_REPLAY_INTEGRATION_NAME] &&
                'options' in this._integrations[MOBILE_REPLAY_INTEGRATION_NAME]
                ? this._integrations[MOBILE_REPLAY_INTEGRATION_NAME].options
                : undefined }))
            .then((result) => {
            return result;
        }, () => {
            this._showCannotConnectDialog();
            return false;
        })
            .then((didCallNativeInit) => {
            var _a, _b;
            (_b = (_a = this._options).onReady) === null || _b === void 0 ? void 0 : _b.call(_a, { didCallNativeInit });
            this.emit('afterInit');
        })
            .then(undefined, error => {
            debug.error('The OnReady callback threw an error: ', error);
        });
    }
    /**
     * If the user is in development mode, and the native nagger is enabled then it will show an alert.
     */
    _showCannotConnectDialog() {
        if (__DEV__ && this._options.enableNativeNagger) {
            Alert.alert('Sentry', 'Warning, could not connect to Sentry native SDK.\nIf you do not want to use the native component please pass `enableNative: false` in the options.\nVisit: https://docs.sentry.io/platforms/react-native/ for more details.');
        }
    }
    /**
     * Attaches a client report from outcomes to the envelope.
     */
    _attachClientReportTo(outcomes, envelope) {
        if (outcomes.length > 0) {
            const clientReportItem = [
                { type: 'client_report' },
                {
                    timestamp: dateTimestampInSeconds(),
                    discarded_events: outcomes,
                },
            ];
            envelope[items].push(clientReportItem);
        }
    }
}
//# sourceMappingURL=client.js.map