import type { Client, Integration } from '@sentry/core';
export declare const INTEGRATION_NAME = "ReactNavigation";
interface ReactNavigationIntegrationOptions {
    /**
     * How long the instrumentation will wait for the route to mount after a change has been initiated,
     * before the transaction is discarded.
     *
     * @default 1_000 (ms)
     */
    routeChangeTimeoutMs: number;
    /**
     * Time to initial display measures the time it takes from
     * navigation dispatch to the render of the first frame of the new screen.
     *
     * @default false
     */
    enableTimeToInitialDisplay: boolean;
    /**
     * Does not sample transactions that are from routes that have been seen any more and don't have any spans.
     * This removes a lot of the clutter as most back navigation transactions are now ignored.
     *
     * @default true
     */
    ignoreEmptyBackNavigationTransactions: boolean;
    /**
     * Enabled measuring Time to Initial Display for routes that are already loaded in memory.
     * (a.k.a., Routes that the navigation integration has already seen.)
     *
     * @default false
     */
    enableTimeToInitialDisplayForPreloadedRoutes: boolean;
    /**
     * Whether to use the dispatched action data to populate the transaction metadata.
     *
     * @default false
     */
    useDispatchedActionData: boolean;
}
/**
 * Instrumentation for React-Navigation V5 and above. See docs or sample app for usage.
 *
 * How this works:
 * - `_onDispatch` is called every time a dispatch happens and sets an IdleTransaction on the scope without any route context.
 * - `_onStateChange` is then called AFTER the state change happens due to a dispatch and sets the route context onto the active transaction.
 * - If `_onStateChange` isn't called within `STATE_CHANGE_TIMEOUT_DURATION` of the dispatch, then the transaction is not sampled and finished.
 */
export declare const reactNavigationIntegration: ({ routeChangeTimeoutMs, enableTimeToInitialDisplay, ignoreEmptyBackNavigationTransactions, enableTimeToInitialDisplayForPreloadedRoutes, useDispatchedActionData, }?: Partial<ReactNavigationIntegrationOptions>) => Integration & {
    /**
     * Pass the ref to the navigation container to register it to the instrumentation
     * @param navigationContainerRef Ref to a `NavigationContainer`
     */
    registerNavigationContainer: (navigationContainerRef: unknown) => void;
    options: ReactNavigationIntegrationOptions;
};
export interface NavigationRoute {
    name: string;
    key: string;
    params?: Record<string, any>;
}
/**
 * Returns React Navigation integration of the given client.
 */
export declare function getReactNavigationIntegration(client: Client): ReturnType<typeof reactNavigationIntegration> | undefined;
export {};
//# sourceMappingURL=reactnavigation.d.ts.map
