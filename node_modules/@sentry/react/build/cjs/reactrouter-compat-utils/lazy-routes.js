Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const core = require('@sentry/core');
const debugBuild = require('../debug-build.js');

/**
 * Creates a proxy wrapper for an async handler function.
 */
function createAsyncHandlerProxy(
  originalFunction,
  route,
  handlerKey,
  processResolvedRoutes,
) {
  const proxy = new Proxy(originalFunction, {
    apply(target, thisArg, argArray) {
      const result = target.apply(thisArg, argArray);
      handleAsyncHandlerResult(result, route, handlerKey, processResolvedRoutes);
      return result;
    },
  });

  core.addNonEnumerableProperty(proxy, '__sentry_proxied__', true);

  return proxy;
}

/**
 * Handles the result of an async handler function call.
 */
function handleAsyncHandlerResult(
  result,
  route,
  handlerKey,
  processResolvedRoutes,
) {
  if (core.isThenable(result)) {
    (result )
      .then((resolvedRoutes) => {
        if (Array.isArray(resolvedRoutes)) {
          processResolvedRoutes(resolvedRoutes, route);
        }
      })
      .catch((e) => {
        debugBuild.DEBUG_BUILD && core.debug.warn(`Error resolving async handler '${handlerKey}' for route`, route, e);
      });
  } else if (Array.isArray(result)) {
    processResolvedRoutes(result, route);
  }
}

/**
 * Recursively checks a route for async handlers and sets up Proxies to add discovered child routes to allRoutes when called.
 */
function checkRouteForAsyncHandler(
  route,
  processResolvedRoutes,
) {
  // Set up proxies for any functions in the route's handle
  if (route.handle && typeof route.handle === 'object') {
    for (const key of Object.keys(route.handle)) {
      const maybeFn = route.handle[key];
      if (typeof maybeFn === 'function' && !(maybeFn ).__sentry_proxied__) {
        route.handle[key] = createAsyncHandlerProxy(maybeFn, route, key, processResolvedRoutes);
      }
    }
  }

  // Recursively check child routes
  if (Array.isArray(route.children)) {
    for (const child of route.children) {
      checkRouteForAsyncHandler(child, processResolvedRoutes);
    }
  }
}

exports.checkRouteForAsyncHandler = checkRouteForAsyncHandler;
exports.createAsyncHandlerProxy = createAsyncHandlerProxy;
exports.handleAsyncHandlerResult = handleAsyncHandlerResult;
//# sourceMappingURL=lazy-routes.js.map
