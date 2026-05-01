import { browserTracingIntegration } from '@sentry/browser';
import type { Integration, Span } from '@sentry/core';
import * as React from 'react';
import type { Action, AgnosticDataRouteMatch, CreateRouterFunction, CreateRoutesFromChildren, Location, MatchRoutes, RouteObject, Router, RouterState, UseEffect, UseLocation, UseNavigationType, UseRoutes } from '../types';
/**
 * Adds resolved routes as children to the parent route.
 * Prevents duplicate routes by checking if they already exist.
 */
export declare function addResolvedRoutesToParent(resolvedRoutes: RouteObject[], parentRoute: RouteObject): void;
export interface ReactRouterOptions {
    useEffect: UseEffect;
    useLocation: UseLocation;
    useNavigationType: UseNavigationType;
    createRoutesFromChildren: CreateRoutesFromChildren;
    matchRoutes: MatchRoutes;
    /**
     * Whether to strip the basename from the pathname when creating transactions.
     *
     * This is useful for applications that use a basename in their routing setup.
     * @default false
     */
    stripBasename?: boolean;
    /**
     * Enables support for async route handlers.
     *
     * This allows Sentry to track and instrument routes dynamically resolved from async handlers.
     * @default false
     */
    enableAsyncRouteHandlers?: boolean;
}
type V6CompatibleVersion = '6' | '7';
/**
 * Processes resolved routes by adding them to allRoutes and checking for nested async handlers.
 */
export declare function processResolvedRoutes(resolvedRoutes: RouteObject[], parentRoute?: RouteObject, currentLocation?: Location | null): void;
/**
 * Updates a navigation span with the correct route name after lazy routes have been loaded.
 */
export declare function updateNavigationSpan(activeRootSpan: Span, location: Location, allRoutes: RouteObject[], forceUpdate: boolean | undefined, matchRoutes: MatchRoutes): void;
/**
 * Creates a wrapCreateBrowserRouter function that can be used with all React Router v6 compatible versions.
 */
export declare function createV6CompatibleWrapCreateBrowserRouter<TState extends RouterState = RouterState, TRouter extends Router<TState> = Router<TState>>(createRouterFunction: CreateRouterFunction<TState, TRouter>, version: V6CompatibleVersion): CreateRouterFunction<TState, TRouter>;
/**
 * Creates a wrapCreateMemoryRouter function that can be used with all React Router v6 compatible versions.
 */
export declare function createV6CompatibleWrapCreateMemoryRouter<TState extends RouterState = RouterState, TRouter extends Router<TState> = Router<TState>>(createRouterFunction: CreateRouterFunction<TState, TRouter>, version: V6CompatibleVersion): CreateRouterFunction<TState, TRouter>;
/**
 * Creates a browser tracing integration that can be used with all React Router v6 compatible versions.
 */
export declare function createReactRouterV6CompatibleTracingIntegration(options: Parameters<typeof browserTracingIntegration>[0] & ReactRouterOptions, version: V6CompatibleVersion): Integration;
export declare function createV6CompatibleWrapUseRoutes(origUseRoutes: UseRoutes, version: V6CompatibleVersion): UseRoutes;
export declare function handleNavigation(opts: {
    location: Location;
    routes: RouteObject[];
    navigationType: Action;
    version: V6CompatibleVersion;
    matches?: AgnosticDataRouteMatch;
    basename?: string;
    allRoutes?: RouteObject[];
}): void;
export declare function createV6CompatibleWithSentryReactRouterRouting<P extends Record<string, any>, R extends React.FC<P>>(Routes: R, version: V6CompatibleVersion): R;
export {};
//# sourceMappingURL=instrumentation.d.ts.map