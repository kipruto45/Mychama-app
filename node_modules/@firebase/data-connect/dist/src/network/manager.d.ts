/**
 * @license
 * Copyright 2026 Google LLC
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
import { CallerSdkType, DataConnectResponse, DataConnectResponseWithMaxAge, DataConnectTransportInterface, SubscribeObserver } from './transport';
/**
 * Entry point for the transport layer. Manages routing between transport implementations.
 * @internal
 */
export declare class DataConnectTransportManager implements DataConnectTransportInterface {
    private options;
    private apiKey?;
    private appId?;
    private authProvider?;
    private appCheckProvider?;
    private transportOptions?;
    private _isUsingGen;
    private _callerSdkType?;
    private restTransport;
    private streamTransport?;
    private isUsingEmulator;
    constructor(options: DataConnectOptions, apiKey?: string | undefined, appId?: (string | null) | undefined, authProvider?: AuthTokenProvider | undefined, appCheckProvider?: AppCheckTokenProvider | undefined, transportOptions?: TransportOptions | undefined, _isUsingGen?: boolean, _callerSdkType?: CallerSdkType | undefined);
    /**
     * Initializes the stream transport if it hasn't been already.
     */
    private initStreamTransport;
    /**
     * Returns true if the stream is in a healthy, ready connection state and has active subscriptions.
     */
    private executeShouldUseStream;
    /**
     * Prefer to use Streaming Transport connection when one is available.
     * @inheritdoc
     */
    invokeQuery<Data, Variables>(queryName: string, body?: Variables): Promise<DataConnectResponseWithMaxAge<Data>>;
    /**
     * Prefer to use Streaming Transport connection when one is available.
     * @inheritdoc
     */
    invokeMutation<Data, Variables>(queryName: string, body?: Variables): Promise<DataConnectResponse<Data>>;
    invokeSubscribe<Data, Variables>(observer: SubscribeObserver<Data>, queryName: string, body?: Variables): void;
    invokeUnsubscribe<Variables>(queryName: string, body?: Variables): void;
    useEmulator(host: string, port?: number, sslEnabled?: boolean): void;
    onAuthTokenChanged(token: string | null): void;
    _setCallerSdkType(callerSdkType: CallerSdkType): void;
}
