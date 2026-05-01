/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
import * as Types from './internal/types';
/**
 * Configures the library with the given configuration. Note that calling this will stop all
 * previously added listeners from being called again. It is best to call this right when your
 * application is started to avoid issues. The configuration sets up a global singleton instance.
 *
 * @param configuration The new configuration to set.
 */
export declare function configure(configuration: Partial<Types.NetInfoConfiguration>): void;
/**
 * Returns a `Promise` that resolves to a `NetInfoState` object.
 * This function operates on the global singleton instance configured using `configure()`
 *
 * @param [requestedInterface] interface from which to obtain the information
 *
 * @returns A Promise which contains the current connection state.
 */
export declare function fetch(requestedInterface?: string): Promise<Types.NetInfoState>;
/**
 * Force-refreshes the internal state of the global singleton managed by this library.
 *
 * @returns A Promise which contains the updated connection state.
 */
export declare function refresh(): Promise<Types.NetInfoState>;
/**
 * Subscribe to the global singleton's connection information. The callback is called with a parameter of type
 * [`NetInfoState`](README.md#netinfostate) whenever the connection state changes. Your listener
 * will be called with the latest information soon after you subscribe and then with any
 * subsequent changes afterwards. You should not assume that the listener is called in the same
 * way across devices or platforms.
 *
 * @param listener The listener which is called when the network state changes.
 *
 * @returns A function which can be called to unsubscribe.
 */
export declare function addEventListener(listener: Types.NetInfoChangeHandler): Types.NetInfoSubscription;
/**
 * A React Hook into this library's singleton which updates when the connection state changes.
 *
 * @param {Partial<Types.NetInfoConfiguration>} configuration - Configure the isolated network checker managed by this hook
 *
 * @returns The connection state.
 */
export declare function useNetInfo(configuration?: Partial<Types.NetInfoConfiguration>): Types.NetInfoState;
/**
 * A React Hook which manages an isolated instance of the network info manager.
 * This is not a hook into a singleton shared state. NetInfo.configure, NetInfo.addEventListener,
 * NetInfo.fetch, NetInfo.refresh are performed on a global singleton and have no affect on this hook.
 * @param {boolean} isPaused - Pause the internal network checks.
 * @param {Partial<Types.NetInfoConfiguration>} configuration - Configure the isolated network checker managed by this hook
 *
 * @returns the netInfo state and a refresh function
 */
export declare function useNetInfoInstance(isPaused?: boolean, configuration?: Partial<Types.NetInfoConfiguration>): {
    netInfo: Types.NetInfoState;
    refresh: () => void;
};
export * from './internal/types';
declare const _default: {
    configure: typeof configure;
    fetch: typeof fetch;
    refresh: typeof refresh;
    addEventListener: typeof addEventListener;
    useNetInfo: typeof useNetInfo;
    useNetInfoInstance: typeof useNetInfoInstance;
};
export default _default;
