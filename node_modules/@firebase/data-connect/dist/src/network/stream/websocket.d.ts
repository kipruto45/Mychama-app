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
import { DataConnectOptions, TransportOptions } from '../../api/DataConnect';
import { AppCheckTokenProvider } from '../../core/AppCheckTokenProvider';
import { AuthTokenProvider } from '../../core/FirebaseAuthProvider';
import { CallerSdkType } from '../transport';
import { AbstractDataConnectStreamTransport } from './streamTransport';
import { DataConnectStreamRequest } from './wire';
/**
 * This function is ONLY used for testing and for ensuring compatability in environments which may
 * be using a poyfill and/or bundlers. It should not be called by users of the Firebase JS SDK.
 * @internal
 */
export declare function initializeWebSocket(webSocketImpl: typeof WebSocket): void;
/**
 * The code used to close the WebSocket connection.
 * This is a protocol-level code, and is not the same as the {@link Code | DataConnect error code}.
 * @internal
 */
export declare const WEBSOCKET_CLOSE_CODE = 1000;
/**
 * An {@link AbstractDataConnectStreamTransport | Stream Transport} implementation that uses {@link WebSocket | WebSockets} to stream requests and responses.
 * This class handles the lifecycle of the WebSocket connection, including automatic
 * reconnection and request correlation.
 * @internal
 */
export declare class WebSocketTransport extends AbstractDataConnectStreamTransport {
    protected apiKey?: string | undefined;
    protected appId?: (string | null) | undefined;
    protected authProvider?: AuthTokenProvider | undefined;
    protected appCheckProvider?: AppCheckTokenProvider | undefined;
    protected _isUsingGen: boolean;
    protected _callerSdkType: CallerSdkType;
    get endpointUrl(): string;
    /** Decodes binary WebSocket responses to strings */
    private decoder;
    /**
     * Decodes a WebSocket response from a Uint8Array to a JSON object.
     * Emulator does not send messages as Uint8Arrays, but prod does.
     */
    private decodeBinaryResponse;
    /** The current connection to the server. Undefined if disconnected. */
    private connection;
    get streamIsReady(): boolean;
    /**
     * Current connection attempt. If null, we are not currently attemping to connect (not connected,
     * or already connected). Will be resolved or rejected when the connection is opened or fails to open.
     */
    private connectionAttempt;
    constructor(options: DataConnectOptions, apiKey?: string | undefined, appId?: (string | null) | undefined, authProvider?: AuthTokenProvider | undefined, appCheckProvider?: AppCheckTokenProvider | undefined, transportOptions?: TransportOptions | undefined, _isUsingGen?: boolean, _callerSdkType?: CallerSdkType);
    protected ensureConnection(): Promise<void>;
    protected openConnection(): Promise<void>;
    protected closeConnection(code?: number, reason?: string): Promise<void>;
    /**
     * Handle a disconnection from the server. Initiates graceful clean up and reconnection attempts.
     * @param ev the {@link CloseEvent} that closed the WebSocket.
     */
    private handleWebsocketDisconnect;
    /**
     * Handle an error that occurred on the WebSocket. Close the connection and reject all active requests.
     */
    private handleError;
    protected sendMessage<Variables>(requestBody: DataConnectStreamRequest<Variables>): Promise<void>;
    /**
     * Handles incoming WebSocket messages.
     * @param ev The {@link MessageEvent} from the WebSocket.
     */
    private handleWebSocketMessage;
    /**
     * Parse a response from the server. Assert that it has a {@link DataConnectStreamResponse.requestId | requestId}.
     * @param data the message from the server to be parsed
     * @returns the parsed message as a {@link DataConnectStreamResponse}
     * @throws {DataConnectError} if parsing fails or message is malformed.
     */
    private parseWebSocketData;
}
