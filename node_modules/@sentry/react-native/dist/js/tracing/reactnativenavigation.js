import { addBreadcrumb, getClient, SEMANTIC_ATTRIBUTE_SENTRY_OP, SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN, SEMANTIC_ATTRIBUTE_SENTRY_SOURCE, spanToJSON, } from '@sentry/core';
import { isSentrySpan } from '../utils/span';
import { ignoreEmptyBackNavigation } from './onSpanEndUtils';
import { SPAN_ORIGIN_AUTO_NAVIGATION_REACT_NATIVE_NAVIGATION } from './origin';
import { getReactNativeTracingIntegration } from './reactnativetracing';
import { DEFAULT_NAVIGATION_SPAN_NAME, defaultIdleOptions, getDefaultIdleNavigationSpanOptions, startIdleNavigationSpan as startGenericIdleNavigationSpan, } from './span';
export const INTEGRATION_NAME = 'ReactNativeNavigation';
const NAVIGATION_HISTORY_MAX_SIZE = 200;
/**
 * Instrumentation for React Native Navigation. See docs or sample app for usage.
 *
 * How this works:
 * - `_onCommand` is called every time a commands happens and sets an IdleTransaction on the scope without any route context.
 * - `_onComponentWillAppear` is then called AFTER the state change happens due to a dispatch and sets the route context onto the active transaction.
 * - If `_onComponentWillAppear` isn't called within `options.routeChangeTimeoutMs` of the dispatch, then the transaction is not sampled and finished.
 */
export const reactNativeNavigationIntegration = ({ navigation: optionsNavigation, routeChangeTimeoutMs = 1000, enableTabsInstrumentation = false, ignoreEmptyBackNavigationTransactions = true, }) => {
    const navigation = optionsNavigation;
    let recentComponentIds = [];
    let tracing;
    let idleSpanOptions = defaultIdleOptions;
    let stateChangeTimeout;
    let prevComponentEvent = null;
    let latestNavigationSpan;
    const afterAllSetup = (client) => {
        tracing = getReactNativeTracingIntegration(client);
        if (tracing) {
            idleSpanOptions = {
                finalTimeout: tracing.options.finalTimeoutMs,
                idleTimeout: tracing.options.idleTimeoutMs,
            };
        }
    };
    const startIdleNavigationSpan = () => {
        if (latestNavigationSpan) {
            discardLatestNavigationSpan();
        }
        latestNavigationSpan = startGenericIdleNavigationSpan((tracing === null || tracing === void 0 ? void 0 : tracing.options.beforeStartSpan)
            ? tracing.options.beforeStartSpan(getDefaultIdleNavigationSpanOptions())
            : getDefaultIdleNavigationSpanOptions(), idleSpanOptions);
        latestNavigationSpan === null || latestNavigationSpan === void 0 ? void 0 : latestNavigationSpan.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN, SPAN_ORIGIN_AUTO_NAVIGATION_REACT_NATIVE_NAVIGATION);
        if (ignoreEmptyBackNavigationTransactions) {
            ignoreEmptyBackNavigation(getClient(), latestNavigationSpan);
        }
        stateChangeTimeout = setTimeout(discardLatestNavigationSpan.bind(this), routeChangeTimeoutMs);
    };
    const updateLatestNavigationSpanWithCurrentComponent = (event) => {
        if (!latestNavigationSpan) {
            return;
        }
        // We ignore actions that pertain to the same screen.
        const isSameComponent = prevComponentEvent && event.componentId === prevComponentEvent.componentId;
        if (isSameComponent) {
            discardLatestNavigationSpan();
            return;
        }
        clearStateChangeTimeout();
        const routeHasBeenSeen = recentComponentIds.includes(event.componentId);
        if (spanToJSON(latestNavigationSpan).description === DEFAULT_NAVIGATION_SPAN_NAME) {
            latestNavigationSpan.updateName(event.componentName);
        }
        latestNavigationSpan.setAttributes({
            // TODO: Should we include pass props? I don't know exactly what it contains, cant find it in the RNavigation docs
            'route.name': event.componentName,
            'route.component_id': event.componentId,
            'route.component_type': event.componentType,
            'route.has_been_seen': routeHasBeenSeen,
            'previous_route.name': prevComponentEvent === null || prevComponentEvent === void 0 ? void 0 : prevComponentEvent.componentName,
            'previous_route.component_id': prevComponentEvent === null || prevComponentEvent === void 0 ? void 0 : prevComponentEvent.componentId,
            'previous_route.component_type': prevComponentEvent === null || prevComponentEvent === void 0 ? void 0 : prevComponentEvent.componentType,
            [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: 'component',
            [SEMANTIC_ATTRIBUTE_SENTRY_OP]: 'navigation',
        });
        tracing === null || tracing === void 0 ? void 0 : tracing.setCurrentRoute(event.componentName);
        addBreadcrumb({
            category: 'navigation',
            type: 'navigation',
            message: `Navigation to ${event.componentName}`,
            data: {
                from: prevComponentEvent === null || prevComponentEvent === void 0 ? void 0 : prevComponentEvent.componentName,
                to: event.componentName,
            },
        });
        pushRecentComponentId(event.componentId);
        prevComponentEvent = event;
        latestNavigationSpan = undefined;
    };
    navigation.events().registerCommandListener(startIdleNavigationSpan);
    if (enableTabsInstrumentation) {
        navigation.events().registerBottomTabPressedListener(startIdleNavigationSpan);
    }
    navigation.events().registerComponentWillAppearListener(updateLatestNavigationSpanWithCurrentComponent);
    const pushRecentComponentId = (id) => {
        recentComponentIds.push(id);
        if (recentComponentIds.length > NAVIGATION_HISTORY_MAX_SIZE) {
            recentComponentIds = recentComponentIds.slice(recentComponentIds.length - NAVIGATION_HISTORY_MAX_SIZE);
        }
    };
    const discardLatestNavigationSpan = () => {
        if (latestNavigationSpan) {
            if (isSentrySpan(latestNavigationSpan)) {
                latestNavigationSpan['_sampled'] = false;
            }
            // TODO: What if it's not SentrySpan?
            latestNavigationSpan.end();
            latestNavigationSpan = undefined;
        }
        clearStateChangeTimeout();
    };
    const clearStateChangeTimeout = () => {
        if (typeof stateChangeTimeout !== 'undefined') {
            clearTimeout(stateChangeTimeout);
            stateChangeTimeout = undefined;
        }
    };
    return {
        name: INTEGRATION_NAME,
        afterAllSetup,
    };
};
//# sourceMappingURL=reactnativenavigation.js.map