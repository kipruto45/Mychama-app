"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _reactNative = require("react-native");
var _react = _interopRequireWildcard(require("react"));
var React = _react;
var _GenericTouchable = _interopRequireDefault(require("./GenericTouchable"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * @deprecated TouchableNativeFeedback will be removed in the future version of Gesture Handler. Use Pressable instead.
 *
 * TouchableNativeFeedback behaves slightly different than RN's TouchableNativeFeedback.
 * There's small difference with handling long press ripple since RN's implementation calls
 * ripple animation via bridge. This solution leaves all animations' handling for native components so
 * it follows native behaviours.
 */
class TouchableNativeFeedback extends _react.Component {
  static defaultProps = {
    ..._GenericTouchable.default.defaultProps,
    useForeground: true,
    extraButtonProps: {
      // Disable hiding ripple on Android
      rippleColor: null
    }
  };

  // Could be taken as RNTouchableNativeFeedback.SelectableBackground etc. but the API may change
  static SelectableBackground = rippleRadius => ({
    type: 'ThemeAttrAndroid',
    // I added `attribute` prop to clone the implementation of RN and be able to use only 2 types
    attribute: 'selectableItemBackground',
    rippleRadius
  });
  static SelectableBackgroundBorderless = rippleRadius => ({
    type: 'ThemeAttrAndroid',
    attribute: 'selectableItemBackgroundBorderless',
    rippleRadius
  });
  static Ripple = (color, borderless, rippleRadius) => ({
    type: 'RippleAndroid',
    color,
    borderless,
    rippleRadius
  });
  static canUseNativeForeground = () => _reactNative.Platform.OS === 'android' && _reactNative.Platform.Version >= 23;
  getExtraButtonProps() {
    const extraProps = {};
    const {
      background
    } = this.props;
    if (background) {
      // I changed type values to match those used in RN
      // TODO(TS): check if it works the same as previous implementation - looks like it works the same as RN component, so it should be ok
      if (background.type === 'RippleAndroid') {
        extraProps['borderless'] = background.borderless;
        extraProps['rippleColor'] = background.color;
      } else if (background.type === 'ThemeAttrAndroid') {
        extraProps['borderless'] = background.attribute === 'selectableItemBackgroundBorderless';
      }
      // I moved it from above since it should be available in all options
      extraProps['rippleRadius'] = background.rippleRadius;
    }
    extraProps['foreground'] = this.props.useForeground;
    return extraProps;
  }
  render() {
    const {
      style = {},
      ...rest
    } = this.props;
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(_GenericTouchable.default, {
      ...rest,
      style: style,
      extraButtonProps: this.getExtraButtonProps()
    });
  }
}
exports.default = TouchableNativeFeedback;
//# sourceMappingURL=TouchableNativeFeedback.android.js.map