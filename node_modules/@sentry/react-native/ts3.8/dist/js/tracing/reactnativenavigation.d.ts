import type { Integration } from '@sentry/core';
import type { EmitterSubscription } from '../utils/rnlibrariesinterface';
export declare const INTEGRATION_NAME = "ReactNativeNavigation";
interface ReactNativeNavigationOptions {
    /**
     * How long the instrumentation will wait for the route to mount after a change has been initiated,
     * before the transaction is discarded.
     *
     * @default 1_000 (ms)
     */
    routeChangeTimeoutMs?: number;
    /**
     * Instrumentation will create a transaction on tab change.
     * By default only navigation commands create transactions.
     *
     * @default false
     */
    enableTabsInstrumentation?: boolean;
    /**
     * Does not sample transactions that are from routes that have been seen any more and don't have any spans.
     * This removes a lot of the clutter as most back navigation transactions are now ignored.
     *
     * @default true
     */
    ignoreEmptyBackNavigationTransactions?: boolean;
    /** The React Native Navigation `NavigationDelegate`.
     *
     * ```js
     * import { Navigation } from 'react-native-navigation';
     * ```
     */
    navigation: unknown;
}
interface ComponentEvent {
    componentId: string;
}
type ComponentType = 'Component' | 'TopBarTitle' | 'TopBarBackground' | 'TopBarButton';
export interface ComponentWillAppearEvent extends ComponentEvent {
    componentName: string;
    passProps?: Record<string | number | symbol, unknown>;
    componentType: ComponentType;
}
export interface EventSubscription {
    remove(): void;
}
export interface BottomTabPressedEvent {
    tabIndex: number;
}
export interface EventsRegistry {
    registerComponentWillAppearListener(callback: (event: ComponentWillAppearEvent) => void): EmitterSubscription;
    registerCommandListener(callback: (name: string, params: unknown) => void): EventSubscription;
    registerBottomTabPressedListener(callback: (event: BottomTabPressedEvent) => void): EmitterSubscription;
}
export interface NavigationDelegate {
    events: () => EventsRegistry;
}
/**
 * Instrumentation for React Native Navigation. See docs or sample app for usage.
 *
 * How this works:
 * - `_onCommand` is called every time a commands happens and sets an IdleTransaction on the scope without any route context.
 * - `_onComponentWillAppear` is then called AFTER the state change happens due to a dispatch and sets the route context onto the active transaction.
 * - If `_onComponentWillAppear` isn't called within `options.routeChangeTimeoutMs` of the dispatch, then the transaction is not sampled and finished.
 */
export declare const reactNativeNavigationIntegration: ({ navigation: optionsNavigation, routeChangeTimeoutMs, enableTabsInstrumentation, ignoreEmptyBackNavigationTransactions, }: ReactNativeNavigationOptions) => Integration;
export {};
//# sourceMappingURL=reactnativenavigation.d.ts.map
