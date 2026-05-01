"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _gestureObjects = require("../../handlers/gestures/gestureObjects");
var _GestureDetector = require("../../handlers/gestures/GestureDetector");
var _reactNative = require("react-native");
var _GestureHandlerButton = _interopRequireDefault(require("../GestureHandlerButton"));
var _utils = require("./utils");
var _PressabilityDebugView = require("../../handlers/PressabilityDebugView");
var _utils2 = require("../../utils");
var _utils3 = require("../utils");
var _stateDefinitions = require("./stateDefinitions");
var _StateMachine = require("./StateMachine");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const DEFAULT_LONG_PRESS_DURATION = 500;
const IS_TEST_ENV = (0, _utils2.isTestEnv)();
let IS_FABRIC = null;
const Pressable = props => {
  const {
    testOnly_pressed,
    hitSlop,
    pressRetentionOffset,
    delayHoverIn,
    delayHoverOut,
    delayLongPress,
    unstable_pressDelay,
    onHoverIn,
    onHoverOut,
    onPress,
    onPressIn,
    onPressOut,
    onLongPress,
    onLayout,
    style,
    children,
    android_disableSound,
    android_ripple,
    disabled,
    accessible,
    simultaneousWithExternalGesture,
    requireExternalGestureToFail,
    blocksExternalGesture,
    ...remainingProps
  } = props;
  const relationProps = {
    simultaneousWithExternalGesture,
    requireExternalGestureToFail,
    blocksExternalGesture
  };
  const [pressedState, setPressedState] = (0, _react.useState)(testOnly_pressed ?? false);
  const longPressTimeoutRef = (0, _react.useRef)(null);
  const pressDelayTimeoutRef = (0, _react.useRef)(null);
  const isOnPressAllowed = (0, _react.useRef)(true);
  const isCurrentlyPressed = (0, _react.useRef)(false);
  const dimensions = (0, _react.useRef)({
    width: 0,
    height: 0
  });
  const normalizedHitSlop = (0, _react.useMemo)(() => typeof hitSlop === 'number' ? (0, _utils.numberAsInset)(hitSlop) : hitSlop ?? {}, [hitSlop]);
  const normalizedPressRetentionOffset = (0, _react.useMemo)(() => typeof pressRetentionOffset === 'number' ? (0, _utils.numberAsInset)(pressRetentionOffset) : pressRetentionOffset ?? {}, [pressRetentionOffset]);
  const appliedHitSlop = (0, _utils.addInsets)(normalizedHitSlop, normalizedPressRetentionOffset);
  const cancelLongPress = (0, _react.useCallback)(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
      isOnPressAllowed.current = true;
    }
  }, []);
  const cancelDelayedPress = (0, _react.useCallback)(() => {
    if (pressDelayTimeoutRef.current) {
      clearTimeout(pressDelayTimeoutRef.current);
      pressDelayTimeoutRef.current = null;
    }
  }, []);
  const startLongPress = (0, _react.useCallback)(event => {
    if (onLongPress) {
      cancelLongPress();
      longPressTimeoutRef.current = setTimeout(() => {
        isOnPressAllowed.current = false;
        onLongPress(event);
      }, delayLongPress ?? DEFAULT_LONG_PRESS_DURATION);
    }
  }, [onLongPress, cancelLongPress, delayLongPress]);
  const innerHandlePressIn = (0, _react.useCallback)(event => {
    onPressIn?.(event);
    startLongPress(event);
    setPressedState(true);
    if (pressDelayTimeoutRef.current) {
      clearTimeout(pressDelayTimeoutRef.current);
      pressDelayTimeoutRef.current = null;
    }
  }, [onPressIn, startLongPress]);
  const handleFinalize = (0, _react.useCallback)(() => {
    isCurrentlyPressed.current = false;
    cancelLongPress();
    cancelDelayedPress();
    setPressedState(false);
  }, [cancelDelayedPress, cancelLongPress]);
  const handlePressIn = (0, _react.useCallback)(event => {
    if (!(0, _utils.isTouchWithinInset)(dimensions.current, normalizedHitSlop, event.nativeEvent.changedTouches.at(-1))) {
      // Ignoring pressIn within pressRetentionOffset
      return;
    }
    isCurrentlyPressed.current = true;
    if (unstable_pressDelay) {
      pressDelayTimeoutRef.current = setTimeout(() => {
        innerHandlePressIn(event);
      }, unstable_pressDelay);
    } else {
      innerHandlePressIn(event);
    }
  }, [innerHandlePressIn, normalizedHitSlop, unstable_pressDelay]);
  const handlePressOut = (0, _react.useCallback)((event, success = true) => {
    if (!isCurrentlyPressed.current) {
      // Some prop configurations may lead to handlePressOut being called mutliple times.
      return;
    }
    isCurrentlyPressed.current = false;
    if (pressDelayTimeoutRef.current) {
      innerHandlePressIn(event);
    }
    onPressOut?.(event);
    if (isOnPressAllowed.current && success) {
      onPress?.(event);
    }
    handleFinalize();
  }, [handleFinalize, innerHandlePressIn, onPress, onPressOut]);
  const stateMachine = (0, _react.useMemo)(() => new _StateMachine.PressableStateMachine(), []);
  (0, _react.useEffect)(() => {
    const configuration = (0, _stateDefinitions.getStatesConfig)(handlePressIn, handlePressOut);
    stateMachine.setStates(configuration);
  }, [handlePressIn, handlePressOut, stateMachine]);
  const hoverInTimeout = (0, _react.useRef)(null);
  const hoverOutTimeout = (0, _react.useRef)(null);
  const hoverGesture = (0, _react.useMemo)(() => _gestureObjects.GestureObjects.Hover().manualActivation(true) // Prevents Hover blocking Gesture.Native() on web
  .cancelsTouchesInView(false).onBegin(event => {
    if (hoverOutTimeout.current) {
      clearTimeout(hoverOutTimeout.current);
    }
    if (delayHoverIn) {
      hoverInTimeout.current = setTimeout(() => onHoverIn?.((0, _utils.gestureToPressableEvent)(event)), delayHoverIn);
      return;
    }
    onHoverIn?.((0, _utils.gestureToPressableEvent)(event));
  }).onFinalize(event => {
    if (hoverInTimeout.current) {
      clearTimeout(hoverInTimeout.current);
    }
    if (delayHoverOut) {
      hoverOutTimeout.current = setTimeout(() => onHoverOut?.((0, _utils.gestureToPressableEvent)(event)), delayHoverOut);
      return;
    }
    onHoverOut?.((0, _utils.gestureToPressableEvent)(event));
  }), [delayHoverIn, delayHoverOut, onHoverIn, onHoverOut]);
  const pressAndTouchGesture = (0, _react.useMemo)(() => _gestureObjects.GestureObjects.LongPress().minDuration(_utils2.INT32_MAX) // Stops long press from blocking Gesture.Native()
  .maxDistance(_utils2.INT32_MAX) // Stops long press from cancelling on touch move
  .cancelsTouchesInView(false).onTouchesDown(event => {
    const pressableEvent = (0, _utils.gestureTouchToPressableEvent)(event);
    stateMachine.handleEvent(_stateDefinitions.StateMachineEvent.LONG_PRESS_TOUCHES_DOWN, pressableEvent);
  }).onTouchesUp(() => {
    if (_reactNative.Platform.OS === 'android') {
      // Prevents potential soft-locks
      stateMachine.reset();
      handleFinalize();
    }
  }).onTouchesCancelled(event => {
    const pressableEvent = (0, _utils.gestureTouchToPressableEvent)(event);
    stateMachine.reset();
    handlePressOut(pressableEvent, false);
  }).onFinalize(() => {
    if (_reactNative.Platform.OS === 'web') {
      stateMachine.handleEvent(_stateDefinitions.StateMachineEvent.FINALIZE);
      handleFinalize();
    }
  }), [stateMachine, handleFinalize, handlePressOut]);

  // RNButton is placed inside ButtonGesture to enable Android's ripple and to capture non-propagating events
  const buttonGesture = (0, _react.useMemo)(() => _gestureObjects.GestureObjects.Native().onTouchesCancelled(event => {
    if (_reactNative.Platform.OS !== 'macos' && _reactNative.Platform.OS !== 'web') {
      // On MacOS cancel occurs in middle of gesture
      // On Web cancel occurs on mouse move, which is unwanted
      const pressableEvent = (0, _utils.gestureTouchToPressableEvent)(event);
      stateMachine.reset();
      handlePressOut(pressableEvent, false);
    }
  }).onBegin(() => {
    stateMachine.handleEvent(_stateDefinitions.StateMachineEvent.NATIVE_BEGIN);
  }).onStart(() => {
    if (_reactNative.Platform.OS !== 'android') {
      // Gesture.Native().onStart() is broken with Android + hitSlop
      stateMachine.handleEvent(_stateDefinitions.StateMachineEvent.NATIVE_START);
    }
  }).onFinalize(() => {
    if (_reactNative.Platform.OS !== 'web') {
      // On Web we use LongPress().onFinalize() instead of Native().onFinalize(),
      // as Native cancels on mouse move, and LongPress does not.
      stateMachine.handleEvent(_stateDefinitions.StateMachineEvent.FINALIZE);
      handleFinalize();
    }
  }), [stateMachine, handlePressOut, handleFinalize]);
  const isPressableEnabled = disabled !== true;
  const gestures = [buttonGesture, pressAndTouchGesture, hoverGesture];
  for (const gesture of gestures) {
    gesture.enabled(isPressableEnabled);
    gesture.runOnJS(true);
    gesture.hitSlop(appliedHitSlop);
    gesture.shouldCancelWhenOutside(_reactNative.Platform.OS !== 'web');
    Object.entries(relationProps).forEach(([relationName, relation]) => {
      (0, _utils3.applyRelationProp)(gesture, relationName, relation);
    });
  }
  const gesture = _gestureObjects.GestureObjects.Simultaneous(...gestures);

  // `cursor: 'pointer'` on `RNButton` crashes iOS
  const pointerStyle = _reactNative.Platform.OS === 'web' ? {
    cursor: 'pointer'
  } : {};
  const styleProp = typeof style === 'function' ? style({
    pressed: pressedState
  }) : style;
  const childrenProp = typeof children === 'function' ? children({
    pressed: pressedState
  }) : children;
  const rippleColor = (0, _react.useMemo)(() => {
    if (IS_FABRIC === null) {
      IS_FABRIC = (0, _utils2.isFabric)();
    }
    const defaultRippleColor = android_ripple ? undefined : 'transparent';
    const unprocessedRippleColor = android_ripple?.color ?? defaultRippleColor;
    return IS_FABRIC ? unprocessedRippleColor : (0, _reactNative.processColor)(unprocessedRippleColor);
  }, [android_ripple]);
  const setDimensions = (0, _react.useCallback)(event => {
    onLayout?.(event);
    dimensions.current = event.nativeEvent.layout;
  }, [onLayout]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_GestureDetector.GestureDetector, {
    gesture: gesture,
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)(_GestureHandlerButton.default, {
      ...remainingProps,
      onLayout: setDimensions,
      accessible: accessible !== false,
      hitSlop: appliedHitSlop,
      enabled: isPressableEnabled,
      touchSoundDisabled: android_disableSound ?? undefined,
      rippleColor: rippleColor,
      rippleRadius: android_ripple?.radius ?? undefined,
      style: [pointerStyle, styleProp],
      testOnly_onPress: IS_TEST_ENV ? onPress : undefined,
      testOnly_onPressIn: IS_TEST_ENV ? onPressIn : undefined,
      testOnly_onPressOut: IS_TEST_ENV ? onPressOut : undefined,
      testOnly_onLongPress: IS_TEST_ENV ? onLongPress : undefined,
      children: [childrenProp, __DEV__ ? /*#__PURE__*/(0, _jsxRuntime.jsx)(_PressabilityDebugView.PressabilityDebugView, {
        color: "red",
        hitSlop: normalizedHitSlop
      }) : null]
    })
  });
};
var _default = exports.default = Pressable;
//# sourceMappingURL=Pressable.js.map