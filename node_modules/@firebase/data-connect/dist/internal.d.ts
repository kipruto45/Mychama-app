/**
 * Firebase Data Connect
 *
 * @packageDocumentation
 */

import { AppCheckInternalComponentName } from '@firebase/app-check-interop-types';
import { AppCheckTokenListener } from '@firebase/app-check-interop-types';
import { AppCheckTokenResult } from '@firebase/app-check-interop-types';
import { FirebaseApp } from '@firebase/app';
import { FirebaseAuthInternal } from '@firebase/auth-interop-types';
import { FirebaseAuthInternalName } from '@firebase/auth-interop-types';
import { FirebaseAuthTokenData } from '@firebase/auth-interop-types';
import { FirebaseError } from '@firebase/util';
import { LogLevelString } from '@firebase/logger';
import { Provider } from '@firebase/component';

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

/**
 * @internal
 * Abstraction around AppCheck's token fetching capabilities.
 */
declare class AppCheckTokenProvider {
    private appCheckProvider?;
    private appCheck?;
    private serverAppAppCheckToken?;
    constructor(app: FirebaseApp, appCheckProvider?: Provider<AppCheckInternalComponentName> | undefined);
    getToken(): Promise<AppCheckTokenResult | null>;
    addTokenChangeListener(listener: AppCheckTokenListener): void;
}

/**
 * @internal
 * @param transportOptions1
 * @param transportOptions2
 * @returns
 */
export declare function areTransportOptionsEqual(transportOptions1: TransportOptions, transportOptions2: TransportOptions): boolean;

declare type AuthTokenListener = (token: string | null) => void;

declare interface AuthTokenProvider {
    getToken(forceRefresh: boolean): Promise<FirebaseAuthTokenData | null>;
    addTokenChangeListener(listener: AuthTokenListener): void;
    getAuth(): FirebaseAuthInternal;
}

export declare interface CacheProvider<T extends StorageType> {
    type: T;
    /**
     * @internal
     */
    initialize(cacheId: string): InternalCacheProvider;
}

export declare interface CacheSettings {
    cacheProvider: CacheProvider<StorageType>;
    maxAgeSeconds?: number;
}

/**
 * enum representing different flavors of the SDK used by developers
 * use the CallerSdkType for type-checking, and the CallerSdkTypeEnum for value-checking/assigning
 */
export declare type CallerSdkType = 'Base' | 'Generated' | 'TanstackReactCore' | 'GeneratedReact' | 'TanstackAngularCore' | 'GeneratedAngular';

export declare const CallerSdkTypeEnum: {
    readonly Base: "Base";
    readonly Generated: "Generated";
    readonly TanstackReactCore: "TanstackReactCore";
    readonly GeneratedReact: "GeneratedReact";
    readonly TanstackAngularCore: "TanstackAngularCore";
    readonly GeneratedAngular: "GeneratedAngular";
};

export declare type Code = DataConnectErrorCode;

export declare const Code: {
    OTHER: DataConnectErrorCode;
    ALREADY_INITIALIZED: DataConnectErrorCode;
    NOT_INITIALIZED: DataConnectErrorCode;
    NOT_SUPPORTED: DataConnectErrorCode;
    INVALID_ARGUMENT: DataConnectErrorCode;
    PARTIAL_ERROR: DataConnectErrorCode;
    UNAUTHORIZED: DataConnectErrorCode;
};

/**
 * Connect to the DataConnect Emulator
 * @param dc Data Connect instance
 * @param host host of emulator server
 * @param port port of emulator server
 * @param sslEnabled use https
 */
export declare function connectDataConnectEmulator(dc: DataConnect, host: string, port?: number, sslEnabled?: boolean): void;

/**
 * Connector Config for calling Data Connect backend.
 */
export declare interface ConnectorConfig {
    location: string;
    connector: string;
    service: string;
}

/**
 * Class representing Firebase Data Connect
 */
export declare class DataConnect {
    readonly app: FirebaseApp;
    private readonly dataConnectOptions;
    private readonly _authProvider;
    private readonly _appCheckProvider;
    _queryManager: QueryManager;
    _mutationManager: MutationManager;
    isEmulator: boolean;
    _initialized: boolean;
    private _transport;
    private _transportClass;
    private _transportOptions?;
    private _authTokenProvider?;
    _isUsingGeneratedSdk: boolean;
    _callerSdkType: CallerSdkType;
    private _appCheckTokenProvider?;
    private _cacheSettings?;
    /**
     * @internal
     */
    private cache?;
    constructor(app: FirebaseApp, dataConnectOptions: DataConnectOptions, _authProvider: Provider<FirebaseAuthInternalName>, _appCheckProvider: Provider<AppCheckInternalComponentName>);
    /**
     * @internal
     */
    getCache(): DataConnectCache | undefined;
    _useGeneratedSdk(): void;
    _setCallerSdkType(callerSdkType: CallerSdkType): void;
    _delete(): Promise<void>;
    getSettings(): ConnectorConfig;
    /**
     * @internal
     */
    setCacheSettings(cacheSettings: CacheSettings): void;
    setInitialized(): void;
    enableEmulator(transportOptions: TransportOptions): void;
}

declare class DataConnectCache {
    private authProvider;
    private projectId;
    private connectorConfig;
    private host;
    cacheSettings: CacheSettings;
    private cacheProvider;
    private uid;
    constructor(authProvider: AuthTokenProvider, projectId: string, connectorConfig: ConnectorConfig, host: string, cacheSettings: CacheSettings);
    initialize(): Promise<void>;
    getIdentifier(uid: string | null): Promise<string>;
    initializeNewProviders(identifier: string): InternalCacheProvider;
    containsResultTree(queryId: string): Promise<boolean>;
    getResultTree(queryId: string): Promise<ResultTree | undefined>;
    getResultJSON(queryId: string): Promise<Record<string, unknown>>;
    update(queryId: string, serverValues: ServerValues, entityIds: Record<string, unknown>): Promise<string[]>;
}

export declare interface DataConnectEntityArray {
    entityIds: string[];
}

/** An error returned by a DataConnect operation. */
export declare class DataConnectError extends FirebaseError {
    /** @internal */
    readonly name: string;
    constructor(code: Code, message: string);
    /** @internal */
    toString(): string;
}

export declare type DataConnectErrorCode = 'other' | 'already-initialized' | 'not-initialized' | 'not-supported' | 'invalid-argument' | 'partial-error' | 'unauthorized';

export declare type DataConnectExtension = {
    path: Array<string | number>;
} & (DataConnectEntityArray | DataConnectSingleEntity);

/** @internal */
export declare type DataConnectExtensionWithMaxAge = {
    path: Array<string | number>;
} & (DataConnectEntityArray | DataConnectSingleEntity | DataConnectMaxAge);

/** @internal */
export declare interface DataConnectMaxAge {
    maxAge: string;
}

/** An error returned by a DataConnect operation. */
export declare class DataConnectOperationError extends DataConnectError {
    /** @internal */
    readonly name: string;
    /** The response received from the backend. */
    readonly response: DataConnectOperationFailureResponse;
    /** @hideconstructor */
    constructor(message: string, response: DataConnectOperationFailureResponse);
}

export declare interface DataConnectOperationFailureResponse {
    readonly data?: Record<string, unknown> | null;
    readonly errors: DataConnectOperationFailureResponseErrorInfo[];
}

export declare interface DataConnectOperationFailureResponseErrorInfo {
    readonly message: string;
    readonly path: Array<string | number>;
}

/**
 * DataConnectOptions including project id
 */
export declare interface DataConnectOptions extends ConnectorConfig {
    projectId: string;
}

/** @internal */
export declare interface DataConnectResponse<T> {
    data: T;
    errors: Error[];
    extensions: Extensions;
}

/** @internal */
export declare interface DataConnectResponseWithMaxAge<T> {
    data: T;
    errors: Error[];
    extensions: ExtensionsWithMaxAge;
}

export declare interface DataConnectResult<Data, Variables> extends OpResult<Data> {
    ref: OperationRef<Data, Variables>;
}

export declare interface DataConnectSettings {
    cacheSettings?: CacheSettings;
}

export declare interface DataConnectSingleEntity {
    entityId: string;
}

/**
 * Representation of user provided subscription options.
 */
export declare interface DataConnectSubscription<Data, Variables> {
    userCallback: OnResultSubscription<Data, Variables>;
    errCallback?: (e?: DataConnectError) => void;
    unsubscribe: () => void;
}

/**
 * Interface defining the external API of the transport layer.
 * @internal
 */
export declare interface DataConnectTransportInterface {
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

export declare type DataSource = typeof SOURCE_CACHE | typeof SOURCE_SERVER;

declare interface DehydratedResultTreeJson {
    rootStub: DehydratedStubDataObject;
    maxAge: number;
    cachedAt: Date;
    lastAccessed: Date;
}

declare interface DehydratedStubDataObject {
    backingData?: EntityDataObjectJson;
    globalID?: string;
    scalars: {
        [key: string]: FDCScalarValue;
    };
    references: {
        [key: string]: DehydratedStubDataObject;
    };
    objectLists: {
        [key: string]: DehydratedStubDataObject[];
    };
}

declare enum EncodingMode {
    hydrated = 0,
    dehydrated = 1
}

declare class EntityDataObject {
    readonly globalID: string;
    getServerValue(key: string): unknown;
    private serverValues;
    private referencedFrom;
    constructor(globalID: string);
    getServerValues(): {
        [key: string]: FDCScalarValue;
    };
    toJSON(): EntityDataObjectJson;
    static fromJSON(json: EntityDataObjectJson): EntityDataObject;
    updateServerValue(key: string, value: FDCScalarValue, requestedFrom: string): string[];
}

declare interface EntityDataObjectJson {
    map: {
        [key: string]: FDCScalarValue;
    };
    referencedFrom: string[];
    globalID: string;
}

declare class EntityNode {
    entityData?: EntityDataObject;
    scalars: Record<string, FDCScalarValue>;
    references: {
        [key: string]: EntityNode;
    };
    objectLists: {
        [key: string]: EntityNode[];
    };
    globalId?: string;
    entityDataKeys: Set<string>;
    loadData(queryId: string, values: FDCScalarValue, entityIds: Record<string, unknown> | undefined, acc: ImpactedQueryRefsAccumulator, cacheProvider: InternalCacheProvider): Promise<void>;
    toJSON(mode: EncodingMode): Record<string, unknown>;
    static fromJson(obj: DehydratedStubDataObject): EntityNode;
}

/**
 * Execute Mutation
 * @param mutationRef mutation to execute
 * @returns `MutationRef`
 */
export declare function executeMutation<Data, Variables>(mutationRef: MutationRef<Data, Variables>): MutationPromise<Data, Variables>;

/**
 * Execute Query
 * @param queryRef query to execute.
 * @returns `QueryPromise`
 */
export declare function executeQuery<Data, Variables>(queryRef: QueryRef<Data, Variables>, options?: ExecuteQueryOptions): QueryPromise<Data, Variables>;

/**
 * Options for executing a query.
 */
export declare interface ExecuteQueryOptions {
    fetchPolicy: QueryFetchPolicy;
}

export declare interface Extensions {
    dataConnect?: DataConnectExtension[];
}

/** @internal */
export declare interface ExtensionsWithMaxAge {
    dataConnect?: DataConnectExtensionWithMaxAge[];
}

/**
 * @license
 * Copyright 2025 Google LLC
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
declare type FDCScalarValue = string | number | boolean | undefined | null | Record<string, unknown> | FDCScalarValue[];

/**
 * Initialize DataConnect instance
 * @param options ConnectorConfig
 */
export declare function getDataConnect(options: ConnectorConfig, settings?: DataConnectSettings): DataConnect;

export declare function getDataConnect(options: ConnectorConfig): DataConnect;

/**
 * Initialize DataConnect instance
 * @param app FirebaseApp to initialize to.
 * @param connectorConfig ConnectorConfig
 */
export declare function getDataConnect(app: FirebaseApp, connectorConfig: ConnectorConfig): DataConnect;

/**
 * Initialize DataConnect instance
 * @param app FirebaseApp to initialize to.
 * @param connectorConfig ConnectorConfig
 */
export declare function getDataConnect(app: FirebaseApp, connectorConfig: ConnectorConfig, settings: DataConnectSettings): DataConnect;

/**
 * Constructs the value for the X-Goog-Api-Client header
 * @internal
 */
export declare function getGoogApiClientValue(isUsingGen: boolean, callerSdkType: CallerSdkType): string;

/**
 * @license
 * Copyright 2025 Google LLC
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
declare class ImpactedQueryRefsAccumulator {
    private queryId;
    impacted: Set<string>;
    constructor(queryId: string);
    add(impacted: string[]): void;
    consumeEvents(): string[];
}

declare interface InternalCacheProvider {
    getEntityData(globalId: string): Promise<EntityDataObject>;
    updateEntityData(entityData: EntityDataObject): Promise<void>;
    getResultTree(queryId: string): Promise<ResultTree | undefined>;
    setResultTree(queryId: string, resultTree: ResultTree): Promise<void>;
    close(): void;
}

/** @internal */
export declare type InternalQueryResult<Data, Variables> = QueryResult<Data, Variables> & Omit<DataConnectResult<Data, Variables>, 'extensions'> & {
    extensions?: {
        dataConnect?: DataConnectExtensionWithMaxAge[];
    };
};

export declare function makeMemoryCacheProvider(): CacheProvider<'MEMORY'>;

export declare const MUTATION_STR = "mutation";

/**
 * @internal
 */
export declare class MutationManager {
    private _transport;
    private _inflight;
    constructor(_transport: DataConnectTransportInterface);
    executeMutation<Data, Variables>(mutationRef: MutationRef<Data, Variables>): MutationPromise<Data, Variables>;
}

/**
 * Mutation return value from `executeMutation`
 */
export declare interface MutationPromise<Data, Variables> extends Promise<MutationResult<Data, Variables>> {
}

export declare interface MutationRef<Data, Variables> extends OperationRef<Data, Variables> {
    refType: typeof MUTATION_STR;
}

/**
 * Creates a `MutationRef`
 * @param dcInstance Data Connect instance
 * @param mutationName name of mutation
 */
export declare function mutationRef<Data>(dcInstance: DataConnect, mutationName: string): MutationRef<Data, undefined>;

/**
 *
 * @param dcInstance Data Connect instance
 * @param mutationName name of mutation
 * @param variables variables to send with mutation
 */
export declare function mutationRef<Data, Variables>(dcInstance: DataConnect, mutationName: string, variables: Variables): MutationRef<Data, Variables>;

/**
 * Mutation Result from `executeMutation`
 */
export declare interface MutationResult<Data, Variables> extends DataConnectResult<Data, Variables> {
    ref: MutationRef<Data, Variables>;
}

/**
 * `OnCompleteSubscription`
 */
export declare type OnCompleteSubscription = () => void;

/**
 * Signature for `OnErrorSubscription` for `subscribe`
 */
export declare type OnErrorSubscription = (err?: DataConnectError) => void;

/**
 * Signature for `OnResultSubscription` for `subscribe`
 */
export declare type OnResultSubscription<Data, Variables> = (res: QueryResult<Data, Variables>) => void;

export declare interface OperationRef<_Data, Variables> {
    name: string;
    variables: Variables;
    refType: ReferenceType;
    dataConnect: DataConnect;
}

export declare interface OpResult<Data> {
    data: Data;
    source: DataSource;
    fetchTime: string;
    extensions?: Extensions;
}

declare interface ParsedArgs<Variables> {
    dc: DataConnect;
    vars: Variables;
    options?: ExecuteQueryOptions;
}

/**
 *
 * @param fullHost
 * @returns TransportOptions
 * @internal
 */
export declare function parseOptions(fullHost: string): TransportOptions;

export declare const QUERY_STR = "query";

/**
 * @license
 * Copyright 2025 Google LLC
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
export declare const QueryFetchPolicy: {
    readonly PREFER_CACHE: "PREFER_CACHE";
    readonly CACHE_ONLY: "CACHE_ONLY";
    readonly SERVER_ONLY: "SERVER_ONLY";
};

export declare type QueryFetchPolicy = (typeof QueryFetchPolicy)[keyof typeof QueryFetchPolicy];

declare class QueryManager {
    private transport;
    private dc;
    private cache?;
    preferCacheResults<Data, Variables>(queryRef: QueryRef<Data, Variables>, allowStale?: boolean): Promise<QueryResult<Data, Variables>>;
    private callbacks;
    /**
     * Map of serialized query keys to most recent Query Result. Used as a simple fallback cache
     * for subsciptions if caching is not enabled.
     */
    private subscriptionCache;
    constructor(transport: DataConnectTransportInterface, dc: DataConnect, cache?: DataConnectCache | undefined);
    private queue;
    waitForQueuedWrites(): Promise<void>;
    updateSSR<Data, Variables>(updatedData: QueryResult<Data, Variables>): void;
    updateCache<Data, Variables>(result: QueryResult<Data, Variables>, extensions?: DataConnectExtensionWithMaxAge[]): Promise<string[]>;
    addSubscription<Data, Variables>(queryRef: QueryRef<Data, Variables>, onResultCallback: OnResultSubscription<Data, Variables>, onCompleteCallback?: OnCompleteSubscription, onErrorCallback?: OnErrorSubscription, initialCache?: QueryResult<Data, Variables>): () => void;
    fetchServerResults<Data, Variables>(queryRef: QueryRef<Data, Variables>): Promise<QueryResult<Data, Variables>>;
    fetchCacheResults<Data, Variables>(queryRef: QueryRef<Data, Variables>, allowStale?: boolean): Promise<QueryResult<Data, Variables>>;
    publishErrorToSubscribers(key: string, err: unknown): void;
    getFromResultTreeCache<Data, Variables>(queryRef: QueryRef<Data, Variables>, allowStale?: boolean): Promise<QueryResult<Data, Variables> | null>;
    getFromSubscriberCache<Data, Variables>(queryRef: QueryRef<Data, Variables>): Promise<QueryResult<Data, Variables> | undefined>;
    /** Call the registered onNext callbacks for the given key */
    publishDataToSubscribers(key: string, queryResult: QueryResult<unknown, unknown>): void;
    publishCacheResultsToSubscribers(impactedQueries: string[], fetchTime: string): Promise<void>;
    enableEmulator(host: string, port: number): void;
    /**
     * Create a new {@link SubscribeObserver} for the given QueryRef. This will be passed to
     * {@link DataConnectTransportInterface.invokeSubscribe | invokeSubscribe()} to notify the query
     * layer of data update notifications or if the stream disconnected.
     */
    private makeSubscribeObserver;
    /**
     * Handle a data update notification from the stream. Notify subscribers of results/errors, and
     * update the cache.
     */
    private handleStreamNotification;
    /**
     * Handle a disconnect from the stream. Unsubscribe all callbacks for the given key.
     */
    private handleStreamDisconnect;
}

/**
 * Promise returned from `executeQuery`
 */
export declare interface QueryPromise<Data, Variables> extends Promise<QueryResult<Data, Variables>> {
}

/**
 * QueryRef object
 */
export declare interface QueryRef<Data, Variables> extends OperationRef<Data, Variables> {
    refType: typeof QUERY_STR;
}

/**
 * Execute Query
 * @param dcInstance Data Connect instance to use.
 * @param queryName Query to execute
 * @returns `QueryRef`
 */
export declare function queryRef<Data>(dcInstance: DataConnect, queryName: string): QueryRef<Data, undefined>;

/**
 * Execute Query
 * @param dcInstance Data Connect instance to use.
 * @param queryName Query to execute
 * @param variables Variables to execute with
 * @returns `QueryRef`
 */
export declare function queryRef<Data, Variables>(dcInstance: DataConnect, queryName: string, variables: Variables): QueryRef<Data, Variables>;

/**
 * Result of `executeQuery`
 */
export declare interface QueryResult<Data, Variables> extends DataConnectResult<Data, Variables> {
    ref: QueryRef<Data, Variables>;
    toJSON: () => SerializedRef<Data, Variables>;
}

/**
 * Signature for unsubscribe from `subscribe`
 */
export declare type QueryUnsubscribe = () => void;

export declare type ReferenceType = typeof QUERY_STR | typeof MUTATION_STR;

/**
 * Serialized RefInfo as a result of `QueryResult.toJSON().refInfo`
 */
export declare interface RefInfo<Variables> {
    name: string;
    variables: Variables;
    connectorConfig: DataConnectOptions;
}

declare class ResultTree {
    private rootStub;
    private maxAge;
    readonly cachedAt: Date;
    private _lastAccessed;
    /**
     * Create a {@link ResultTree} from a dehydrated JSON object.
     * @param value The dehydrated JSON object.
     * @returns The {@link ResultTree}.
     */
    static fromJson(value: DehydratedResultTreeJson): ResultTree;
    constructor(rootStub: EntityNode, maxAge: number, cachedAt: Date, _lastAccessed: Date);
    isStale(): boolean;
    updateMaxAge(maxAgeInSeconds: number): void;
    updateAccessed(): void;
    get lastAccessed(): Date;
    getRootStub(): EntityNode;
}

/**
 * Serialized Ref as a result of `QueryResult.toJSON()`
 */
export declare interface SerializedRef<Data, Variables> extends OpResult<Data> {
    refInfo: RefInfo<Variables>;
}

/**
 * ServerValues
 */
declare interface ServerValues extends Record<string, unknown> {
    maxAge?: number;
}

export declare function setLogLevel(logLevel: LogLevelString): void;

export declare const SOURCE_CACHE = "CACHE";

export declare const SOURCE_SERVER = "SERVER";

export declare const StorageType: {
    readonly MEMORY: "MEMORY";
};

export declare type StorageType = (typeof StorageType)[keyof typeof StorageType];

/**
 * Subscribe to a `QueryRef`
 * @param queryRefOrSerializedResult query ref or serialized result.
 * @param observer observer object to use for subscribing.
 * @returns `SubscriptionOptions`
 */
export declare function subscribe<Data, Variables>(queryRefOrSerializedResult: QueryRef<Data, Variables> | SerializedRef<Data, Variables>, observer: SubscriptionOptions<Data, Variables>): QueryUnsubscribe;

/**
 * Subscribe to a `QueryRef`
 * @param queryRefOrSerializedResult query ref or serialized result.
 * @param onNext Callback to call when result comes back.
 * @param onError Callback to call when error gets thrown.
 * @param onComplete Called when subscription completes.
 * @returns `SubscriptionOptions`
 */
export declare function subscribe<Data, Variables>(queryRefOrSerializedResult: QueryRef<Data, Variables> | SerializedRef<Data, Variables>, onNext: OnResultSubscription<Data, Variables>, onError?: OnErrorSubscription, onComplete?: OnCompleteSubscription): QueryUnsubscribe;

/**
 * Observer defined by the Query Layer for receiving notifications from the Transport Layer.
 * @internal
 */
export declare interface SubscribeObserver<Data> {
    onData(response: DataConnectResponse<Data>): Promise<void> | void;
    onDisconnect(code: string, reason: string): void;
    onError(error: Error): void;
}

/**
 * Representation of full observer options in `subscribe`
 */
export declare interface SubscriptionOptions<Data, Variables> {
    onNext?: OnResultSubscription<Data, Variables>;
    onErr?: OnErrorSubscription;
    onComplete?: OnCompleteSubscription;
}

/**
 * Delete DataConnect instance
 * @param dataConnect DataConnect instance
 * @returns
 */
export declare function terminate(dataConnect: DataConnect): Promise<void>;

/**
 * Converts serialized ref to query ref
 * @param serializedRef ref to convert to `QueryRef`
 * @returns `QueryRef`
 */
export declare function toQueryRef<Data, Variables>(serializedRef: SerializedRef<Data, Variables>): QueryRef<Data, Variables>;

/**
 * Type signature of a transport class constructor.
 * @internal
 */
export declare type TransportClass = new (options: DataConnectOptions, apiKey?: string, appId?: string, authProvider?: AuthTokenProvider, appCheckProvider?: AppCheckTokenProvider, transportOptions?: TransportOptions, _isUsingGen?: boolean, _callerSdkType?: CallerSdkType) => DataConnectTransportInterface;

/**
 * Options to connect to emulator
 */
export declare interface TransportOptions {
    host: string;
    sslEnabled?: boolean;
    port?: number;
}

/**
 * The generated SDK will allow the user to pass in either the variables or the data connect instance
 * with the variables. This function validates the variables and returns back the DataConnect instance
 * and variables based on the arguments passed in.
 *
 * Generated SDKs generated from versions 3.2.0 and lower of the Data Connect emulator binary are
 * NOT concerned with options, and will use this function to validate arguments.
 *
 * @param connectorConfig
 * @param dcOrVars
 * @param vars
 * @param variablesRequired
 * @returns {DataConnect} and {Variables} instance
 * @internal
 */
export declare function validateArgs<Variables extends object>(connectorConfig: ConnectorConfig, dcOrVars?: DataConnect | Variables, vars?: Variables, variablesRequired?: boolean): ParsedArgs<Variables>;

/**
 * The generated SDK will allow the user to pass in either the variables or the data connect instance
 * with the variables, and/or options. This function validates the variables and returns back the
 * DataConnect instance and variables, and potentially options, based on the arguments passed in.
 *
 * Generated SDKs generated from versions 3.2.0 and higher of the Data Connect emulator binary are
 * in fact concerned with options, and will use this function to validate arguments.
 *
 * @param connectorConfig
 * @param dcOrVarsOrOptions
 * @param varsOrOptions
 * @param variablesRequired
 * @param options
 * @returns {DataConnect} and {Variables} instance, and optionally {ExecuteQueryOptions}
 * @internal
 */
export declare function validateArgsWithOptions<Variables extends object>(connectorConfig: ConnectorConfig, dcOrVarsOrOptions?: DataConnect | Variables | ExecuteQueryOptions, varsOrOptions?: Variables | ExecuteQueryOptions, options?: ExecuteQueryOptions, hasVars?: boolean, variablesRequired?: boolean): ParsedArgs<Variables>;

/**
 *
 * @param dcOptions
 * @returns {void}
 * @internal
 */
export declare function validateDCOptions(dcOptions: ConnectorConfig): boolean;

export { }
