import { Location, RouteObject } from '../types';
/**
 * Creates a proxy wrapper for an async handler function.
 */
export declare function createAsyncHandlerProxy(originalFunction: (...args: unknown[]) => unknown, route: RouteObject, handlerKey: string, processResolvedRoutes: (resolvedRoutes: RouteObject[], parentRoute?: RouteObject, currentLocation?: Location) => void): (...args: unknown[]) => unknown;
/**
 * Handles the result of an async handler function call.
 */
export declare function handleAsyncHandlerResult(result: unknown, route: RouteObject, handlerKey: string, processResolvedRoutes: (resolvedRoutes: RouteObject[], parentRoute?: RouteObject, currentLocation?: Location) => void): void;
/**
 * Recursively checks a route for async handlers and sets up Proxies to add discovered child routes to allRoutes when called.
 */
export declare function checkRouteForAsyncHandler(route: RouteObject, processResolvedRoutes: (resolvedRoutes: RouteObject[], parentRoute?: RouteObject, currentLocation?: Location) => void): void;
//# sourceMappingURL=lazy-routes.d.ts.map
