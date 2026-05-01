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
import { CallerSdkType, DataConnectResponse, DataConnectResponseWithMaxAge, AbstractDataConnectTransport, SubscribeObserver } from '..';
import { DataConnectOptions, TransportOptions } from '../../api/DataConnect';
import { AppCheckTokenProvider } from '../../core/AppCheckTokenProvider';
import { AuthTokenProvider } from '../../core/FirebaseAuthProvider';
/**
 * Fetch-based REST implementation of {@link AbstractDataConnectTransport}.
 * @internal
 */
export declare class RESTTransport extends AbstractDataConnectTransport {
    constructor(options: DataConnectOptions, apiKey?: string | undefined, appId?: string | null, authProvider?: AuthTokenProvider | undefined, appCheckProvider?: AppCheckTokenProvider | undefined, transportOptions?: TransportOptions | undefined, _isUsingGen?: boolean, _callerSdkType?: CallerSdkType);
    get endpointUrl(): string;
    invokeQuery: <Data, Variables>(queryName: string, body?: Variables) => Promise<DataConnectResponseWithMaxAge<Data>>;
    invokeMutation: <Data, Variables>(queryName: string, body?: Variables) => Promise<DataConnectResponse<Data>>;
    invokeSubscribe<Data, Variables>(observer: SubscribeObserver<Data>, queryName: string, body?: Variables): void;
    invokeUnsubscribe<Variables>(queryName: string, body?: Variables): void;
    onAuthTokenChanged(newToken: string | null): void;
}
