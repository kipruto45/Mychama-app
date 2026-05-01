"use strict";

import { useMemo, useCallback, useImperativeHandle } from 'react';
import { View, I18nManager, StyleSheet } from 'react-native';
import Animated, { useSharedValue, interpolate, runOnJS, ReduceMotion, withSpring, useAnimatedRef, measure, runOnUI, useAnimatedStyle } from 'react-native-reanimated';
import { SwipeDirection } from '.';
import { Gesture } from '../..';
import { GestureDetector } from '../../handlers/gestures/GestureDetector';
import { applyRelationProp } from '../utils';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
  const relationProps = useMemo(() => ({
    simultaneousWithExternalGesture,
    requireExternalGestureToFail,
    blocksExternalGesture
  }), [blocksExternalGesture, requireExternalGestureToFail, simultaneousWithExternalGesture]);
  const rowState = useSharedValue(0);
  const userDrag = useSharedValue(0);
  const appliedTranslation = useSharedValue(0);
  const rowWidth = useSharedValue(0);
  const leftWidth = useSharedValue(0);
  const rightWidth = useSharedValue(0);
  const showLeftProgress = useSharedValue(0);
  const showRightProgress = useSharedValue(0);
  const updateAnimatedEvent = useCallback(() => {
    'worklet';

    const shouldOvershootLeft = overshootLeft ?? leftWidth.value > 0;
    const shouldOvershootRight = overshootRight ?? rightWidth.value > 0;
    const startOffset = rowState.value === 1 ? leftWidth.value : rowState.value === -1 ? -rightWidth.value : 0;
    const offsetDrag = userDrag.value / friction + startOffset;
    appliedTranslation.value = interpolate(offsetDrag, [-rightWidth.value - 1, -rightWidth.value, leftWidth.value, leftWidth.value + 1], [-rightWidth.value - (shouldOvershootRight ? 1 / overshootFriction : 0), -rightWidth.value, leftWidth.value, leftWidth.value + (shouldOvershootLeft ? 1 / overshootFriction : 0)]);
    showLeftProgress.value = leftWidth.value > 0 ? interpolate(appliedTranslation.value, [-1, 0, leftWidth.value], [0, 0, 1]) : 0;
    showRightProgress.value = rightWidth.value > 0 ? interpolate(appliedTranslation.value, [-rightWidth.value, 0, 1], [1, 0, 0]) : 0;
  }, [appliedTranslation, friction, leftWidth, overshootFriction, rightWidth, rowState, showLeftProgress, showRightProgress, userDrag, overshootLeft, overshootRight]);
  const dispatchImmediateEvents = useCallback((fromValue, toValue) => {
    'worklet';

    if (onSwipeableWillOpen && toValue !== 0) {
      runOnJS(onSwipeableWillOpen)(toValue > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT);
    }
    if (onSwipeableWillClose && toValue === 0) {
      runOnJS(onSwipeableWillClose)(fromValue > 0 ? SwipeDirection.LEFT : SwipeDirection.RIGHT);
    }
  }, [onSwipeableWillClose, onSwipeableWillOpen]);
  const dispatchEndEvents = useCallback((fromValue, toValue) => {
    'worklet';

    if (onSwipeableOpen && toValue !== 0) {
      runOnJS(onSwipeableOpen)(toValue > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT);
    }
    if (onSwipeableClose && toValue === 0) {
      runOnJS(onSwipeableClose)(fromValue > 0 ? SwipeDirection.LEFT : SwipeDirection.RIGHT);
    }
  }, [onSwipeableClose, onSwipeableOpen]);
  const animateRow = useCallback((toValue, velocityX) => {
    'worklet';

    const translationSpringConfig = {
      mass: 2,
      damping: 1000,
      stiffness: 700,
      velocity: velocityX,
      overshootClamping: true,
      reduceMotion: ReduceMotion.System,
      ...animationOptions
    };
    const isClosing = toValue === 0;
    const moveToRight = isClosing ? rowState.value < 0 : toValue > 0;
    const usedWidth = isClosing ? moveToRight ? rightWidth.value : leftWidth.value : moveToRight ? leftWidth.value : rightWidth.value;
    const progressSpringConfig = {
      ...translationSpringConfig,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
      velocity: velocityX && interpolate(velocityX, [-usedWidth, usedWidth], [-1, 1])
    };
    const frozenRowState = rowState.value;
    appliedTranslation.value = withSpring(toValue, translationSpringConfig, isFinished => {
      if (isFinished) {
        dispatchEndEvents(frozenRowState, toValue);
      }
    });
    const progressTarget = toValue === 0 ? 0 : 1 * Math.sign(toValue);
    showLeftProgress.value = withSpring(Math.max(progressTarget, 0), progressSpringConfig);
    showRightProgress.value = withSpring(Math.max(-progressTarget, 0), progressSpringConfig);
    dispatchImmediateEvents(frozenRowState, toValue);
    rowState.value = Math.sign(toValue);
  }, [rowState, animationOptions, appliedTranslation, showLeftProgress, leftWidth, showRightProgress, rightWidth, dispatchImmediateEvents, dispatchEndEvents]);
  const leftLayoutRef = useAnimatedRef();
  const leftWrapperLayoutRef = useAnimatedRef();
  const rightLayoutRef = useAnimatedRef();
  const updateElementWidths = useCallback(() => {
    'worklet';

    const leftLayout = measure(leftLayoutRef);
    const leftWrapperLayout = measure(leftWrapperLayoutRef);
    const rightLayout = measure(rightLayoutRef);
    leftWidth.value = (leftLayout?.pageX ?? 0) - (leftWrapperLayout?.pageX ?? 0);
    rightWidth.value = rowWidth.value - (rightLayout?.pageX ?? rowWidth.value) + (leftWrapperLayout?.pageX ?? 0);
  }, [leftLayoutRef, leftWrapperLayoutRef, rightLayoutRef, leftWidth, rightWidth, rowWidth]);
  const swipeableMethods = useMemo(() => ({
    close() {
      'worklet';

      if (_WORKLET) {
        animateRow(0);
        return;
      }
      runOnUI(() => {
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
      runOnUI(() => {
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
      runOnUI(() => {
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
  const onRowLayout = useCallback(({
    nativeEvent
  }) => {
    rowWidth.value = nativeEvent.layout.width;
  }, [rowWidth]);

  // As stated in `Dimensions.get` docstring, this function should be called on every render
  // since dimensions may change (e.g. orientation change)

  const leftActionAnimation = useAnimatedStyle(() => {
    return {
      opacity: showLeftProgress.value === 0 ? 0 : 1
    };
  });
  const leftElement = useCallback(() => /*#__PURE__*/_jsxs(Animated.View, {
    ref: leftWrapperLayoutRef,
    style: [styles.leftActions, leftActionAnimation],
    children: [renderLeftActions?.(showLeftProgress, appliedTranslation, swipeableMethods), /*#__PURE__*/_jsx(Animated.View, {
      ref: leftLayoutRef
    })]
  }), [appliedTranslation, leftActionAnimation, leftLayoutRef, leftWrapperLayoutRef, renderLeftActions, showLeftProgress, swipeableMethods]);
  const rightActionAnimation = useAnimatedStyle(() => {
    return {
      opacity: showRightProgress.value === 0 ? 0 : 1
    };
  });
  const rightElement = useCallback(() => /*#__PURE__*/_jsxs(Animated.View, {
    style: [styles.rightActions, rightActionAnimation],
    children: [renderRightActions?.(showRightProgress, appliedTranslation, swipeableMethods), /*#__PURE__*/_jsx(Animated.View, {
      ref: rightLayoutRef
    })]
  }), [appliedTranslation, renderRightActions, rightActionAnimation, rightLayoutRef, showRightProgress, swipeableMethods]);
  const handleRelease = useCallback(event => {
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
  const close = useCallback(() => {
    'worklet';

    animateRow(0);
  }, [animateRow]);
  const dragStarted = useSharedValue(false);
  const tapGesture = useMemo(() => {
    const tap = Gesture.Tap().shouldCancelWhenOutside(true).onStart(() => {
      if (rowState.value !== 0) {
        close();
      }
    });
    Object.entries(relationProps).forEach(([relationName, relation]) => {
      applyRelationProp(tap, relationName, relation);
    });
    return tap;
  }, [close, relationProps, rowState]);
  const panGesture = useMemo(() => {
    const pan = Gesture.Pan().enabled(enabled !== false).enableTrackpadTwoFingerGesture(enableTrackpadTwoFingerGesture).activeOffsetX([-dragOffsetFromRightEdge, dragOffsetFromLeftEdge]).onStart(updateElementWidths).onUpdate(event => {
      userDrag.value = event.translationX;
      const direction = rowState.value === -1 ? SwipeDirection.RIGHT : rowState.value === 1 ? SwipeDirection.LEFT : event.translationX > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
      if (!dragStarted.value) {
        dragStarted.value = true;
        if (rowState.value === 0 && onSwipeableOpenStartDrag) {
          runOnJS(onSwipeableOpenStartDrag)(direction);
        } else if (onSwipeableCloseStartDrag) {
          runOnJS(onSwipeableCloseStartDrag)(direction);
        }
      }
      updateAnimatedEvent();
    }).onEnd(event => {
      handleRelease(event);
    }).onFinalize(() => {
      dragStarted.value = false;
    });
    Object.entries(relationProps).forEach(([relationName, relation]) => {
      applyRelationProp(pan, relationName, relation);
    });
    return pan;
  }, [enabled, enableTrackpadTwoFingerGesture, dragOffsetFromRightEdge, dragOffsetFromLeftEdge, updateElementWidths, relationProps, userDrag, rowState, dragStarted, updateAnimatedEvent, onSwipeableOpenStartDrag, onSwipeableCloseStartDrag, handleRelease]);
  useImperativeHandle(ref, () => swipeableMethods, [swipeableMethods]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: appliedTranslation.value
    }],
    pointerEvents: rowState.value === 0 ? 'auto' : 'box-only'
  }), [appliedTranslation, rowState]);
  const swipeableComponent = /*#__PURE__*/_jsx(GestureDetector, {
    gesture: panGesture,
    touchAction: "pan-y",
    children: /*#__PURE__*/_jsxs(Animated.View, {
      ...remainingProps,
      onLayout: onRowLayout,
      hitSlop: hitSlop ?? undefined,
      style: [styles.container, containerStyle],
      children: [leftElement(), rightElement(), /*#__PURE__*/_jsx(GestureDetector, {
        gesture: tapGesture,
        touchAction: "pan-y",
        children: /*#__PURE__*/_jsx(Animated.View, {
          style: [animatedStyle, childrenContainerStyle],
          children: children
        })
      })]
    })
  });
  return testID ? /*#__PURE__*/_jsx(View, {
    testID: testID,
    children: swipeableComponent
  }) : swipeableComponent;
};
export default Swipeable;
const styles = StyleSheet.create({
  container: {
    overflow: 'hidden'
  },
  leftActions: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    overflow: 'hidden'
  },
  rightActions: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    overflow: 'hidden'
  }
});
//# sourceMappingURL=ReanimatedSwipeable.js.map