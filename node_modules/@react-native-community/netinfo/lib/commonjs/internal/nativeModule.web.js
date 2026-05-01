"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _privateTypes = require("./privateTypes");

var _types = require("./types");

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
// Use a constant test of this form because in SSR on next.js, optional chaining is not sufficient,
// but this test correctly detects that window is not available and allows for conditionals before access
const isWindowPresent = typeof window !== 'undefined'; // Check if window exists and if the browser supports the connection API

const connection = isWindowPresent && !window.hasOwnProperty('tizen') && !window.hasOwnProperty('webOS') ? window.navigator.connection || window.navigator.mozConnection || window.navigator.webkitConnection : undefined; // Map browser types to native types

const typeMapping = {
  bluetooth: _types.NetInfoStateType.bluetooth,
  cellular: _types.NetInfoStateType.cellular,
  ethernet: _types.NetInfoStateType.ethernet,
  none: _types.NetInfoStateType.none,
  other: _types.NetInfoStateType.other,
  unknown: _types.NetInfoStateType.unknown,
  wifi: _types.NetInfoStateType.wifi,
  wimax: _types.NetInfoStateType.wimax,
  mixed: _types.NetInfoStateType.other
};
const effectiveTypeMapping = {
  '2g': _types.NetInfoCellularGeneration['2g'],
  '3g': _types.NetInfoCellularGeneration['3g'],
  '4g': _types.NetInfoCellularGeneration['4g'],
  'slow-2g': _types.NetInfoCellularGeneration['2g']
}; // Determine current state of connection

const getCurrentState = _requestedInterface => {
  const isConnected = isWindowPresent ? navigator.onLine : false;
  const baseState = {
    isInternetReachable: null
  }; // If we don't have a connection object, we return minimal information

  if (!connection) {
    if (isConnected) {
      const state = { ...baseState,
        isConnected: true,
        type: _types.NetInfoStateType.other,
        details: {
          isConnectionExpensive: false
        }
      };
      return state;
    }

    const state = { ...baseState,
      isConnected: false,
      isInternetReachable: false,
      type: _types.NetInfoStateType.none,
      details: null
    };
    return state;
  } // Otherwise try to return detailed information


  const isConnectionExpensive = connection.saveData;
  const type = connection.type ? typeMapping[connection.type] : isConnected ? _types.NetInfoStateType.other : _types.NetInfoStateType.unknown;

  if (type === _types.NetInfoStateType.bluetooth) {
    const state = { ...baseState,
      isConnected: true,
      type,
      details: {
        isConnectionExpensive
      }
    };
    return state;
  } else if (type === _types.NetInfoStateType.cellular) {
    const state = { ...baseState,
      isConnected: true,
      type,
      details: {
        isConnectionExpensive,
        cellularGeneration: effectiveTypeMapping[connection.effectiveType] || null,
        carrier: null
      }
    };
    return state;
  } else if (type === _types.NetInfoStateType.ethernet) {
    const state = { ...baseState,
      isConnected: true,
      type,
      details: {
        isConnectionExpensive,
        ipAddress: null,
        subnet: null
      }
    };
    return state;
  } else if (type === _types.NetInfoStateType.wifi) {
    const state = { ...baseState,
      isConnected: true,
      type,
      details: {
        isConnectionExpensive,
        ssid: null,
        bssid: null,
        strength: null,
        ipAddress: null,
        subnet: null,
        frequency: null,
        linkSpeed: null,
        rxLinkSpeed: null,
        txLinkSpeed: null
      }
    };
    return state;
  } else if (type === _types.NetInfoStateType.wimax) {
    const state = { ...baseState,
      isConnected: true,
      type,
      details: {
        isConnectionExpensive
      }
    };
    return state;
  } else if (type === _types.NetInfoStateType.none) {
    const state = { ...baseState,
      isConnected: false,
      isInternetReachable: false,
      type,
      details: null
    };
    return state;
  } else if (type === _types.NetInfoStateType.unknown) {
    const state = { ...baseState,
      isConnected,
      isInternetReachable: null,
      type,
      details: null
    };
    return state;
  }

  const state = { ...baseState,
    isConnected: true,
    type: _types.NetInfoStateType.other,
    details: {
      isConnectionExpensive
    }
  };
  return state;
};

const handlers = [];
const nativeHandlers = [];
const RNCNetInfo = {
  addListener(type, handler) {
    switch (type) {
      case _privateTypes.DEVICE_CONNECTIVITY_EVENT:
        {
          const nativeHandler = () => {
            handler(getCurrentState());
          };

          if (connection) {
            connection.addEventListener('change', nativeHandler);
          } else {
            if (isWindowPresent) {
              window.addEventListener('online', nativeHandler, false);
              window.addEventListener('offline', nativeHandler, false);
            }
          } // Remember handlers


          handlers.push(handler);
          nativeHandlers.push(nativeHandler);
          break;
        }
    }
  },

  removeListeners(type, handler) {
    switch (type) {
      case _privateTypes.DEVICE_CONNECTIVITY_EVENT:
        {
          // Get native handler
          const index = handlers.indexOf(handler);
          const nativeHandler = nativeHandlers[index];

          if (connection) {
            connection.removeEventListener('change', nativeHandler);
          } else {
            if (isWindowPresent) {
              window.removeEventListener('online', nativeHandler);
              window.removeEventListener('offline', nativeHandler);
            }
          } // Remove handlers


          handlers.splice(index, 1);
          nativeHandlers.splice(index, 1);
          break;
        }
    }
  },

  async getCurrentState(requestedInterface) {
    return getCurrentState(requestedInterface);
  },

  configure() {
    return;
  }

};
var _default = RNCNetInfo;
exports.default = _default;
//# sourceMappingURL=nativeModule.web.js.map