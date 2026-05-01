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
import { type DataConnect } from '../../api/DataConnect';
import { QueryRef, QueryResult } from '../../api/query';
import { SerializedRef, DataSource } from '../../api/Reference';
import { DataConnectCache } from '../../cache/Cache';
import { DataConnectTransportInterface, DataConnectExtensionWithMaxAge } from '../../network';
import { OnCompleteSubscription, OnErrorSubscription, OnResultSubscription } from './subscribe';
export declare function getRefSerializer<Data, Variables>(queryRef: QueryRef<Data, Variables>, data: Data, source: DataSource, fetchTime: string): () => SerializedRef<Data, Variables>;
export declare class QueryManager {
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
export declare function getMaxAgeFromExtensions(extensions: DataConnectExtensionWithMaxAge[] | undefined): number | undefined;
