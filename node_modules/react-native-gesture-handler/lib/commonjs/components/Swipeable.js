"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var React = _react;
var _reactNative = require("react-native");
var _PanGestureHandler = require("../handlers/PanGestureHandler");
var _TapGestureHandler = require("../handlers/TapGestureHandler");
var _State = require("../State");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
// Similarily to the DrawerLayout component this deserves to be put in a
// separate repo. Although, keeping it here for the time being will allow us to
// move faster and fix possible issues quicker

const DRAG_TOSS = 0.05;

// Animated.AnimatedInterpolation has been converted to a generic type
// in @types/react-native 0.70. This way we can maintain compatibility
// with all versions of @types/react-native

/**
 * @deprecated use Reanimated version of Swipeable instead
 *
 * This component allows for implementing swipeable rows or similar interaction.
 */

class Swipeable extends _react.Component {
  static defaultProps = {
    friction: 1,
    overshootFriction: 1,
    useNativeAnimations: true
  };
  constructor(props) {
    super(props);
    const dragX = new _reactNative.Animated.Value(0);
    this.state = {
      dragX,
      rowTranslation: new _reactNative.Animated.Value(0),
      rowState: 0,
      leftWidth: undefined,
      rightOffset: undefined,
      rowWidth: undefined
    };
    this.updateAnimatedEvent(props, this.state);
    this.onGestureEvent = _reactNative.Animated.event([{
      nativeEvent: {
        translationX: dragX
      }
    }], {
      useNativeDriver: props.useNativeAnimations
    });
  }
  shouldComponentUpdate(props, state) {
    if (this.props.friction !== props.friction || this.props.overshootLeft !== props.overshootLeft || this.props.overshootRight !== props.overshootRight || this.props.overshootFriction !== props.overshootFriction || this.state.leftWidth !== state.leftWidth || this.state.rightOffset !== state.rightOffset || this.state.rowWidth !== state.rowWidth) {
      this.updateAnimatedEvent(props, state);
    }
    return true;
  }
  updateAnimatedEvent = (props, state) => {
    const {
      friction,
      overshootFriction
    } = props;
    const {
      dragX,
      rowTranslation,
      leftWidth = 0,
      rowWidth = 0
    } = state;
    const {
      rightOffset = rowWidth
    } = state;
    const rightWidth = Math.max(0, rowWidth - rightOffset);
    const {
      overshootLeft = leftWidth > 0,
      overshootRight = rightWidth > 0
    } = props;
    const transX = _reactNative.Animated.add(rowTranslation, dragX.interpolate({
      inputRange: [0, friction],
      outputRange: [0, 1]
    })).interpolate({
      inputRange: [-rightWidth - 1, -rightWidth, leftWidth, leftWidth + 1],
      outputRange: [-rightWidth - (overshootRight ? 1 / overshootFriction : 0), -rightWidth, leftWidth, leftWidth + (overshootLeft ? 1 / overshootFriction : 0)]
    });
    this.transX = transX;
    this.showLeftAction = leftWidth > 0 ? transX.interpolate({
      inputRange: [-1, 0, leftWidth],
      outputRange: [0, 0, 1]
    }) : new _reactNative.Animated.Value(0);
    this.leftActionTranslate = this.showLeftAction.interpolate({
      inputRange: [0, Number.MIN_VALUE],
      outputRange: [-10000, 0],
      extrapolate: 'clamp'
    });
    this.showRightAction = rightWidth > 0 ? transX.interpolate({
      inputRange: [-rightWidth, 0, 1],
      outputRange: [1, 0, 0]
    }) : new _reactNative.Animated.Value(0);
    this.rightActionTranslate = this.showRightAction.interpolate({
      inputRange: [0, Number.MIN_VALUE],
      outputRange: [-10000, 0],
      extrapolate: 'clamp'
    });
  };
  onTapHandlerStateChange = ({
    nativeEvent
  }) => {
    if (nativeEvent.oldState === _State.State.ACTIVE) {
      this.close();
    }
  };
  onHandlerStateChange = ev => {
    if (ev.nativeEvent.oldState === _State.State.ACTIVE) {
      this.handleRelease(ev);
    }
    if (ev.nativeEvent.state === _State.State.ACTIVE) {
      const {
        velocityX,
        translationX: dragX
      } = ev.nativeEvent;
      const {
        rowState
      } = this.state;
      const {
        friction
      } = this.props;
      const translationX = (dragX + DRAG_TOSS * velocityX) / friction;
      const direction = rowState === -1 ? 'right' : rowState === 1 ? 'left' : translationX > 0 ? 'left' : 'right';
      if (rowState === 0) {
        this.props.onSwipeableOpenStartDrag?.(direction);
      } else {
        this.props.onSwipeableCloseStartDrag?.(direction);
      }
    }
  };
  handleRelease = ev => {
    const {
      velocityX,
      translationX: dragX
    } = ev.nativeEvent;
    const {
      leftWidth = 0,
      rowWidth = 0,
      rowState
    } = this.state;
    const {
      rightOffset = rowWidth
    } = this.state;
    const rightWidth = rowWidth - rightOffset;
    const {
      friction,
      leftThreshold = leftWidth / 2,
      rightThreshold = rightWidth / 2
    } = this.props;
    const startOffsetX = this.currentOffset() + dragX / friction;
    const translationX = (dragX + DRAG_TOSS * velocityX) / friction;
    let toValue = 0;
    if (rowState === 0) {
      if (translationX > leftThreshold) {
        toValue = leftWidth;
      } else if (translationX < -rightThreshold) {
        toValue = -rightWidth;
      }
    } else if (rowState === 1) {
      // Swiped to left
      if (translationX > -leftThreshold) {
        toValue = leftWidth;
      }
    } else {
      // Swiped to right
      if (translationX < rightThreshold) {
        toValue = -rightWidth;
      }
    }
    this.animateRow(startOffsetX, toValue, velocityX / friction);
  };
  animateRow = (fromValue, toValue, velocityX) => {
    const {
      dragX,
      rowTranslation
    } = this.state;
    dragX.setValue(0);
    rowTranslation.setValue(fromValue);
    this.setState({
      rowState: Math.sign(toValue)
    });
    _reactNative.Animated.spring(rowTranslation, {
      restSpeedThreshold: 1.7,
      restDisplacementThreshold: 0.4,
      velocity: velocityX,
      bounciness: 0,
      toValue,
      useNativeDriver: this.props.useNativeAnimations,
      ...this.props.animationOptions
    }).start(({
      finished
    }) => {
      if (finished) {
        if (toValue > 0) {
          this.props.onSwipeableLeftOpen?.();
          this.props.onSwipeableOpen?.('left', this);
        } else if (toValue < 0) {
          this.props.onSwipeableRightOpen?.();
          this.props.onSwipeableOpen?.('right', this);
        } else {
          const closingDirection = fromValue > 0 ? 'left' : 'right';
          this.props.onSwipeableClose?.(closingDirection, this);
        }
      }
    });
    if (toValue > 0) {
      this.props.onSwipeableLeftWillOpen?.();
      this.props.onSwipeableWillOpen?.('left');
    } else if (toValue < 0) {
      this.props.onSwipeableRightWillOpen?.();
      this.props.onSwipeableWillOpen?.('right');
    } else {
      const closingDirection = fromValue > 0 ? 'left' : 'right';
      this.props.onSwipeableWillClose?.(closingDirection);
    }
  };
  onRowLayout = ({
    nativeEvent
  }) => {
    this.setState({
      rowWidth: nativeEvent.layout.width
    });
  };
  currentOffset = () => {
    const {
      leftWidth = 0,
      rowWidth = 0,
      rowState
    } = this.state;
    const {
      rightOffset = rowWidth
    } = this.state;
    const rightWidth = rowWidth - rightOffset;
    if (rowState === 1) {
      return leftWidth;
    } else if (rowState === -1) {
      return -rightWidth;
    }
    return 0;
  };
  close = () => {
    this.animateRow(this.currentOffset(), 0);
  };

  // eslint-disable-next-line @eslint-react/no-unused-class-component-members
  openLeft = () => {
    const {
      leftWidth = 0
    } = this.state;
    this.animateRow(this.currentOffset(), leftWidth);
  };

  // eslint-disable-next-line @eslint-react/no-unused-class-component-members
  openRight = () => {
    const {
      rowWidth = 0
    } = this.state;
    const {
      rightOffset = rowWidth
    } = this.state;
    const rightWidth = rowWidth - rightOffset;
    this.animateRow(this.currentOffset(), -rightWidth);
  };

  // eslint-disable-next-line @eslint-react/no-unused-class-component-members
  reset = () => {
    const {
      dragX,
      rowTranslation
    } = this.state;
    dragX.setValue(0);
    rowTranslation.setValue(0);
    this.setState({
      rowState: 0
    });
  };
  render() {
    const {
      rowState
    } = this.state;
    const {
      children,
      renderLeftActions,
      renderRightActions,
      dragOffsetFromLeftEdge = 10,
      dragOffsetFromRightEdge = 10
    } = this.props;
    const left = renderLeftActions && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNative.Animated.View, {
      style: [styles.leftActions,
      // All those and below parameters can have ! since they are all
      // asigned in constructor in `updateAnimatedEvent` but TS cannot spot
      // it for some reason
      {
        transform: [{
          translateX: this.leftActionTranslate
        }]
      }],
      children: [renderLeftActions(this.showLeftAction, this.transX, this), /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
        onLayout: ({
          nativeEvent
        }) => this.setState({
          leftWidth: nativeEvent.layout.x
        })
      })]
    });
    const right = renderRightActions && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNative.Animated.View, {
      style: [styles.rightActions, {
        transform: [{
          translateX: this.rightActionTranslate
        }]
      }],
      children: [renderRightActions(this.showRightAction, this.transX, this), /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
        onLayout: ({
          nativeEvent
        }) => this.setState({
          rightOffset: nativeEvent.layout.x
        })
      })]
    });
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(_PanGestureHandler.PanGestureHandler, {
      activeOffsetX: [-dragOffsetFromRightEdge, dragOffsetFromLeftEdge],
      touchAction: "pan-y",
      ...this.props,
      onGestureEvent: this.onGestureEvent,
      onHandlerStateChange: this.onHandlerStateChange,
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNative.Animated.View, {
        onLayout: this.onRowLayout,
        style: [styles.container, this.props.containerStyle],
        children: [left, right, /*#__PURE__*/(0, _jsxRuntime.jsx)(_TapGestureHandler.TapGestureHandler, {
          enabled: rowState !== 0,
          touchAction: "pan-y",
          onHandlerStateChange: this.onTapHandlerStateChange,
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Animated.View, {
            pointerEvents: rowState === 0 ? 'auto' : 'box-only',
            style: [{
              transform: [{
                translateX: this.transX
              }]
            }, this.props.childrenContainerStyle],
            children: children
          })
        })]
      })
    });
  }
}
exports.default = Swipeable;
const styles = _reactNative.StyleSheet.create({
  container: {
    overflow: 'hidden'
  },
  leftActions: {
    ..._reactNative.StyleSheet.absoluteFillObject,
    flexDirection: _reactNative.I18nManager.isRTL ? 'row-reverse' : 'row'
  },
  rightActions: {
    ..._reactNative.StyleSheet.absoluteFillObject,
    flexDirection: _reactNative.I18nManager.isRTL ? 'row' : 'row-reverse'
  }
});
//# sourceMappingURL=Swipeable.js.map