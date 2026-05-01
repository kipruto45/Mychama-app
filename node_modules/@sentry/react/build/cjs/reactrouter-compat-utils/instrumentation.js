Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const browser = require('@sentry/browser');
const core = require('@sentry/core');
const React = require('react');
const debugBuild = require('../debug-build.js');
const hoistNonReactStatics = require('../hoist-non-react-statics.js');
const lazyRoutes = require('./lazy-routes.js');
const utils = require('./utils.js');

/* eslint-disable max-lines */
// Inspired from Donnie McNeal's solution:
// https://gist.github.com/wontondon/e8c4bdf2888875e4c755712e99279536


let _useEffect;
let _useLocation;
let _useNavigationType;
let _createRoutesFromChildren;
let _matchRoutes;
let _enableAsyncRouteHandlers = false;

const CLIENTS_WITH_INSTRUMENT_NAVIGATION = new WeakSet();

/**
 * Adds resolved routes as children to the parent route.
 * Prevents duplicate routes by checking if they already exist.
 */
function addResolvedRoutesToParent(resolvedRoutes, parentRoute) {
  const existingChildren = parentRoute.children || [];

  const newRoutes = resolvedRoutes.filter(
    newRoute =>
      !existingChildren.some(
        existing =>
          existing === newRoute ||
          (newRoute.path && existing.path === newRoute.path) ||
          (newRoute.id && existing.id === newRoute.id),
      ),
  );

  if (newRoutes.length > 0) {
    parentRoute.children = [...existingChildren, ...newRoutes];
  }
}

// Keeping as a global variable for cross-usage in multiple functions
const allRoutes = new Set();

/**
 * Processes resolved routes by adding them to allRoutes and checking for nested async handlers.
 */
function processResolvedRoutes(
  resolvedRoutes,
  parentRoute,
  currentLocation = null,
) {
  resolvedRoutes.forEach(child => {
    allRoutes.add(child);
    // Only check for async handlers if the feature is enabled
    if (_enableAsyncRouteHandlers) {
      lazyRoutes.checkRouteForAsyncHandler(child, processResolvedRoutes);
    }
  });

  if (parentRoute) {
    // If a parent route is provided, add the resolved routes as children to the parent route
    addResolvedRoutesToParent(resolvedRoutes, parentRoute);
  }

  // After processing lazy routes, check if we need to update an active transaction
  const activeRootSpan = getActiveRootSpan();
  if (activeRootSpan) {
    const spanOp = core.spanToJSON(activeRootSpan).op;

    // Try to use the provided location first, then fall back to global window location if needed
    let location = currentLocation;
    if (!location) {
      if (typeof browser.WINDOW !== 'undefined') {
        const globalLocation = browser.WINDOW.location;
        if (globalLocation) {
          location = { pathname: globalLocation.pathname };
        }
      }
    }

    if (location) {
      if (spanOp === 'pageload') {
        // Re-run the pageload transaction update with the newly loaded routes
        updatePageloadTransaction({
          activeRootSpan,
          location: { pathname: location.pathname },
          routes: Array.from(allRoutes),
          allRoutes: Array.from(allRoutes),
        });
      } else if (spanOp === 'navigation') {
        // For navigation spans, update the name with the newly loaded routes
        updateNavigationSpan(activeRootSpan, location, Array.from(allRoutes), false, _matchRoutes);
      }
    }
  }
}

/**
 * Updates a navigation span with the correct route name after lazy routes have been loaded.
 */
function updateNavigationSpan(
  activeRootSpan,
  location,
  allRoutes,
  forceUpdate = false,
  matchRoutes,
) {
  // Check if this span has already been named to avoid multiple updates
  // But allow updates if this is a forced update (e.g., when lazy routes are loaded)
  const hasBeenNamed =
    !forceUpdate && (activeRootSpan )?.__sentry_navigation_name_set__;

  if (!hasBeenNamed) {
    // Get fresh branches for the current location with all loaded routes
    const currentBranches = matchRoutes(allRoutes, location);
    const [name, source] = utils.resolveRouteNameAndSource(
      location,
      allRoutes,
      allRoutes,
      (currentBranches ) || [],
      '',
    );

    // Only update if we have a valid name and the span hasn't finished
    const spanJson = core.spanToJSON(activeRootSpan);
    if (name && !spanJson.timestamp) {
      activeRootSpan.updateName(name);
      activeRootSpan.setAttribute(core.SEMANTIC_ATTRIBUTE_SENTRY_SOURCE, source);

      // Mark this span as having its name set to prevent future updates
      core.addNonEnumerableProperty(
        activeRootSpan ,
        '__sentry_navigation_name_set__',
        true,
      );
    }
  }
}

/**
 * Creates a wrapCreateBrowserRouter function that can be used with all React Router v6 compatible versions.
 */
function createV6CompatibleWrapCreateBrowserRouter

(
  createRouterFunction,
  version,
) {
  if (!_useEffect || !_useLocation || !_useNavigationType || !_matchRoutes) {
    debugBuild.DEBUG_BUILD &&
      core.debug.warn(
        `reactRouterV${version}Instrumentation was unable to wrap the \`createRouter\` function because of one or more missing parameters.`,
      );

    return createRouterFunction;
  }

  return function (routes, opts) {
    addRoutesToAllRoutes(routes);

    // Check for async handlers that might contain sub-route declarations (only if enabled)
    if (_enableAsyncRouteHandlers) {
      for (const route of routes) {
        lazyRoutes.checkRouteForAsyncHandler(route, processResolvedRoutes);
      }
    }

    // Wrap patchRoutesOnNavigation to detect when lazy routes are loaded
    const wrappedOpts = wrapPatchRoutesOnNavigation(opts);

    const router = createRouterFunction(routes, wrappedOpts);
    const basename = opts?.basename;

    const activeRootSpan = getActiveRootSpan();

    // The initial load ends when `createBrowserRouter` is called.
    // This is the earliest convenient time to update the transaction name.
    // Callbacks to `router.subscribe` are not called for the initial load.
    if (router.state.historyAction === 'POP' && activeRootSpan) {
      updatePageloadTransaction({
        activeRootSpan,
        location: router.state.location,
        routes,
        basename,
        allRoutes: Array.from(allRoutes),
      });
    }

    router.subscribe((state) => {
      if (state.historyAction === 'PUSH' || state.historyAction === 'POP') {
        // Wait for the next render if loading an unsettled route
        if (state.navigation.state !== 'idle') {
          requestAnimationFrame(() => {
            handleNavigation({
              location: state.location,
              routes,
              navigationType: state.historyAction,
              version,
              basename,
              allRoutes: Array.from(allRoutes),
            });
          });
        } else {
          handleNavigation({
            location: state.location,
            routes,
            navigationType: state.historyAction,
            version,
            basename,
            allRoutes: Array.from(allRoutes),
          });
        }
      }
    });

    return router;
  };
}

/**
 * Creates a wrapCreateMemoryRouter function that can be used with all React Router v6 compatible versions.
 */
function createV6CompatibleWrapCreateMemoryRouter

(
  createRouterFunction,
  version,
) {
  if (!_useEffect || !_useLocation || !_useNavigationType || !_matchRoutes) {
    debugBuild.DEBUG_BUILD &&
      core.debug.warn(
        `reactRouterV${version}Instrumentation was unable to wrap the \`createMemoryRouter\` function because of one or more missing parameters.`,
      );

    return createRouterFunction;
  }

  return function (
    routes,
    opts

,
  ) {
    addRoutesToAllRoutes(routes);

    // Check for async handlers that might contain sub-route declarations (only if enabled)
    if (_enableAsyncRouteHandlers) {
      for (const route of routes) {
        lazyRoutes.checkRouteForAsyncHandler(route, processResolvedRoutes);
      }
    }

    // Wrap patchRoutesOnNavigation to detect when lazy routes are loaded
    const wrappedOpts = wrapPatchRoutesOnNavigation(opts, true);

    const router = createRouterFunction(routes, wrappedOpts);
    const basename = opts?.basename;

    const activeRootSpan = getActiveRootSpan();
    let initialEntry = undefined;

    const initialEntries = opts?.initialEntries;
    const initialIndex = opts?.initialIndex;

    const hasOnlyOneInitialEntry = initialEntries && initialEntries.length === 1;
    const hasIndexedEntry = initialIndex !== undefined && initialEntries && initialEntries[initialIndex];

    initialEntry = hasOnlyOneInitialEntry
      ? initialEntries[0]
      : hasIndexedEntry
        ? initialEntries[initialIndex]
        : undefined;

    const location = initialEntry
      ? typeof initialEntry === 'string'
        ? { pathname: initialEntry }
        : initialEntry
      : router.state.location;

    if (router.state.historyAction === 'POP' && activeRootSpan) {
      updatePageloadTransaction({ activeRootSpan, location, routes, basename, allRoutes: Array.from(allRoutes) });
    }

    router.subscribe((state) => {
      const location = state.location;
      if (state.historyAction === 'PUSH' || state.historyAction === 'POP') {
        handleNavigation({
          location,
          routes,
          navigationType: state.historyAction,
          version,
          basename,
          allRoutes: Array.from(allRoutes),
        });
      }
    });

    return router;
  };
}

/**
 * Creates a browser tracing integration that can be used with all React Router v6 compatible versions.
 */
function createReactRouterV6CompatibleTracingIntegration(
  options,
  version,
) {
  const integration = browser.browserTracingIntegration({ ...options, instrumentPageLoad: false, instrumentNavigation: false });

  const {
    useEffect,
    useLocation,
    useNavigationType,
    createRoutesFromChildren,
    matchRoutes,
    stripBasename,
    enableAsyncRouteHandlers = false,
    instrumentPageLoad = true,
    instrumentNavigation = true,
  } = options;

  return {
    ...integration,
    setup(client) {
      integration.setup(client);

      _useEffect = useEffect;
      _useLocation = useLocation;
      _useNavigationType = useNavigationType;
      _matchRoutes = matchRoutes;
      _createRoutesFromChildren = createRoutesFromChildren;
      _enableAsyncRouteHandlers = enableAsyncRouteHandlers;

      // Initialize the router utils with the required dependencies
      utils.initializeRouterUtils(matchRoutes, stripBasename || false);
    },
    afterAllSetup(client) {
      integration.afterAllSetup(client);

      const initPathName = browser.WINDOW.location?.pathname;
      if (instrumentPageLoad && initPathName) {
        browser.startBrowserTracingPageLoadSpan(client, {
          name: initPathName,
          attributes: {
            [core.SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: 'url',
            [core.SEMANTIC_ATTRIBUTE_SENTRY_OP]: 'pageload',
            [core.SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: `auto.pageload.react.reactrouter_v${version}`,
          },
        });
      }

      if (instrumentNavigation) {
        CLIENTS_WITH_INSTRUMENT_NAVIGATION.add(client);
      }
    },
  };
}

function createV6CompatibleWrapUseRoutes(origUseRoutes, version) {
  if (!_useEffect || !_useLocation || !_useNavigationType || !_matchRoutes) {
    debugBuild.DEBUG_BUILD &&
      core.debug.warn(
        'reactRouterV6Instrumentation was unable to wrap `useRoutes` because of one or more missing parameters.',
      );

    return origUseRoutes;
  }

  const SentryRoutes

 = (props) => {
    const isMountRenderPass = React.useRef(true);
    const { routes, locationArg } = props;

    const Routes = origUseRoutes(routes, locationArg);

    const location = _useLocation();
    const navigationType = _useNavigationType();

    // A value with stable identity to either pick `locationArg` if available or `location` if not
    const stableLocationParam =
      typeof locationArg === 'string' || locationArg?.pathname ? (locationArg ) : location;

    _useEffect(() => {
      const normalizedLocation =
        typeof stableLocationParam === 'string' ? { pathname: stableLocationParam } : stableLocationParam;

      if (isMountRenderPass.current) {
        addRoutesToAllRoutes(routes);

        updatePageloadTransaction({
          activeRootSpan: getActiveRootSpan(),
          location: normalizedLocation,
          routes,
          allRoutes: Array.from(allRoutes),
        });
        isMountRenderPass.current = false;
      } else {
        handleNavigation({
          location: normalizedLocation,
          routes,
          navigationType,
          version,
          allRoutes: Array.from(allRoutes),
        });
      }
    }, [navigationType, stableLocationParam]);

    return Routes;
  };

  // eslint-disable-next-line react/display-name
  return (routes, locationArg) => {
    return React.createElement(SentryRoutes, { routes: routes, locationArg: locationArg,} );
  };
}

function wrapPatchRoutesOnNavigation(
  opts,
  isMemoryRouter = false,
) {
  if (!opts || !('patchRoutesOnNavigation' in opts) || typeof opts.patchRoutesOnNavigation !== 'function') {
    return opts || {};
  }

  const originalPatchRoutes = opts.patchRoutesOnNavigation;
  return {
    ...opts,
    patchRoutesOnNavigation: async (args) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      const targetPath = (args )?.path;

      // For browser router, wrap the patch function to update span during patching
      if (!isMemoryRouter) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        const originalPatch = (args )?.patch;
        if (originalPatch) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
          (args ).patch = (routeId, children) => {
            addRoutesToAllRoutes(children);
            const activeRootSpan = getActiveRootSpan();
            if (activeRootSpan && (core.spanToJSON(activeRootSpan) ).op === 'navigation') {
              updateNavigationSpan(
                activeRootSpan,
                { pathname: targetPath, search: '', hash: '', state: null, key: 'default' },
                Array.from(allRoutes),
                true, // forceUpdate = true since we're loading lazy routes
                _matchRoutes,
              );
            }
            return originalPatch(routeId, children);
          };
        }
      }

      const result = await originalPatchRoutes(args);

      // Update navigation span after routes are patched
      const activeRootSpan = getActiveRootSpan();
      if (activeRootSpan && (core.spanToJSON(activeRootSpan) ).op === 'navigation') {
        // For memory routers, we should not access window.location; use targetPath only
        const pathname = isMemoryRouter ? targetPath : targetPath || browser.WINDOW.location?.pathname;
        if (pathname) {
          updateNavigationSpan(
            activeRootSpan,
            { pathname, search: '', hash: '', state: null, key: 'default' },
            Array.from(allRoutes),
            false, // forceUpdate = false since this is after lazy routes are loaded
            _matchRoutes,
          );
        }
      }

      return result;
    },
  };
}

function handleNavigation(opts

) {
  const { location, routes, navigationType, version, matches, basename, allRoutes } = opts;
  const branches = Array.isArray(matches) ? matches : _matchRoutes(routes, location, basename);

  const client = core.getClient();
  if (!client || !CLIENTS_WITH_INSTRUMENT_NAVIGATION.has(client)) {
    return;
  }

  if ((navigationType === 'PUSH' || navigationType === 'POP') && branches) {
    const [name, source] = utils.resolveRouteNameAndSource(
      location,
      routes,
      allRoutes || routes,
      branches ,
      basename,
    );

    const activeSpan = core.getActiveSpan();
    const spanJson = activeSpan && core.spanToJSON(activeSpan);
    const isAlreadyInNavigationSpan = spanJson?.op === 'navigation';

    // Cross usage can result in multiple navigation spans being created without this check
    if (!isAlreadyInNavigationSpan) {
      browser.startBrowserTracingNavigationSpan(client, {
        name,
        attributes: {
          [core.SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: source,
          [core.SEMANTIC_ATTRIBUTE_SENTRY_OP]: 'navigation',
          [core.SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: `auto.navigation.react.reactrouter_v${version}`,
        },
      });
    }
  }
}

function addRoutesToAllRoutes(routes) {
  routes.forEach(route => {
    const extractedChildRoutes = getChildRoutesRecursively(route);

    extractedChildRoutes.forEach(r => {
      allRoutes.add(r);
    });
  });
}

function getChildRoutesRecursively(route, allRoutes = new Set()) {
  if (!allRoutes.has(route)) {
    allRoutes.add(route);

    if (route.children && !route.index) {
      route.children.forEach(child => {
        const childRoutes = getChildRoutesRecursively(child, allRoutes);

        childRoutes.forEach(r => {
          allRoutes.add(r);
        });
      });
    }
  }

  return allRoutes;
}

function updatePageloadTransaction({
  activeRootSpan,
  location,
  routes,
  matches,
  basename,
  allRoutes,
}

) {
  const branches = Array.isArray(matches)
    ? matches
    : (_matchRoutes(allRoutes || routes, location, basename) );

  if (branches) {
    let name,
      source = 'url';

    const isInDescendantRoute = utils.locationIsInsideDescendantRoute(location, allRoutes || routes);

    if (isInDescendantRoute) {
      name = utils.prefixWithSlash(utils.rebuildRoutePathFromAllRoutes(allRoutes || routes, location));
      source = 'route';
    }

    if (!isInDescendantRoute || !name) {
      [name, source] = utils.getNormalizedName(routes, location, branches, basename);
    }

    core.getCurrentScope().setTransactionName(name || '/');

    if (activeRootSpan) {
      activeRootSpan.updateName(name);
      activeRootSpan.setAttribute(core.SEMANTIC_ATTRIBUTE_SENTRY_SOURCE, source);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createV6CompatibleWithSentryReactRouterRouting(
  Routes,
  version,
) {
  if (!_useEffect || !_useLocation || !_useNavigationType || !_createRoutesFromChildren || !_matchRoutes) {
    debugBuild.DEBUG_BUILD &&
      core.debug.warn(`reactRouterV6Instrumentation was unable to wrap Routes because of one or more missing parameters.
      useEffect: ${_useEffect}. useLocation: ${_useLocation}. useNavigationType: ${_useNavigationType}.
      createRoutesFromChildren: ${_createRoutesFromChildren}. matchRoutes: ${_matchRoutes}.`);

    return Routes;
  }

  const SentryRoutes = (props) => {
    const isMountRenderPass = React.useRef(true);

    const location = _useLocation();
    const navigationType = _useNavigationType();

    _useEffect(
      () => {
        const routes = _createRoutesFromChildren(props.children) ;

        if (isMountRenderPass.current) {
          addRoutesToAllRoutes(routes);

          updatePageloadTransaction({
            activeRootSpan: getActiveRootSpan(),
            location,
            routes,
            allRoutes: Array.from(allRoutes),
          });
          isMountRenderPass.current = false;
        } else {
          handleNavigation({ location, routes, navigationType, version, allRoutes: Array.from(allRoutes) });
        }
      },
      // `props.children` is purposely not included in the dependency array, because we do not want to re-run this effect
      // when the children change. We only want to start transactions when the location or navigation type change.
      [location, navigationType],
    );

    // @ts-expect-error Setting more specific React Component typing for `R` generic above
    // will break advanced type inference done by react router params
    return React.createElement(Routes, { ...props,} );
  };

  hoistNonReactStatics.hoistNonReactStatics(SentryRoutes, Routes);

  // @ts-expect-error Setting more specific React Component typing for `R` generic above
  // will break advanced type inference done by react router params
  return SentryRoutes;
}

function getActiveRootSpan() {
  const span = core.getActiveSpan();
  const rootSpan = span ? core.getRootSpan(span) : undefined;

  if (!rootSpan) {
    return undefined;
  }

  const op = core.spanToJSON(rootSpan).op;

  // Only use this root span if it is a pageload or navigation span
  return op === 'navigation' || op === 'pageload' ? rootSpan : undefined;
}

exports.addResolvedRoutesToParent = addResolvedRoutesToParent;
exports.createReactRouterV6CompatibleTracingIntegration = createReactRouterV6CompatibleTracingIntegration;
exports.createV6CompatibleWithSentryReactRouterRouting = createV6CompatibleWithSentryReactRouterRouting;
exports.createV6CompatibleWrapCreateBrowserRouter = createV6CompatibleWrapCreateBrowserRouter;
exports.createV6CompatibleWrapCreateMemoryRouter = createV6CompatibleWrapCreateMemoryRouter;
exports.createV6CompatibleWrapUseRoutes = createV6CompatibleWrapUseRoutes;
exports.handleNavigation = handleNavigation;
exports.processResolvedRoutes = processResolvedRoutes;
exports.updateNavigationSpan = updateNavigationSpan;
//# sourceMappingURL=instrumentation.js.map
