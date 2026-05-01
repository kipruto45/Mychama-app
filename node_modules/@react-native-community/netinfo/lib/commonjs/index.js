"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  configure: true,
  fetch: true,
  refresh: true,
  addEventListener: true,
  useNetInfo: true,
  useNetInfoInstance: true
};
exports.configure = configure;
exports.fetch = fetch;
exports.refresh = refresh;
exports.addEventListener = addEventListener;
exports.useNetInfo = useNetInfo;
exports.useNetInfoInstance = useNetInfoInstance;
exports.default = void 0;

var _react = require("react");

var _reactNative = require("react-native");

var _defaultConfiguration = _interopRequireDefault(require("./internal/defaultConfiguration"));

var _nativeInterface = _interopRequireDefault(require("./internal/nativeInterface"));

var _state2 = _interopRequireDefault(require("./internal/state"));

var Types = _interopRequireWildcard(require("./internal/types"));

Object.keys(Types).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === Types[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return Types[key];
    }
  });
});

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
// Stores the currently used configuration
let _configuration = _defaultConfiguration.default; // Stores the singleton reference to the state manager

let _state = null;

const createState = () => {
  return new _state2.default(_configuration);
}; // Track ongoing requests


let isRequestInProgress = false;
let requestQueue = [];
/**
 * Configures the library with the given configuration. Note that calling this will stop all
 * previously added listeners from being called again. It is best to call this right when your
 * application is started to avoid issues. The configuration sets up a global singleton instance.
 *
 * @param configuration The new configuration to set.
 */

function configure(configuration) {
  _configuration = { ..._defaultConfiguration.default,
    ...configuration
  };

  if (_state) {
    _state.tearDown();

    _state = createState();
  }

  if (_reactNative.Platform.OS === 'ios') {
    _nativeInterface.default.configure(configuration);
  }
}
/**
 * Returns a `Promise` that resolves to a `NetInfoState` object.
 * This function operates on the global singleton instance configured using `configure()`
 *
 * @param [requestedInterface] interface from which to obtain the information
 *
 * @returns A Promise which contains the current connection state.
 */


function fetch(requestedInterface) {
  if (!_state) {
    _state = createState();
  }

  return _state.latest(requestedInterface);
}
/**
 * Force-refreshes the internal state of the global singleton managed by this library.
 *
 * @returns A Promise which contains the updated connection state.
 */


function refresh() {
  if (!_state) {
    _state = createState();
  } // If a request is already in progress, return a promise that will resolve when the current request finishes


  if (isRequestInProgress) {
    return new Promise(resolve => {
      requestQueue.push(resolve);
    });
  }

  isRequestInProgress = true;
  return _state._fetchCurrentState().then(result => {
    requestQueue.forEach(resolve => resolve(result));
    requestQueue = [];
    return result;
  }).finally(() => {
    isRequestInProgress = false;
  });
}
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


function addEventListener(listener) {
  if (!_state) {
    _state = createState();
  }

  _state.add(listener);

  return () => {
    _state && _state.remove(listener);
  };
}
/**
 * A React Hook into this library's singleton which updates when the connection state changes.
 *
 * @param {Partial<Types.NetInfoConfiguration>} configuration - Configure the isolated network checker managed by this hook
 *
 * @returns The connection state.
 */


function useNetInfo(configuration) {
  if (configuration) {
    configure(configuration);
  }

  const [netInfo, setNetInfo] = (0, _react.useState)({
    type: Types.NetInfoStateType.unknown,
    isConnected: null,
    isInternetReachable: null,
    details: null
  });
  (0, _react.useEffect)(() => {
    const unsubscribe = addEventListener(setNetInfo);
    return () => unsubscribe();
  }, []);
  return netInfo;
}
/**
 * A React Hook which manages an isolated instance of the network info manager.
 * This is not a hook into a singleton shared state. NetInfo.configure, NetInfo.addEventListener,
 * NetInfo.fetch, NetInfo.refresh are performed on a global singleton and have no affect on this hook.
 * @param {boolean} isPaused - Pause the internal network checks.
 * @param {Partial<Types.NetInfoConfiguration>} configuration - Configure the isolated network checker managed by this hook
 *
 * @returns the netInfo state and a refresh function
 */


function useNetInfoInstance(isPaused = false, configuration) {
  const [networkInfoManager, setNetworkInfoManager] = (0, _react.useState)();
  const [netInfo, setNetInfo] = (0, _react.useState)({
    type: Types.NetInfoStateType.unknown,
    isConnected: null,
    isInternetReachable: null,
    details: null
  });
  (0, _react.useEffect)(() => {
    if (isPaused) {
      return;
    }

    const config = { ..._defaultConfiguration.default,
      ...configuration
    };
    const state = new _state2.default(config);
    setNetworkInfoManager(state);
    state.add(setNetInfo);
    return state.tearDown;
  }, [isPaused, configuration]);
  const refresh = (0, _react.useCallback)(() => {
    if (networkInfoManager && !isRequestInProgress) {
      isRequestInProgress = true;

      networkInfoManager._fetchCurrentState().finally(() => {
        isRequestInProgress = false;
      });
    }
  }, [networkInfoManager]);
  return {
    netInfo,
    refresh
  };
}

var _default = {
  configure,
  fetch,
  refresh,
  addEventListener,
  useNetInfo,
  useNetInfoInstance
};
exports.default = _default;
//# sourceMappingURL=index.js.map