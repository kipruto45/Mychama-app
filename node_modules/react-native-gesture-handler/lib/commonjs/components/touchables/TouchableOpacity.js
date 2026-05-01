"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _reactNative = require("react-native");
var _GenericTouchable = _interopRequireWildcard(require("./GenericTouchable"));
var _react = _interopRequireWildcard(require("react"));
var React = _react;
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * @deprecated TouchableOpacity will be removed in the future version of Gesture Handler. Use Pressable instead.
 */

/**
 * @deprecated TouchableOpacity will be removed in the future version of Gesture Handler. Use Pressable instead.
 *
 * TouchableOpacity bases on timing animation which has been used in RN's core
 */
class TouchableOpacity extends _react.Component {
  static defaultProps = {
    ..._GenericTouchable.default.defaultProps,
    activeOpacity: 0.2
  };

  // Opacity is 1 one by default but could be overwritten
  getChildStyleOpacityWithDefault = () => {
    const childStyle = _reactNative.StyleSheet.flatten(this.props.style) || {};
    return childStyle.opacity == null ? 1 : childStyle.opacity.valueOf();
  };
  opacity = new _reactNative.Animated.Value(this.getChildStyleOpacityWithDefault());
  setOpacityTo = (value, duration) => {
    _reactNative.Animated.timing(this.opacity, {
      toValue: value,
      duration: duration,
      easing: _reactNative.Easing.inOut(_reactNative.Easing.quad),
      useNativeDriver: this.props.useNativeAnimations ?? true
    }).start();
  };
  onStateChange = (_from, to) => {
    if (to === _GenericTouchable.TOUCHABLE_STATE.BEGAN) {
      this.setOpacityTo(this.props.activeOpacity, 0);
    } else if (to === _GenericTouchable.TOUCHABLE_STATE.UNDETERMINED || to === _GenericTouchable.TOUCHABLE_STATE.MOVED_OUTSIDE) {
      this.setOpacityTo(this.getChildStyleOpacityWithDefault(), 150);
    }
  };
  render() {
    const {
      style = {},
      ...rest
    } = this.props;
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(_GenericTouchable.default, {
      ...rest,
      style: [style, {
        opacity: this.opacity // TODO: fix this
      }],
      onStateChange: this.onStateChange,
      children: this.props.children ? this.props.children : /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {})
    });
  }
}
exports.default = TouchableOpacity;
//# sourceMappingURL=TouchableOpacity.js.map