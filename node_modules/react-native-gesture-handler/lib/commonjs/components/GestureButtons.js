"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BorderlessButton = exports.BaseButton = void 0;
Object.defineProperty(exports, "PureNativeButton", {
  enumerable: true,
  get: function () {
    return _GestureHandlerButton.default;
  }
});
exports.RectButton = exports.RawButton = void 0;
var React = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _createNativeWrapper = _interopRequireDefault(require("../handlers/createNativeWrapper"));
var _GestureHandlerButton = _interopRequireDefault(require("./GestureHandlerButton"));
var _State = require("../State");
var _utils = require("../utils");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const RawButton = exports.RawButton = (0, _createNativeWrapper.default)(_GestureHandlerButton.default, {
  shouldCancelWhenOutside: false,
  shouldActivateOnStart: false
});
let IS_FABRIC = null;
class InnerBaseButton extends React.Component {
  static defaultProps = {
    delayLongPress: 600
  };
  constructor(props) {
    super(props);
    this.lastActive = false;
    this.longPressDetected = false;
  }
  handleEvent = ({
    nativeEvent
  }) => {
    const {
      state,
      oldState,
      pointerInside
    } = nativeEvent;
    const active = pointerInside && state === _State.State.ACTIVE;
    if (active !== this.lastActive && this.props.onActiveStateChange) {
      this.props.onActiveStateChange(active);
    }
    if (!this.longPressDetected && oldState === _State.State.ACTIVE && state !== _State.State.CANCELLED && this.lastActive && this.props.onPress) {
      this.props.onPress(pointerInside);
    }
    if (!this.lastActive &&
    // NativeViewGestureHandler sends different events based on platform
    state === (_reactNative.Platform.OS !== 'android' ? _State.State.ACTIVE : _State.State.BEGAN) && pointerInside) {
      this.longPressDetected = false;
      if (this.props.onLongPress) {
        this.longPressTimeout = setTimeout(this.onLongPress, this.props.delayLongPress);
      }
    } else if (
    // Cancel longpress timeout if it's set and the finger moved out of the view
    state === _State.State.ACTIVE && !pointerInside && this.longPressTimeout !== undefined) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = undefined;
    } else if (
    // Cancel longpress timeout if it's set and the gesture has finished
    this.longPressTimeout !== undefined && (state === _State.State.END || state === _State.State.CANCELLED || state === _State.State.FAILED)) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = undefined;
    }
    this.lastActive = active;
  };
  onLongPress = () => {
    this.longPressDetected = true;
    this.props.onLongPress?.();
  };

  // Normally, the parent would execute it's handler first, then forward the
  // event to listeners. However, here our handler is virtually only forwarding
  // events to listeners, so we reverse the order to keep the proper order of
  // the callbacks (from "raw" ones to "processed").
  onHandlerStateChange = e => {
    this.props.onHandlerStateChange?.(e);
    this.handleEvent(e);
  };
  onGestureEvent = e => {
    this.props.onGestureEvent?.(e);
    this.handleEvent(e); // TODO: maybe it is not correct
  };
  render() {
    const {
      rippleColor: unprocessedRippleColor,
      style,
      ...rest
    } = this.props;
    if (IS_FABRIC === null) {
      IS_FABRIC = (0, _utils.isFabric)();
    }
    const rippleColor = IS_FABRIC ? unprocessedRippleColor : (0, _reactNative.processColor)(unprocessedRippleColor ?? undefined);
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(RawButton, {
      ref: this.props.innerRef,
      rippleColor: rippleColor,
      style: [style, _reactNative.Platform.OS === 'ios' && {
        cursor: undefined
      }],
      ...rest,
      onGestureEvent: this.onGestureEvent,
      onHandlerStateChange: this.onHandlerStateChange
    });
  }
}
const AnimatedInnerBaseButton = _reactNative.Animated.createAnimatedComponent(InnerBaseButton);
const BaseButton = exports.BaseButton = /*#__PURE__*/React.forwardRef((props, ref) => /*#__PURE__*/(0, _jsxRuntime.jsx)(InnerBaseButton, {
  innerRef: ref,
  ...props
}));
const AnimatedBaseButton = /*#__PURE__*/React.forwardRef((props, ref) => /*#__PURE__*/(0, _jsxRuntime.jsx)(AnimatedInnerBaseButton, {
  innerRef: ref,
  ...props
}));
const btnStyles = _reactNative.StyleSheet.create({
  underlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0
  }
});
class InnerRectButton extends React.Component {
  static defaultProps = {
    activeOpacity: 0.105,
    underlayColor: 'black'
  };
  constructor(props) {
    super(props);
    this.opacity = new _reactNative.Animated.Value(0);
  }
  onActiveStateChange = active => {
    if (_reactNative.Platform.OS !== 'android') {
      this.opacity.setValue(active ? this.props.activeOpacity : 0);
    }
    this.props.onActiveStateChange?.(active);
  };
  render() {
    const {
      children,
      style,
      ...rest
    } = this.props;
    const resolvedStyle = _reactNative.StyleSheet.flatten(style) ?? {};
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)(BaseButton, {
      ...rest,
      ref: this.props.innerRef,
      style: resolvedStyle,
      onActiveStateChange: this.onActiveStateChange,
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Animated.View, {
        style: [btnStyles.underlay, {
          opacity: this.opacity,
          backgroundColor: this.props.underlayColor,
          borderRadius: resolvedStyle.borderRadius,
          borderTopLeftRadius: resolvedStyle.borderTopLeftRadius,
          borderTopRightRadius: resolvedStyle.borderTopRightRadius,
          borderBottomLeftRadius: resolvedStyle.borderBottomLeftRadius,
          borderBottomRightRadius: resolvedStyle.borderBottomRightRadius
        }]
      }), children]
    });
  }
}
const RectButton = exports.RectButton = /*#__PURE__*/React.forwardRef((props, ref) => /*#__PURE__*/(0, _jsxRuntime.jsx)(InnerRectButton, {
  innerRef: ref,
  ...props
}));
class InnerBorderlessButton extends React.Component {
  static defaultProps = {
    activeOpacity: 0.3,
    borderless: true
  };
  constructor(props) {
    super(props);
    this.opacity = new _reactNative.Animated.Value(1);
  }
  onActiveStateChange = active => {
    if (_reactNative.Platform.OS !== 'android') {
      this.opacity.setValue(active ? this.props.activeOpacity : 1);
    }
    this.props.onActiveStateChange?.(active);
  };
  render() {
    const {
      children,
      style,
      innerRef,
      ...rest
    } = this.props;
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(AnimatedBaseButton, {
      ...rest,
      innerRef: innerRef,
      onActiveStateChange: this.onActiveStateChange,
      style: [style, _reactNative.Platform.OS === 'ios' && {
        opacity: this.opacity
      }],
      children: children
    });
  }
}
const BorderlessButton = exports.BorderlessButton = /*#__PURE__*/React.forwardRef((props, ref) => /*#__PURE__*/(0, _jsxRuntime.jsx)(InnerBorderlessButton, {
  innerRef: ref,
  ...props
}));
//# sourceMappingURL=GestureButtons.js.map