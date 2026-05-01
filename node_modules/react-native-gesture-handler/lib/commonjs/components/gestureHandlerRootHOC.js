"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = gestureHandlerRootHOC;
var React = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _hoistNonReactStatics = _interopRequireDefault(require("hoist-non-react-statics"));
var _GestureHandlerRootView = _interopRequireDefault(require("./GestureHandlerRootView"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * @deprecated `gestureHandlerRootHOC` is deprecated and will be removed in the future version of Gesture Handler.
 * Use `GestureHandlerRootView` directly instead.
 */function gestureHandlerRootHOC(Component, containerStyles) {
  function Wrapper(props) {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(_GestureHandlerRootView.default, {
      style: [styles.container, containerStyles],
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)(Component, {
        ...props
      })
    });
  }
  Wrapper.displayName = `gestureHandlerRootHOC(${Component.displayName || Component.name})`;

  // @ts-ignore - hoistNonReactStatics uses old version of @types/react
  (0, _hoistNonReactStatics.default)(Wrapper, Component);
  return Wrapper;
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1
  }
});
//# sourceMappingURL=gestureHandlerRootHOC.js.map