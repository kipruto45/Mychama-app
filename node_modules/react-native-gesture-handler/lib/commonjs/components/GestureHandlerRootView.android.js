"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = GestureHandlerRootView;
var React = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _init = require("../init");
var _GestureHandlerRootViewContext = _interopRequireDefault(require("../GestureHandlerRootViewContext"));
var _RNGestureHandlerRootViewNativeComponent = _interopRequireDefault(require("../specs/RNGestureHandlerRootViewNativeComponent"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function GestureHandlerRootView({
  style,
  ...rest
}) {
  // Try initialize fabric on the first render, at this point we can
  // reliably check if fabric is enabled (the function contains a flag
  // to make sure it's called only once)
  (0, _init.maybeInitializeFabric)();
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_GestureHandlerRootViewContext.default.Provider, {
    value: true,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_RNGestureHandlerRootViewNativeComponent.default, {
      style: style ?? styles.container,
      ...rest
    })
  });
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1
  }
});
//# sourceMappingURL=GestureHandlerRootView.android.js.map