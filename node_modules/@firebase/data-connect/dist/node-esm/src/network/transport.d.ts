/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { DataConnectOptions, TransportOptions } from '../api/DataConnect';
import { AppCheckTokenProvider } from '../core/AppCheckTokenProvider';
import { AuthTokenProvider } from '../core/FirebaseAuthProvider';
/**
 * enum representing different flavors of the SDK used by developers
 * use the CallerSdkType for type-checking, and the CallerSdkTypeEnum for value-checking/assigning
 */
export type CallerSdkType = 'Base' | 'Generated' | 'TanstackReactCore' | 'GeneratedReact' | 'TanstackAngularCore' | 'GeneratedAngular';
export declare const CallerSdkTypeEnum: {
    readonly Base: "Base";
    readonly Generated: "Generated";
    readonly TanstackReactCore: "TanstackReactCore";
    readonly GeneratedReact: "GeneratedReact";
    readonly TanstackAngularCore: "TanstackAngularCore";
    readonly GeneratedAngular: "GeneratedAngular";
};
export interface DataConnectEntityArray {
    entityIds: string[];
}
export interface DataConnectSingleEntity {
    entityId: string;
}
export type DataConnectExtension = {
    path: Array<string | number>;
} & (DataConnectEntityArray | DataConnectSingleEntity);
/** @internal */
export interface DataConnectMaxAge {
    maxAge: string;
}
/** @internal */
export type DataConnectExtensionWithMaxAge = {
    path: Array<string | number>;
} & (DataConnectEntityArray | DataConnectSingleEntity | DataConnectMaxAge);
export interface Extensions {
    dataConnect?: DataConnectExtension[];
}
/** @internal */
export interface ExtensionsWithMaxAge {
    dataConnect?: DataConnectExtensionWithMaxAge[];
}
/** @internal */
export interface DataConnectResponse<T> {
    data: T;
    errors: Error[];
    extensions: Extensions;
}
/** @internal */
export interface DataConnectResponseWithMaxAge<T> {
    data: T;
    errors: Error[];
    extensions: ExtensionsWithMaxAge;
}
/**
 * Observer defined by the Query Layer for receiving notifications from the Transport Layer.
 * @internal
 */
export interface SubscribeObserver<Data> {
    onData(response: DataConnectResponse<Data>): Promise<void> | void;
    onDisconnect(code: string, reason: string): void;
    onError(error: Error): void;
}
/**
 * Interface defining the external API of the transport layer.
 * @internal
 */
export interface DataConnectTransportInterface {
    /**
     * Invoke a query execution request.
     * @param queryName The name of the query to execute.
     * @param body The variables associated with the query.
     * @returns A promise resolving to the DataConnectResponse.
     */
    invokeQuery<Data, Variables>(queryName: string, body?: Variables): Promise<DataConnectResponseWithMaxAge<Data>>;
    /**
     * Invoke a mutation execution request.
     * @param queryName The name of the mutation to execute.
     * @param body The variables associated with the mutation.
     * @returns A promise resolving to the DataConnectResponse.
     */
    invokeMutation<Data, Variables>(queryName: string, body?: Variables): Promise<DataConnectResponse<Data>>;
    /**
     * Subscribes to a query to receive push notifications of updates.
     * @param observer the observer passed to the transport layer to notify the query layer of events.
     * @param queryName The name of the query to subscribe to.
     * @param body The variables associated with the subscription.
     */
    invokeSubscribe<Data, Variables>(observer: SubscribeObserver<Data>, queryName: string, body?: Variables): void;
    /**
     * Unsubscribes from an active subscription.
     * @param queryName The name of the query to unsubscribe from.
     * @param body The variables associated with the subscription.
     */
    invokeUnsubscribe<Variables>(queryName: string, body?: Variables): void;
    /**
     * Configures the transport to use a local Data Connect emulator.
     * @param host The host address of the emulator (e.g., '127.0.0.1').
     * @param port The port number the emulator is listening on.
     * @param sslEnabled Whether to use SSL (HTTPS/WSS) for the emulator connection.
     */
    useEmulator(host: string, port?: number, sslEnabled?: boolean): void;
    /**
     * Callback invoked when the Firebase Auth token is refreshed or changed. Note that this callback
     * is called immediately asynchronously when the Auth Provider is initialized to provide
     * the initial auth state.
     * @param token The new access token or null if signed out.
     */
    onAuthTokenChanged: (token: string | null) => void;
    /**
     * Internal method to set the SDK type for metrics and logging purposes.
     * @param callerSdkType The type of SDK making the call (e.g., generated vs base).
     */
    _setCallerSdkType(callerSdkType: CallerSdkType): void;
}
/**
 * Type signature of a transport class constructor.
 * @internal
 */
export type TransportClass = new (options: DataConnectOptions, apiKey?: string, appId?: string, authProvider?: AuthTokenProvider, appCheckProvider?: AppCheckTokenProvider, transportOptions?: TransportOptions, _isUsingGen?: boolean, _callerSdkType?: CallerSdkType) => DataConnectTransportInterface;
/**
 * Constructs the value for the X-Goog-Api-Client header
 * @internal
 */
export declare function getGoogApiClientValue(isUsingGen: boolean, callerSdkType: CallerSdkType): string;
/**
 * The base class for all DataConnectTransportInterface implementations. Handles common logic such as
 * URL construction, auth token management, and emulator usage. Concrete transport implementations
 * should extend this class and implement the abstract {@link DataConnectTransportInterface} methods.
 * @internal
 */
export declare abstract class AbstractDataConnectTransport implements DataConnectTransportInterface {
    protected apiKey?: string | undefined;
    protected appId?: (string | null) | undefined;
    protected authProvider?: AuthTokenProvider | undefined;
    protected appCheckProvider?: AppCheckTokenProvider | undefined;
    protected _isUsingGen: boolean;
    protected _callerSdkType: CallerSdkType;
    protected _host: string;
    protected _port: number | undefined;
    protected _location: string;
    protected _connectorName: string;
    /** The resource path for requests from this Data Connect instance. */
    protected _connectorResourcePath: string;
    protected _secure: boolean;
    protected _project: string;
    protected _serviceName: string;
    protected _authToken: string | null;
    protected _appCheckToken: string | null | undefined;
    protected _lastToken: string | null;
    protected _isUsingEmulator: boolean;
    constructor(options: DataConnectOptions, apiKey?: string | undefined, appId?: (string | null) | undefined, authProvider?: AuthTokenProvider | undefined, appCheckProvider?: AppCheckTokenProvider | undefined, transportOptions?: TransportOptions | undefined, _isUsingGen?: boolean, _callerSdkType?: CallerSdkType);
    /** Get the endpoint URL this transport should use to communicate with the backend. */
    abstract get endpointUrl(): string;
    useEmulator(host: string, port?: number, isSecure?: boolean): void;
    getWithAuth(forceToken?: boolean): Promise<string | null>;
    withRetry<T>(promiseFactory: () => Promise<DataConnectResponse<T>>, retry?: boolean): Promise<DataConnectResponse<T>>;
    _setLastToken(lastToken: string | null): void;
    abstract invokeQuery<Data, Variables>(queryName: string, body?: Variables): Promise<DataConnectResponseWithMaxAge<Data>>;
    abstract invokeMutation<Data, Variables>(queryName: string, body?: Variables): Promise<DataConnectResponse<Data>>;
    abstract invokeSubscribe<Data, Variables>(observer: SubscribeObserver<Data>, queryName: string, body?: Variables): void;
    abstract invokeUnsubscribe<Variables>(queryName: string, variables: Variables): void;
    abstract onAuthTokenChanged(newToken: string | null): void;
    _setCallerSdkType(callerSdkType: CallerSdkType): void;
}
