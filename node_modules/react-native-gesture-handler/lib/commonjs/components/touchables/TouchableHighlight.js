"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var React = _react;
var _GenericTouchable = _interopRequireWildcard(require("./GenericTouchable"));
var _reactNative = require("react-native");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * @deprecated TouchableHighlight will be removed in the future version of Gesture Handler. Use Pressable instead.
 */

/**
 * @deprecated TouchableHighlight will be removed in the future version of Gesture Handler. Use Pressable instead.
 *
 * TouchableHighlight follows RN's implementation
 */
class TouchableHighlight extends _react.Component {
  static defaultProps = {
    ..._GenericTouchable.default.defaultProps,
    activeOpacity: 0.85,
    delayPressOut: 100,
    underlayColor: 'black'
  };
  constructor(props) {
    super(props);
    this.state = {
      extraChildStyle: null,
      extraUnderlayStyle: null
    };
  }

  // Copied from RN
  showUnderlay = () => {
    if (!this.hasPressHandler()) {
      return;
    }
    this.setState({
      extraChildStyle: {
        opacity: this.props.activeOpacity
      },
      extraUnderlayStyle: {
        backgroundColor: this.props.underlayColor
      }
    });
    this.props.onShowUnderlay?.();
  };
  hasPressHandler = () => this.props.onPress || this.props.onPressIn || this.props.onPressOut || this.props.onLongPress;
  hideUnderlay = () => {
    this.setState({
      extraChildStyle: null,
      extraUnderlayStyle: null
    });
    this.props.onHideUnderlay?.();
  };
  renderChildren() {
    if (!this.props.children) {
      return /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {});
    }
    const child = React.Children.only(this.props.children); // TODO: not sure if OK but fixes error
    return /*#__PURE__*/React.cloneElement(child, {
      style: _reactNative.StyleSheet.compose(child.props.style, this.state.extraChildStyle)
    });
  }
  onStateChange = (_from, to) => {
    if (to === _GenericTouchable.TOUCHABLE_STATE.BEGAN) {
      this.showUnderlay();
    } else if (to === _GenericTouchable.TOUCHABLE_STATE.UNDETERMINED || to === _GenericTouchable.TOUCHABLE_STATE.MOVED_OUTSIDE) {
      this.hideUnderlay();
    }
  };
  render() {
    const {
      style = {},
      ...rest
    } = this.props;
    const {
      extraUnderlayStyle
    } = this.state;
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(_GenericTouchable.default, {
      ...rest,
      style: [style, extraUnderlayStyle],
      onStateChange: this.onStateChange,
      children: this.renderChildren()
    });
  }
}
exports.default = TouchableHighlight;
//# sourceMappingURL=TouchableHighlight.js.map