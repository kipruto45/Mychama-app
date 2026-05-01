"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = require("react");
var _reactNative = require("react-native");
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
var _ = require(".");
var _2 = require("../..");
var _GestureDetector = require("../../handlers/gestures/GestureDetector");
var _utils = require("../utils");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const DRAG_TOSS = 0.05;
const DEFAULT_FRICTION = 1;
const DEFAULT_OVERSHOOT_FRICTION = 1;
const DEFAULT_DRAG_OFFSET = 10;
const DEFAULT_ENABLE_TRACKING_TWO_FINGER_GESTURE = false;
const Swipeable = props => {
  const {
    ref,
    leftThreshold,
    rightThreshold,
    enabled,
    containerStyle,
    childrenContainerStyle,
    animationOptions,
    overshootLeft,
    overshootRight,
    testID,
    children,
    enableTrackpadTwoFingerGesture = DEFAULT_ENABLE_TRACKING_TWO_FINGER_GESTURE,
    dragOffsetFromLeftEdge = DEFAULT_DRAG_OFFSET,
    dragOffsetFromRightEdge = DEFAULT_DRAG_OFFSET,
    friction = DEFAULT_FRICTION,
    overshootFriction = DEFAULT_OVERSHOOT_FRICTION,
    onSwipeableOpenStartDrag,
    onSwipeableCloseStartDrag,
    onSwipeableWillOpen,
    onSwipeableWillClose,
    onSwipeableOpen,
    onSwipeableClose,
    renderLeftActions,
    renderRightActions,
    simultaneousWithExternalGesture,
    requireExternalGestureToFail,
    blocksExternalGesture,
    hitSlop,
    ...remainingProps
  } = props;
  const relationProps = (0, _react.useMemo)(() => ({
    simultaneousWithExternalGesture,
    requireExternalGestureToFail,
    blocksExternalGesture
  }), [blocksExternalGesture, requireExternalGestureToFail, simultaneousWithExternalGesture]);
  const rowState = (0, _reactNativeReanimated.useSharedValue)(0);
  const userDrag = (0, _reactNativeReanimated.useSharedValue)(0);
  const appliedTranslation = (0, _reactNativeReanimated.useSharedValue)(0);
  const rowWidth = (0, _reactNativeReanimated.useSharedValue)(0);
  const leftWidth = (0, _reactNativeReanimated.useSharedValue)(0);
  const rightWidth = (0, _reactNativeReanimated.useSharedValue)(0);
  const showLeftProgress = (0, _reactNativeReanimated.useSharedValue)(0);
  const showRightProgress = (0, _reactNativeReanimated.useSharedValue)(0);
  const updateAnimatedEvent = (0, _react.useCallback)(() => {
    'worklet';

    const shouldOvershootLeft = overshootLeft ?? leftWidth.value > 0;
    const shouldOvershootRight = overshootRight ?? rightWidth.value > 0;
    const startOffset = rowState.value === 1 ? leftWidth.value : rowState.value === -1 ? -rightWidth.value : 0;
    const offsetDrag = userDrag.value / friction + startOffset;
    appliedTranslation.value = (0, _reactNativeReanimated.interpolate)(offsetDrag, [-rightWidth.value - 1, -rightWidth.value, leftWidth.value, leftWidth.value + 1], [-rightWidth.value - (shouldOvershootRight ? 1 / overshootFriction : 0), -rightWidth.value, leftWidth.value, leftWidth.value + (shouldOvershootLeft ? 1 / overshootFriction : 0)]);
    showLeftProgress.value = leftWidth.value > 0 ? (0, _reactNativeReanimated.interpolate)(appliedTranslation.value, [-1, 0, leftWidth.value], [0, 0, 1]) : 0;
    showRightProgress.value = rightWidth.value > 0 ? (0, _reactNativeReanimated.interpolate)(appliedTranslation.value, [-rightWidth.value, 0, 1], [1, 0, 0]) : 0;
  }, [appliedTranslation, friction, leftWidth, overshootFriction, rightWidth, rowState, showLeftProgress, showRightProgress, userDrag, overshootLeft, overshootRight]);
  const dispatchImmediateEvents = (0, _react.useCallback)((fromValue, toValue) => {
    'worklet';

    if (onSwipeableWillOpen && toValue !== 0) {
      (0, _reactNativeReanimated.runOnJS)(onSwipeableWillOpen)(toValue > 0 ? _.SwipeDirection.RIGHT : _.SwipeDirection.LEFT);
    }
    if (onSwipeableWillClose && toValue === 0) {
      (0, _reactNativeReanimated.runOnJS)(onSwipeableWillClose)(fromValue > 0 ? _.SwipeDirection.LEFT : _.SwipeDirection.RIGHT);
    }
  }, [onSwipeableWillClose, onSwipeableWillOpen]);
  const dispatchEndEvents = (0, _react.useCallback)((fromValue, toValue) => {
    'worklet';

    if (onSwipeableOpen && toValue !== 0) {
      (0, _reactNativeReanimated.runOnJS)(onSwipeableOpen)(toValue > 0 ? _.SwipeDirection.RIGHT : _.SwipeDirection.LEFT);
    }
    if (onSwipeableClose && toValue === 0) {
      (0, _reactNativeReanimated.runOnJS)(onSwipeableClose)(fromValue > 0 ? _.SwipeDirection.LEFT : _.SwipeDirection.RIGHT);
    }
  }, [onSwipeableClose, onSwipeableOpen]);
  const animateRow = (0, _react.useCallback)((toValue, velocityX) => {
    'worklet';

    const translationSpringConfig = {
      mass: 2,
      damping: 1000,
      stiffness: 700,
      velocity: velocityX,
      overshootClamping: true,
      reduceMotion: _reactNativeReanimated.ReduceMotion.System,
      ...animationOptions
    };
    const isClosing = toValue === 0;
    const moveToRight = isClosing ? rowState.value < 0 : toValue > 0;
    const usedWidth = isClosing ? moveToRight ? rightWidth.value : leftWidth.value : moveToRight ? leftWidth.value : rightWidth.value;
    const progressSpringConfig = {
      ...translationSpringConfig,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
      velocity: velocityX && (0, _reactNativeReanimated.interpolate)(velocityX, [-usedWidth, usedWidth], [-1, 1])
    };
    const frozenRowState = rowState.value;
    appliedTranslation.value = (0, _reactNativeReanimated.withSpring)(toValue, translationSpringConfig, isFinished => {
      if (isFinished) {
        dispatchEndEvents(frozenRowState, toValue);
      }
    });
    const progressTarget = toValue === 0 ? 0 : 1 * Math.sign(toValue);
    showLeftProgress.value = (0, _reactNativeReanimated.withSpring)(Math.max(progressTarget, 0), progressSpringConfig);
    showRightProgress.value = (0, _reactNativeReanimated.withSpring)(Math.max(-progressTarget, 0), progressSpringConfig);
    dispatchImmediateEvents(frozenRowState, toValue);
    rowState.value = Math.sign(toValue);
  }, [rowState, animationOptions, appliedTranslation, showLeftProgress, leftWidth, showRightProgress, rightWidth, dispatchImmediateEvents, dispatchEndEvents]);
  const leftLayoutRef = (0, _reactNativeReanimated.useAnimatedRef)();
  const leftWrapperLayoutRef = (0, _reactNativeReanimated.useAnimatedRef)();
  const rightLayoutRef = (0, _reactNativeReanimated.useAnimatedRef)();
  const updateElementWidths = (0, _react.useCallback)(() => {
    'worklet';

    const leftLayout = (0, _reactNativeReanimated.measure)(leftLayoutRef);
    const leftWrapperLayout = (0, _reactNativeReanimated.measure)(leftWrapperLayoutRef);
    const rightLayout = (0, _reactNativeReanimated.measure)(rightLayoutRef);
    leftWidth.value = (leftLayout?.pageX ?? 0) - (leftWrapperLayout?.pageX ?? 0);
    rightWidth.value = rowWidth.value - (rightLayout?.pageX ?? rowWidth.value) + (leftWrapperLayout?.pageX ?? 0);
  }, [leftLayoutRef, leftWrapperLayoutRef, rightLayoutRef, leftWidth, rightWidth, rowWidth]);
  const swipeableMethods = (0, _react.useMemo)(() => ({
    close() {
      'worklet';

      if (_WORKLET) {
        animateRow(0);
        return;
      }
      (0, _reactNativeReanimated.runOnUI)(() => {
        animateRow(0);
      })();
    },
    openLeft() {
      'worklet';

      if (_WORKLET) {
        updateElementWidths();
        animateRow(leftWidth.value);
        return;
      }
      (0, _reactNativeReanimated.runOnUI)(() => {
        updateElementWidths();
        animateRow(leftWidth.value);
      })();
    },
    openRight() {
      'worklet';

      if (_WORKLET) {
        updateElementWidths();
        animateRow(-rightWidth.value);
        return;
      }
      (0, _reactNativeReanimated.runOnUI)(() => {
        updateElementWidths();
        animateRow(-rightWidth.value);
      })();
    },
    reset() {
      'worklet';

      userDrag.value = 0;
      showLeftProgress.value = 0;
      appliedTranslation.value = 0;
      rowState.value = 0;
    }
  }), [animateRow, updateElementWidths, leftWidth, rightWidth, userDrag, showLeftProgress, appliedTranslation, rowState]);
  const onRowLayout = (0, _react.useCallback)(({
    nativeEvent
  }) => {
    rowWidth.value = nativeEvent.layout.width;
  }, [rowWidth]);

  // As stated in `Dimensions.get` docstring, this function should be called on every render
  // since dimensions may change (e.g. orientation change)

  const leftActionAnimation = (0, _reactNativeReanimated.useAnimatedStyle)(() => {
    return {
      opacity: showLeftProgress.value === 0 ? 0 : 1
    };
  });
  const leftElement = (0, _react.useCallback)(() => /*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNativeReanimated.default.View, {
    ref: leftWrapperLayoutRef,
    style: [styles.leftActions, leftActionAnimation],
    children: [renderLeftActions?.(showLeftProgress, appliedTranslation, swipeableMethods), /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativeReanimated.default.View, {
      ref: leftLayoutRef
    })]
  }), [appliedTranslation, leftActionAnimation, leftLayoutRef, leftWrapperLayoutRef, renderLeftActions, showLeftProgress, swipeableMethods]);
  const rightActionAnimation = (0, _reactNativeReanimated.useAnimatedStyle)(() => {
    return {
      opacity: showRightProgress.value === 0 ? 0 : 1
    };
  });
  const rightElement = (0, _react.useCallback)(() => /*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNativeReanimated.default.View, {
    style: [styles.rightActions, rightActionAnimation],
    children: [renderRightActions?.(showRightProgress, appliedTranslation, swipeableMethods), /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativeReanimated.default.View, {
      ref: rightLayoutRef
    })]
  }), [appliedTranslation, renderRightActions, rightActionAnimation, rightLayoutRef, showRightProgress, swipeableMethods]);
  const handleRelease = (0, _react.useCallback)(event => {
    'worklet';

    const {
      velocityX
    } = event;
    userDrag.value = event.translationX;
    const leftThresholdProp = leftThreshold ?? leftWidth.value / 2;
    const rightThresholdProp = rightThreshold ?? rightWidth.value / 2;
    const translationX = (userDrag.value + DRAG_TOSS * velocityX) / friction;
    let toValue = 0;
    if (rowState.value === 0) {
      if (translationX > leftThresholdProp) {
        toValue = leftWidth.value;
      } else if (translationX < -rightThresholdProp) {
        toValue = -rightWidth.value;
      }
    } else if (rowState.value === 1) {
      // Swiped to left
      if (translationX > -leftThresholdProp) {
        toValue = leftWidth.value;
      }
    } else {
      // Swiped to right
      if (translationX < rightThresholdProp) {
        toValue = -rightWidth.value;
      }
    }
    animateRow(toValue, velocityX / friction);
  }, [animateRow, friction, leftThreshold, leftWidth, rightThreshold, rightWidth, rowState, userDrag]);
  const close = (0, _react.useCallback)(() => {
    'worklet';

    animateRow(0);
  }, [animateRow]);
  const dragStarted = (0, _reactNativeReanimated.useSharedValue)(false);
  const tapGesture = (0, _react.useMemo)(() => {
    const tap = _2.Gesture.Tap().shouldCancelWhenOutside(true).onStart(() => {
      if (rowState.value !== 0) {
        close();
      }
    });
    Object.entries(relationProps).forEach(([relationName, relation]) => {
      (0, _utils.applyRelationProp)(tap, relationName, relation);
    });
    return tap;
  }, [close, relationProps, rowState]);
  const panGesture = (0, _react.useMemo)(() => {
    const pan = _2.Gesture.Pan().enabled(enabled !== false).enableTrackpadTwoFingerGesture(enableTrackpadTwoFingerGesture).activeOffsetX([-dragOffsetFromRightEdge, dragOffsetFromLeftEdge]).onStart(updateElementWidths).onUpdate(event => {
      userDrag.value = event.translationX;
      const direction = rowState.value === -1 ? _.SwipeDirection.RIGHT : rowState.value === 1 ? _.SwipeDirection.LEFT : event.translationX > 0 ? _.SwipeDirection.RIGHT : _.SwipeDirection.LEFT;
      if (!dragStarted.value) {
        dragStarted.value = true;
        if (rowState.value === 0 && onSwipeableOpenStartDrag) {
          (0, _reactNativeReanimated.runOnJS)(onSwipeableOpenStartDrag)(direction);
        } else if (onSwipeableCloseStartDrag) {
          (0, _reactNativeReanimated.runOnJS)(onSwipeableCloseStartDrag)(direction);
        }
      }
      updateAnimatedEvent();
    }).onEnd(event => {
      handleRelease(event);
    }).onFinalize(() => {
      dragStarted.value = false;
    });
    Object.entries(relationProps).forEach(([relationName, relation]) => {
      (0, _utils.applyRelationProp)(pan, relationName, relation);
    });
    return pan;
  }, [enabled, enableTrackpadTwoFingerGesture, dragOffsetFromRightEdge, dragOffsetFromLeftEdge, updateElementWidths, relationProps, userDrag, rowState, dragStarted, updateAnimatedEvent, onSwipeableOpenStartDrag, onSwipeableCloseStartDrag, handleRelease]);
  (0, _react.useImperativeHandle)(ref, () => swipeableMethods, [swipeableMethods]);
  const animatedStyle = (0, _reactNativeReanimated.useAnimatedStyle)(() => ({
    transform: [{
      translateX: appliedTranslation.value
    }],
    pointerEvents: rowState.value === 0 ? 'auto' : 'box-only'
  }), [appliedTranslation, rowState]);
  const swipeableComponent = /*#__PURE__*/(0, _jsxRuntime.jsx)(_GestureDetector.GestureDetector, {
    gesture: panGesture,
    touchAction: "pan-y",
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNativeReanimated.default.View, {
      ...remainingProps,
      onLayout: onRowLayout,
      hitSlop: hitSlop ?? undefined,
      style: [styles.container, containerStyle],
      children: [leftElement(), rightElement(), /*#__PURE__*/(0, _jsxRuntime.jsx)(_GestureDetector.GestureDetector, {
        gesture: tapGesture,
        touchAction: "pan-y",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativeReanimated.default.View, {
          style: [animatedStyle, childrenContainerStyle],
          children: children
        })
      })]
    })
  });
  return testID ? /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
    testID: testID,
    children: swipeableComponent
  }) : swipeableComponent;
};
var _default = exports.default = Swipeable;
const styles = _reactNative.StyleSheet.create({
  container: {
    overflow: 'hidden'
  },
  leftActions: {
    ..._reactNative.StyleSheet.absoluteFillObject,
    flexDirection: _reactNative.I18nManager.isRTL ? 'row-reverse' : 'row',
    overflow: 'hidden'
  },
  rightActions: {
    ..._reactNative.StyleSheet.absoluteFillObject,
    flexDirection: _reactNative.I18nManager.isRTL ? 'row' : 'row-reverse',
    overflow: 'hidden'
  }
});
//# sourceMappingURL=ReanimatedSwipeable.js.map