import type { Envelope, Event, EventHint, SeverityLevel, TransportMakeRequestResponse, UserFeedback } from '@sentry/core';
import { Client } from '@sentry/core';
import type { ReactNativeClientOptions } from './options';
/**
 * The Sentry React Native SDK Client.
 *
 * @see ReactNativeClientOptions for documentation on configuration options.
 * @see SentryClient for usage documentation.
 */
export declare class ReactNativeClient extends Client<ReactNativeClientOptions> {
    private _outcomesBuffer;
    private _logFlushIdleTimeout;
    /**
     * Creates a new React Native SDK instance.
     * @param options Configuration options for this SDK.
     */
    constructor(options: ReactNativeClientOptions);
    /**
     * @inheritDoc
     */
    eventFromException(exception: unknown, hint?: EventHint): PromiseLike<Event>;
    /**
     * @inheritDoc
     */
    eventFromMessage(message: string, level?: SeverityLevel, hint?: EventHint): PromiseLike<Event>;
    /**
     * If native client is available it will trigger a native crash.
     * Use this only for testing purposes.
     */
    nativeCrash(): void;
    /**
     * @inheritDoc
     */
    close(): PromiseLike<boolean>;
    /**
     * Sends user feedback to Sentry.
     * @deprecated Use `Sentry.captureFeedback` instead.
     */
    captureUserFeedback(feedback: UserFeedback): void;
    /**
     * @inheritdoc
     */
    sendEnvelope(envelope: Envelope): PromiseLike<TransportMakeRequestResponse>;
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * Register a hook on this client.
     *
     * (Generic method signature to allow for custom React Native Client events.)
     */
    on(hook: string, callback: unknown): () => void;
    /**
     * Emit a hook that was previously registered via `on()`.
     *
     * (Generic method signature to allow for custom React Native Client events.)
     */
    emit(hook: string, ...rest: unknown[]): void;
    /**
     * Starts native client with dsn and options
     */
    private _initNativeSdk;
    /**
     * If the user is in development mode, and the native nagger is enabled then it will show an alert.
     */
    private _showCannotConnectDialog;
    /**
     * Attaches a client report from outcomes to the envelope.
     */
    private _attachClientReportTo;
}
//# sourceMappingURL=client.d.ts.map