/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
import { NativeEventEmitter } from 'react-native';
declare const nativeInterface: import("./privateTypes").NetInfoNativeModule & {
    readonly eventEmitter: NativeEventEmitter;
};
export default nativeInterface;
