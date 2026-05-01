"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.getIsReactActEnvironment = getIsReactActEnvironment;
exports.setReactActEnvironment = setIsReactActEnvironment;
var React = _interopRequireWildcard(require("react"));
var _reactTestRenderer = require("react-test-renderer");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
// This file and the act() implementation is sourced from react-testing-library
// https://github.com/testing-library/react-testing-library/blob/3dcd8a9649e25054c0e650d95fca2317b7008576/types/index.d.ts

const reactAct = typeof React.act === 'function' ? React.act : _reactTestRenderer.act;

// See https://github.com/reactwg/react-18/discussions/102 for more context on global.IS_REACT_ACT_ENVIRONMENT

function setIsReactActEnvironment(isReactActEnvironment) {
  globalThis.IS_REACT_ACT_ENVIRONMENT = isReactActEnvironment;
}
function getIsReactActEnvironment() {
  return globalThis.IS_REACT_ACT_ENVIRONMENT;
}
function withGlobalActEnvironment(actImplementation) {
  return callback => {
    const previousActEnvironment = getIsReactActEnvironment();
    setIsReactActEnvironment(true);
    try {
      // The return value of `act` is always a thenable.
      let callbackNeedsToBeAwaited = false;
      const actResult = actImplementation(() => {
        const result = callback();
        // @ts-expect-error TS is too strict here
        if (result !== null && typeof result === 'object' && typeof result.then === 'function') {
          callbackNeedsToBeAwaited = true;
        }
        return result;
      });
      if (callbackNeedsToBeAwaited) {
        const thenable = actResult;
        return {
          then: (resolve, reject) => {
            // eslint-disable-next-line promise/catch-or-return, promise/prefer-await-to-then
            thenable.then(
            // eslint-disable-next-line promise/always-return
            returnValue => {
              setIsReactActEnvironment(previousActEnvironment);
              resolve(returnValue);
            }, error => {
              setIsReactActEnvironment(previousActEnvironment);
              reject(error);
            });
          }
        };
      } else {
        setIsReactActEnvironment(previousActEnvironment);
        return actResult;
      }
    } catch (error) {
      // Can't be a `finally {}` block since we don't know if we have to immediately restore IS_REACT_ACT_ENVIRONMENT
      // or if we have to await the callback first.
      setIsReactActEnvironment(previousActEnvironment);
      throw error;
    }
  };
}

// @ts-expect-error: typings get too complex
const act = withGlobalActEnvironment(reactAct);
var _default = exports.default = act;
//# sourceMappingURL=act.js.map