"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.DrawerType = exports.DrawerState = exports.DrawerPosition = exports.DrawerLockMode = exports.DrawerKeyboardDismissMode = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
var _gestureObjects = require("../handlers/gestures/gestureObjects");
var _GestureDetector = require("../handlers/gestures/GestureDetector");
var _gestureHandlerCommon = require("../handlers/gestureHandlerCommon");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
// This component is based on RN's DrawerLayoutAndroid API
// It's cross-compatible with all platforms despite
// `DrawerLayoutAndroid` only being available on android

const DRAG_TOSS = 0.05;
let DrawerPosition = exports.DrawerPosition = /*#__PURE__*/function (DrawerPosition) {
  DrawerPosition[DrawerPosition["LEFT"] = 0] = "LEFT";
  DrawerPosition[DrawerPosition["RIGHT"] = 1] = "RIGHT";
  return DrawerPosition;
}({});
let DrawerState = exports.DrawerState = /*#__PURE__*/function (DrawerState) {
  DrawerState[DrawerState["IDLE"] = 0] = "IDLE";
  DrawerState[DrawerState["DRAGGING"] = 1] = "DRAGGING";
  DrawerState[DrawerState["SETTLING"] = 2] = "SETTLING";
  return DrawerState;
}({});
let DrawerType = exports.DrawerType = /*#__PURE__*/function (DrawerType) {
  DrawerType[DrawerType["FRONT"] = 0] = "FRONT";
  DrawerType[DrawerType["BACK"] = 1] = "BACK";
  DrawerType[DrawerType["SLIDE"] = 2] = "SLIDE";
  return DrawerType;
}({});
let DrawerLockMode = exports.DrawerLockMode = /*#__PURE__*/function (DrawerLockMode) {
  DrawerLockMode[DrawerLockMode["UNLOCKED"] = 0] = "UNLOCKED";
  DrawerLockMode[DrawerLockMode["LOCKED_CLOSED"] = 1] = "LOCKED_CLOSED";
  DrawerLockMode[DrawerLockMode["LOCKED_OPEN"] = 2] = "LOCKED_OPEN";
  return DrawerLockMode;
}({});
let DrawerKeyboardDismissMode = exports.DrawerKeyboardDismissMode = /*#__PURE__*/function (DrawerKeyboardDismissMode) {
  DrawerKeyboardDismissMode[DrawerKeyboardDismissMode["NONE"] = 0] = "NONE";
  DrawerKeyboardDismissMode[DrawerKeyboardDismissMode["ON_DRAG"] = 1] = "ON_DRAG";
  return DrawerKeyboardDismissMode;
}({});
const defaultProps = {
  drawerWidth: 200,
  drawerPosition: DrawerPosition.LEFT,
  drawerType: DrawerType.FRONT,
  edgeWidth: 20,
  minSwipeDistance: 3,
  overlayColor: 'rgba(0, 0, 0, 0.7)',
  drawerLockMode: DrawerLockMode.UNLOCKED,
  enableTrackpadTwoFingerGesture: false,
  activeCursor: 'auto',
  mouseButton: _gestureHandlerCommon.MouseButton.LEFT,
  statusBarAnimation: 'slide'
};

// StatusBar.setHidden and Keyboard.dismiss cannot be directly referenced in worklets.
const setStatusBarHidden = _reactNative.StatusBar.setHidden;
const dismissKeyboard = _reactNative.Keyboard.dismiss;
const DrawerLayout = /*#__PURE__*/(0, _react.forwardRef)(function DrawerLayout(props, ref) {
  const [containerWidth, setContainerWidth] = (0, _react.useState)(0);
  const [drawerState, setDrawerState] = (0, _react.useState)(DrawerState.IDLE);
  const [drawerOpened, setDrawerOpened] = (0, _react.useState)(false);
  const {
    drawerPosition = defaultProps.drawerPosition,
    drawerWidth = defaultProps.drawerWidth,
    drawerType = defaultProps.drawerType,
    drawerBackgroundColor,
    drawerContainerStyle,
    contentContainerStyle,
    minSwipeDistance = defaultProps.minSwipeDistance,
    edgeWidth = defaultProps.edgeWidth,
    drawerLockMode = defaultProps.drawerLockMode,
    overlayColor = defaultProps.overlayColor,
    enableTrackpadTwoFingerGesture = defaultProps.enableTrackpadTwoFingerGesture,
    activeCursor = defaultProps.activeCursor,
    mouseButton = defaultProps.mouseButton,
    statusBarAnimation = defaultProps.statusBarAnimation,
    hideStatusBar,
    keyboardDismissMode,
    userSelect,
    enableContextMenu,
    renderNavigationView,
    onDrawerSlide,
    onDrawerClose,
    onDrawerOpen,
    onDrawerStateChanged,
    animationSpeed: animationSpeedProp
  } = props;
  const isFromLeft = drawerPosition === DrawerPosition.LEFT;
  const sideCorrection = isFromLeft ? 1 : -1;

  // While closing the drawer when user starts gesture in the greyed out part of the window,
  // we want the drawer to follow only once the finger reaches the edge of the drawer.
  // See the diagram for reference. * = starting finger position, < = current finger position
  // 1) +---------------+ 2) +---------------+ 3) +---------------+ 4) +---------------+
  //    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXX|.........|
  //    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXX|.........|
  //    |XXXXXXXX|..<*..|    |XXXXXXXX|.<-*..|    |XXXXXXXX|<--*..|    |XXXXX|<-----*..|
  //    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXX|.........|
  //    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXX|.........|
  //    +---------------+    +---------------+    +---------------+    +---------------+

  const openValue = (0, _reactNativeReanimated.useSharedValue)(0);
  (0, _reactNativeReanimated.useDerivedValue)(() => {
    onDrawerSlide && (0, _reactNativeReanimated.runOnJS)(onDrawerSlide)(openValue.value);
  }, []);
  const isDrawerOpen = (0, _reactNativeReanimated.useSharedValue)(false);
  const handleContainerLayout = ({
    nativeEvent
  }) => {
    setContainerWidth(nativeEvent.layout.width);
  };
  const emitStateChanged = (0, _react.useCallback)((newState, drawerWillShow) => {
    'worklet';

    onDrawerStateChanged && (0, _reactNativeReanimated.runOnJS)(onDrawerStateChanged)?.(newState, drawerWillShow);
  }, [onDrawerStateChanged]);
  const drawerAnimatedProps = (0, _reactNativeReanimated.useAnimatedProps)(() => ({
    accessibilityViewIsModal: isDrawerOpen.value
  }));
  const overlayAnimatedProps = (0, _reactNativeReanimated.useAnimatedProps)(() => ({
    pointerEvents: isDrawerOpen.value ? 'auto' : 'none'
  }));

  // While the drawer is hidden, it's hitSlop overflows onto the main view by edgeWidth
  // This way it can be swiped open even when it's hidden
  const [edgeHitSlop, setEdgeHitSlop] = (0, _react.useState)(isFromLeft ? {
    left: 0,
    width: edgeWidth
  } : {
    right: 0,
    width: edgeWidth
  });

  // gestureOrientation is 1 if the gesture is expected to move from left to right and -1 otherwise
  const gestureOrientation = (0, _react.useMemo)(() => sideCorrection * (drawerOpened ? -1 : 1), [sideCorrection, drawerOpened]);
  (0, _react.useEffect)(() => {
    setEdgeHitSlop(isFromLeft ? {
      left: 0,
      width: edgeWidth
    } : {
      right: 0,
      width: edgeWidth
    });
  }, [isFromLeft, edgeWidth]);
  const animateDrawer = (0, _react.useCallback)((toValue, initialVelocity, animationSpeed) => {
    'worklet';

    const willShow = toValue !== 0;
    isDrawerOpen.value = willShow;
    emitStateChanged(DrawerState.SETTLING, willShow);
    (0, _reactNativeReanimated.runOnJS)(setDrawerState)(DrawerState.SETTLING);
    if (hideStatusBar) {
      (0, _reactNativeReanimated.runOnJS)(setStatusBarHidden)(willShow, statusBarAnimation);
    }
    const normalizedToValue = (0, _reactNativeReanimated.interpolate)(toValue, [0, drawerWidth], [0, 1], _reactNativeReanimated.Extrapolation.CLAMP);
    const normalizedInitialVelocity = (0, _reactNativeReanimated.interpolate)(initialVelocity, [0, drawerWidth], [0, 1], _reactNativeReanimated.Extrapolation.CLAMP);
    openValue.value = (0, _reactNativeReanimated.withSpring)(normalizedToValue, {
      overshootClamping: true,
      velocity: normalizedInitialVelocity,
      mass: animationSpeed ? 1 / animationSpeed : 1 / (animationSpeedProp ?? 1),
      damping: 40,
      stiffness: 500
    }, finished => {
      if (finished) {
        emitStateChanged(DrawerState.IDLE, willShow);
        (0, _reactNativeReanimated.runOnJS)(setDrawerOpened)(willShow);
        (0, _reactNativeReanimated.runOnJS)(setDrawerState)(DrawerState.IDLE);
        if (willShow) {
          onDrawerOpen && (0, _reactNativeReanimated.runOnJS)(onDrawerOpen)?.();
        } else {
          onDrawerClose && (0, _reactNativeReanimated.runOnJS)(onDrawerClose)?.();
        }
      }
    });
  }, [openValue, emitStateChanged, isDrawerOpen, hideStatusBar, onDrawerClose, onDrawerOpen, drawerWidth, statusBarAnimation]);
  const handleRelease = (0, _react.useCallback)(event => {
    'worklet';

    let {
      translationX: dragX,
      velocityX,
      x: touchX
    } = event;
    if (drawerPosition !== DrawerPosition.LEFT) {
      // See description in _updateAnimatedEvent about why events are flipped
      // for right-side drawer
      dragX = -dragX;
      touchX = containerWidth - touchX;
      velocityX = -velocityX;
    }
    const gestureStartX = touchX - dragX;
    let dragOffsetBasedOnStart = 0;
    if (drawerType === DrawerType.FRONT) {
      dragOffsetBasedOnStart = gestureStartX > drawerWidth ? gestureStartX - drawerWidth : 0;
    }
    const startOffsetX = dragX + dragOffsetBasedOnStart + (isDrawerOpen.value ? drawerWidth : 0);
    const projOffsetX = startOffsetX + DRAG_TOSS * velocityX;
    const shouldOpen = projOffsetX > drawerWidth / 2;
    if (shouldOpen) {
      animateDrawer(drawerWidth, velocityX);
    } else {
      animateDrawer(0, velocityX);
    }
  }, [animateDrawer, containerWidth, drawerPosition, drawerType, drawerWidth, isDrawerOpen]);
  const openDrawer = (0, _react.useCallback)((options = {}) => {
    'worklet';

    animateDrawer(drawerWidth, options.initialVelocity ?? 0, options.animationSpeed);
  }, [animateDrawer, drawerWidth]);
  const closeDrawer = (0, _react.useCallback)((options = {}) => {
    'worklet';

    animateDrawer(0, options.initialVelocity ?? 0, options.animationSpeed);
  }, [animateDrawer]);
  const overlayDismissGesture = (0, _react.useMemo)(() => _gestureObjects.GestureObjects.Tap().maxDistance(25).onEnd(() => {
    if (isDrawerOpen.value && drawerLockMode !== DrawerLockMode.LOCKED_OPEN) {
      closeDrawer();
    }
  }), [closeDrawer, isDrawerOpen, drawerLockMode]);
  const overlayAnimatedStyle = (0, _reactNativeReanimated.useAnimatedStyle)(() => ({
    opacity: openValue.value,
    backgroundColor: overlayColor
  }));
  const fillHitSlop = (0, _react.useMemo)(() => isFromLeft ? {
    left: drawerWidth
  } : {
    right: drawerWidth
  }, [drawerWidth, isFromLeft]);
  const panGesture = (0, _react.useMemo)(() => {
    return _gestureObjects.GestureObjects.Pan().activeCursor(activeCursor).mouseButton(mouseButton).hitSlop(drawerOpened ? fillHitSlop : edgeHitSlop).minDistance(drawerOpened ? 100 : 0).activeOffsetX(gestureOrientation * minSwipeDistance).failOffsetY([-15, 15]).simultaneousWithExternalGesture(overlayDismissGesture).enableTrackpadTwoFingerGesture(enableTrackpadTwoFingerGesture).enabled(drawerState !== DrawerState.SETTLING && (drawerOpened ? drawerLockMode !== DrawerLockMode.LOCKED_OPEN : drawerLockMode !== DrawerLockMode.LOCKED_CLOSED)).onStart(() => {
      emitStateChanged(DrawerState.DRAGGING, false);
      (0, _reactNativeReanimated.runOnJS)(setDrawerState)(DrawerState.DRAGGING);
      if (keyboardDismissMode === DrawerKeyboardDismissMode.ON_DRAG) {
        (0, _reactNativeReanimated.runOnJS)(dismissKeyboard)();
      }
      if (hideStatusBar) {
        (0, _reactNativeReanimated.runOnJS)(setStatusBarHidden)(true, statusBarAnimation);
      }
    }).onUpdate(event => {
      const startedOutsideTranslation = isFromLeft ? (0, _reactNativeReanimated.interpolate)(event.x, [0, drawerWidth, drawerWidth + 1], [0, drawerWidth, drawerWidth]) : (0, _reactNativeReanimated.interpolate)(event.x - containerWidth, [-drawerWidth - 1, -drawerWidth, 0], [drawerWidth, drawerWidth, 0]);
      const startedInsideTranslation = sideCorrection * (event.translationX + (drawerOpened ? drawerWidth * -gestureOrientation : 0));
      const adjustedTranslation = Math.max(drawerOpened ? startedOutsideTranslation : 0, startedInsideTranslation);
      openValue.value = (0, _reactNativeReanimated.interpolate)(adjustedTranslation, [-drawerWidth, 0, drawerWidth], [1, 0, 1], _reactNativeReanimated.Extrapolation.CLAMP);
    }).onEnd(handleRelease);
  }, [drawerLockMode, openValue, drawerWidth, emitStateChanged, gestureOrientation, handleRelease, edgeHitSlop, fillHitSlop, minSwipeDistance, hideStatusBar, keyboardDismissMode, overlayDismissGesture, drawerOpened, isFromLeft, containerWidth, sideCorrection, drawerState, activeCursor, enableTrackpadTwoFingerGesture, mouseButton, statusBarAnimation]);

  // When using RTL, row and row-reverse flex directions are flipped.
  const reverseContentDirection = _reactNative.I18nManager.isRTL ? isFromLeft : !isFromLeft;
  const dynamicDrawerStyles = {
    backgroundColor: drawerBackgroundColor,
    width: drawerWidth
  };
  const containerStyles = (0, _reactNativeReanimated.useAnimatedStyle)(() => {
    if (drawerType === DrawerType.FRONT) {
      return {};
    }
    return {
      transform: [{
        translateX: (0, _reactNativeReanimated.interpolate)(openValue.value, [0, 1], [0, drawerWidth * sideCorrection], _reactNativeReanimated.Extrapolation.CLAMP)
      }]
    };
  });
  const drawerAnimatedStyle = (0, _reactNativeReanimated.useAnimatedStyle)(() => {
    const closedDrawerOffset = drawerWidth * -sideCorrection;
    const isBack = drawerType === DrawerType.BACK;
    const isIdle = drawerState === DrawerState.IDLE;
    if (isBack) {
      return {
        transform: [{
          translateX: 0
        }],
        flexDirection: reverseContentDirection ? 'row-reverse' : 'row'
      };
    }
    let translateX = 0;
    if (isIdle) {
      translateX = drawerOpened ? 0 : closedDrawerOffset;
    } else {
      translateX = (0, _reactNativeReanimated.interpolate)(openValue.value, [0, 1], [closedDrawerOffset, 0], _reactNativeReanimated.Extrapolation.CLAMP);
    }
    return {
      transform: [{
        translateX
      }],
      flexDirection: reverseContentDirection ? 'row-reverse' : 'row'
    };
  });
  const containerAnimatedProps = (0, _reactNativeReanimated.useAnimatedProps)(() => ({
    importantForAccessibility: _reactNative.Platform.OS === 'android' ? isDrawerOpen.value ? 'no-hide-descendants' : 'yes' : undefined
  }));
  const children = typeof props.children === 'function' ? props.children(openValue) // renderer function
  : props.children;
  (0, _react.useImperativeHandle)(ref, () => ({
    openDrawer,
    closeDrawer
  }), [openDrawer, closeDrawer]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_GestureDetector.GestureDetector, {
    gesture: panGesture,
    userSelect: userSelect,
    enableContextMenu: enableContextMenu,
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNativeReanimated.default.View, {
      style: styles.main,
      onLayout: handleContainerLayout,
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_GestureDetector.GestureDetector, {
        gesture: overlayDismissGesture,
        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNativeReanimated.default.View, {
          style: [drawerType === DrawerType.FRONT ? styles.containerOnBack : styles.containerInFront, containerStyles, contentContainerStyle],
          animatedProps: containerAnimatedProps,
          children: [children, /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativeReanimated.default.View, {
            animatedProps: overlayAnimatedProps,
            style: [styles.overlay, overlayAnimatedStyle]
          })]
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativeReanimated.default.View, {
        pointerEvents: "box-none",
        animatedProps: drawerAnimatedProps,
        style: [styles.drawerContainer, drawerAnimatedStyle, drawerContainerStyle],
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativeReanimated.default.View, {
          style: dynamicDrawerStyles,
          children: renderNavigationView(openValue)
        })
      })]
    })
  });
});
var _default = exports.default = DrawerLayout;
const styles = _reactNative.StyleSheet.create({
  drawerContainer: {
    ..._reactNative.StyleSheet.absoluteFillObject,
    zIndex: 1001,
    flexDirection: 'row'
  },
  containerInFront: {
    ..._reactNative.StyleSheet.absoluteFillObject,
    zIndex: 1002
  },
  containerOnBack: {
    ..._reactNative.StyleSheet.absoluteFillObject
  },
  main: {
    flex: 1,
    zIndex: 0,
    overflow: 'hidden'
  },
  overlay: {
    ..._reactNative.StyleSheet.absoluteFillObject,
    zIndex: 1000
  }
});
//# sourceMappingURL=ReanimatedDrawerLayout.js.map