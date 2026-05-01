"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TextInput = exports.Switch = exports.ScrollView = exports.RefreshControl = exports.FlatList = exports.DrawerLayoutAndroid = void 0;
var React = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _createNativeWrapper = _interopRequireDefault(require("../handlers/createNativeWrapper"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const ScrollView = exports.ScrollView = (0, _createNativeWrapper.default)(_reactNative.ScrollView, {
  disallowInterruption: false
});
const Switch = exports.Switch = (0, _createNativeWrapper.default)(_reactNative.Switch, {
  shouldCancelWhenOutside: false,
  shouldActivateOnStart: true,
  disallowInterruption: true
});
const TextInput = exports.TextInput = (0, _createNativeWrapper.default)(_reactNative.TextInput);
const DrawerLayoutAndroid = () => {
  console.warn('DrawerLayoutAndroid is not supported on web!');
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {});
};

// RefreshControl is implemented as a functional component, rendering a View
// NativeViewGestureHandler needs to set a ref on its child, which cannot be done
// on functional components
exports.DrawerLayoutAndroid = DrawerLayoutAndroid;
const RefreshControl = exports.RefreshControl = (0, _createNativeWrapper.default)(_reactNative.View);
const FlatList = exports.FlatList = /*#__PURE__*/React.forwardRef((props, ref) => /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.FlatList, {
  ref: ref,
  ...props,
  renderScrollComponent: scrollProps => /*#__PURE__*/(0, _jsxRuntime.jsx)(ScrollView, {
    ...scrollProps
  })
}));
//# sourceMappingURL=GestureComponents.web.js.map