/**
 * @license
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { AbstractDataConnectTransport, DataConnectResponse, SubscribeObserver } from '../transport';
import { DataConnectStreamRequest } from './wire';
/**
 * The base class for all {@link DataConnectStreamTransport | Stream Transport} implementations.
 * Handles management of logical streams (requests), authentication, data routing to query layer, etc.
 * @internal
 */
export declare abstract class AbstractDataConnectStreamTransport extends AbstractDataConnectTransport {
    /** Optional callback invoked when the stream closes gracefully. */
    onGracefulStreamClose?: () => void;
    /** True if the physical stream connection is fully open and ready to transmit data. */
    abstract get streamIsReady(): boolean;
    /** Is the stream currently waiting to close connection? */
    get isPendingClose(): boolean;
    private pendingClose;
    /** True if the transport is unable to connect to the server */
    isUnableToConnect: boolean;
    /** True if there are active subscriptions on the stream */
    get hasActiveSubscriptions(): boolean;
    /** True if there are active execute or mutation requests on the stream */
    get hasActiveExecuteRequests(): boolean;
    /**
     * Open a physical connection to the server.
     * @returns a promise which resolves when the connection is ready, or rejects if it fails to open.
     */
    protected abstract openConnection(): Promise<void>;
    /**
     * Close the physical connection with the server. Handles no cleanup - simply closes the
     * implementation-specific connection.
     * @returns a promise which resolves when the connection is closed, or rejects if it fails to close.
     * On failure to close, the connection is still considered closed.
     */
    protected abstract closeConnection(): Promise<void>;
    /**
     * Queue a message to be sent over the stream.
     * @param requestBody The body of the message to be sent.
     * @throws DataConnectError if sending fails.
     */
    protected abstract sendMessage<Variables>(requestBody: DataConnectStreamRequest<Variables>): Promise<void>;
    /**
     * Ensures that that there is an open connection. If there is none, it initiates a new one.
     * If a connection attempt is already in progress, it returns the existing connection promise.
     * @returns A promise that resolves when the stream is open and ready.
     */
    protected abstract ensureConnection(): Promise<void>;
    /** The request ID of the next message to be sent. Monotonically increasing sequence number. */
    private requestNumber;
    /**
     * Generates and returns the next request ID.
     */
    private nextRequestId;
    /**
     * Map of query/variables to their active execute/resume request bodies.
     */
    private activeQueryExecuteRequests;
    /**
     * Map of mutation/variables to their active execute request bodies.
     */
    private activeMutationExecuteRequests;
    /**
     * Map of query/variables to their active subscribe request bodies.
     */
    private activeSubscribeRequests;
    /**
     * Map of active execution RequestIds and their corresponding Promises and resolvers.
     */
    private executeRequestPromises;
    /**
     * Map of active subscription RequestIds and their corresponding observers.
     */
    private subscribeObservers;
    /** current close timeout from setTimeout(), if any */
    private closeTimeout;
    /** has the close timeout finished? */
    private closeTimeoutFinished;
    /** current auth uid. used to detect if a different user logs in */
    private authUid;
    /** Flag to ensure we wait for the initial auth state once per connection attempt. */
    private hasWaitedForInitialAuth;
    /**
     * Tracks a query execution request, storing the request body and creating and storing a promise that
     * will be resolved when the response is received.
     * @returns The reject function and the response promise.
     *
     * @remarks
     * This method returns a promise, but is synchronous.
     */
    private trackQueryExecuteRequest;
    /**
     * Tracks a mutation execution request, storing the request body and creating and storing a promise
     * that will be resolved when the response is received.
     * @returns The reject function and the response promise.
     *
     * @remarks
     * This method returns a promise, but is synchronous.
     */
    private trackMutationExecuteRequest;
    /**
     * Tracks a subscribe request, storing the request body and the notification observer.
     * @remarks
     * This method is synchronous.
     */
    private trackSubscribeRequest;
    /**
     * Cleans up the query execute request tracking data structures, deleting the tracked request and
     * it's associated promise.
     */
    private cleanupQueryExecuteRequest;
    /**
     * Cleans up the mutation execute request tracking data structures, deleting the tracked request and
     * it's associated promise.
     */
    private cleanupMutationExecuteRequest;
    /**
     * Cleans up the subscribe request tracking data structures, deleting the tracked request and
     * it's associated promise.
     */
    private cleanupSubscribeRequest;
    /**
     * Tracks if the next message to be sent is the first message of the stream.
     */
    private isFirstStreamMessage;
    /**
     * Tracks the last auth token sent to the server.
     * Used to detect if the token has changed and needs to be resent.
     */
    private lastSentAuthToken;
    /**
     * Indicates whether we should include the auth token in the next message.
     * Only true if there is an auth token and it is different from the last sent auth token, or this
     * is the first message.
     */
    private get shouldIncludeAuth();
    /**
     * Called by the concrete transport implementation when the physical connection is ready.
     */
    protected onConnectionReady(): void;
    /**
     * Attempt to close the connection. Will only close if there are no active requests preventing it
     * from doing so.
     */
    private attemptClose;
    /**
     * Begin closing the connection. Waits for and cleans up all active requests, and waits for
     * {@link IDLE_CONNECTION_TIMEOUT_MS}. This is a graceful close - it will be called when there are
     * no more active subscriptions, so there's no need to cleanup.
     */
    private prepareToCloseGracefully;
    /**
     * Cancel closing the connection.
     */
    private cancelClose;
    /**
     * Reject all active execute promises and notify all subscribe observers with the given error.
     * Clear active request tracking maps without cancelling or re-invoking any requests.
     */
    private rejectAllActiveRequests;
    /**
     * Called by concrete implementations when the stream is successfully closed, gracefully or otherwise.
     */
    protected onStreamClose(code: number, reason: string): void;
    /**
     * Prepares a stream request message by adding necessary headers and metadata.
     * If this is the first message on the stream, it includes the resource name, auth token, and App Check token.
     * If the auth token has refreshed since the last message, it includes the new auth token.
     *
     * This method is called by the concrete transport implementation before sending a message.
     *
     * @returns the requestBody, with attached headers and initial request fields
     */
    protected prepareMessage<Variables, StreamBody extends DataConnectStreamRequest<Variables>>(requestBody: StreamBody): StreamBody;
    /**
     * Sends a request message to the server via the concrete implementation.
     * Ensures the connection is ready and prepares the message before sending.
     * @returns A promise that resolves when the request message has been sent.
     */
    private sendRequestMessage;
    /**
     * Helper to generate a consistent string key for the tracking maps.
     */
    private getMapKey;
    /**
     * Recursively sorts the keys of an object.
     */
    private sortObjectKeys;
    /**
     * @inheritdoc
     * @remarks
     * This method synchronously updates the request tracking data structures before sending any message.
     * If any asynchronous functionality is added to this function, it MUST be done in a way that
     * preserves the synchronous update of the tracking data structures before the method returns.
     */
    invokeQuery<Data, Variables>(queryName: string, variables?: Variables): Promise<DataConnectResponse<Data>>;
    /**
     * @inheritdoc
     * @remarks
     * This method synchronously updates the request tracking data structures before sending any message.
     * If any asynchronous functionality is added to this function, it MUST be done in a way that
     * preserves the synchronous update of the tracking data structures before the method returns.
     */
    invokeMutation<Data, Variables>(mutationName: string, variables?: Variables): Promise<DataConnectResponse<Data>>;
    /**
     * @inheritdoc
     * @remarks
     * This method synchronously updates the request tracking data structures before sending any message
     * or cancelling the closing of the stream. If any asynchronous functionality is added to this function,
     * it MUST be done in a way that preserves the synchronous update of the tracking data structures
     * before the method returns.
     */
    invokeSubscribe<Data, Variables>(observer: SubscribeObserver<Data>, queryName: string, variables: Variables): void;
    /**
     * @inheritdoc
     * @remarks
     * This method synchronously updates the request tracking data structures before sending any message.
     * If any asynchronous functionality is added to this function, it MUST be done in a way that
     * preserves the synchronous update of the tracking data structures before the method returns.
     */
    invokeUnsubscribe<Variables>(queryName: string, variables: Variables): void;
    onAuthTokenChanged(newToken: string | null): void;
    /**
     * Handle a response message from the server. Called by the connection-specific implementation after
     * it's transformed a message from the server into a {@link DataConnectResponse}.
     * @param requestId the requestId associated with this response.
     * @param response the response from the server.
     */
    protected handleResponse<Data>(requestId: string, response: DataConnectResponse<Data>): Promise<void>;
}
