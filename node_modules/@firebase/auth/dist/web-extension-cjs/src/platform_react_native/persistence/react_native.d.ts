/**
 * @license
 * Copyright 2019 Google LLC
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
import { Persistence, ReactNativeAsyncStorage } from '../../model/public_types';
/**
 * Returns a persistence object that wraps `AsyncStorage` imported from
 * `react-native` or `@react-native-async-storage/async-storage`, and can
 * be used in the persistence dependency field in {@link initializeAuth}.
 *
 * @example
 * ```javascript
 * import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
 *
 * // For @react-native-async-storage/async-storage v3:
 * import { createAsyncStorage } from '@react-native-async-storage/async-storage';
 * const appStorage = createAsyncStorage('app');
 * const persistence = getReactNativePersistence(appStorage);
 *
 * // For @react-native-async-storage/async-storage v2:
 * // import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
 * // const persistence = getReactNativePersistence(ReactNativeAsyncStorage);
 *
 * // Then, initialize auth:
 * const auth = initializeAuth(app, {
 *   persistence
 * });
 * ```
 *
 * @public
 */
export declare function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
