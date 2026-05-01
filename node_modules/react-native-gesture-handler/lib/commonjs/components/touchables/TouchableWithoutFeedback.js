"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _GenericTouchable = _interopRequireDefault(require("./GenericTouchable"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * @deprecated TouchableWithoutFeedback will be removed in the future version of Gesture Handler. Use Pressable instead.
 */

/**
 * @deprecated TouchableWithoutFeedback will be removed in the future version of Gesture Handler. Use Pressable instead.
 */
const TouchableWithoutFeedback = /*#__PURE__*/React.forwardRef(({
  delayLongPress = 600,
  extraButtonProps = {
    rippleColor: 'transparent',
    exclusive: true
  },
  ...rest
}, ref) => /*#__PURE__*/(0, _jsxRuntime.jsx)(_GenericTouchable.default, {
  ref: ref,
  delayLongPress: delayLongPress,
  extraButtonProps: extraButtonProps,
  ...rest
}));
var _default = exports.default = TouchableWithoutFeedback;
//# sourceMappingURL=TouchableWithoutFeedback.js.map