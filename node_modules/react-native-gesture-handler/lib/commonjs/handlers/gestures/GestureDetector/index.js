"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GestureDetector = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _findNodeHandle = _interopRequireDefault(require("../../../findNodeHandle"));
var _utils = require("../../../utils");
var _GestureHandlerRootViewContext = _interopRequireDefault(require("../../../GestureHandlerRootViewContext"));
var _useAnimatedGesture = require("./useAnimatedGesture");
var _attachHandlers = require("./attachHandlers");
var _needsToReattach = require("./needsToReattach");
var _dropHandlers = require("./dropHandlers");
var _utils2 = require("./utils");
var _Wrap = require("./Wrap");
var _useDetectorUpdater = require("./useDetectorUpdater");
var _useViewRefHandler = require("./useViewRefHandler");
var _useMountReactions = require("./useMountReactions");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/* eslint-disable react/no-unused-prop-types */

function propagateDetectorConfig(props, gesture) {
  const keysToPropagate = ['userSelect', 'enableContextMenu', 'touchAction'];
  for (const key of keysToPropagate) {
    const value = props[key];
    if (value === undefined) {
      continue;
    }
    for (const g of gesture.toGestureArray()) {
      const config = g.config;
      config[key] = value;
    }
  }
}
/**
 * `GestureDetector` is responsible for creating and updating native gesture handlers based on the config of provided gesture.
 *
 * ### Props
 * - `gesture`
 * - `userSelect` (**Web only**)
 * - `enableContextMenu` (**Web only**)
 * - `touchAction` (**Web only**)
 *
 * ### Remarks
 * - Gesture Detector will use first native view in its subtree to recognize gestures, however if this view is used only to group its children it may get automatically collapsed.
 * - Using the same instance of a gesture across multiple Gesture Detectors is not possible.
 *
 * @see https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/gesture-detector
 */
const GestureDetector = props => {
  const rootViewContext = (0, _react.useContext)(_GestureHandlerRootViewContext.default);
  if (__DEV__ && !rootViewContext && !(0, _utils.isTestEnv)() && _reactNative.Platform.OS !== 'web') {
    throw new Error('GestureDetector must be used as a descendant of GestureHandlerRootView. Otherwise the gestures will not be recognized. See https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation for more details.');
  }

  // Gesture config should be wrapped with useMemo to prevent unnecessary re-renders
  const gestureConfig = props.gesture;
  propagateDetectorConfig(props, gestureConfig);
  const gesturesToAttach = (0, _react.useMemo)(() => gestureConfig.toGestureArray(), [gestureConfig]);
  const shouldUseReanimated = gesturesToAttach.some(g => g.shouldUseReanimated);
  const webEventHandlersRef = (0, _utils2.useWebEventHandlers)();
  // Store state in ref to prevent unnecessary renders
  const state = (0, _react.useRef)({
    firstRender: true,
    viewRef: null,
    previousViewTag: -1,
    forceRebuildReanimatedEvent: false
  }).current;
  const preparedGesture = _react.default.useRef({
    attachedGestures: [],
    animatedEventHandler: null,
    animatedHandlers: null,
    shouldUseReanimated: shouldUseReanimated,
    isMounted: false
  }).current;
  const updateAttachedGestures = (0, _useDetectorUpdater.useDetectorUpdater)(state, preparedGesture, gesturesToAttach, gestureConfig, webEventHandlersRef);
  const refHandler = (0, _useViewRefHandler.useViewRefHandler)(state, updateAttachedGestures);

  // Reanimated event should be rebuilt only when gestures are reattached, otherwise
  // config update will be enough as all necessary items are stored in shared values anyway
  const needsToRebuildReanimatedEvent = state.firstRender || state.forceRebuildReanimatedEvent || (0, _needsToReattach.needsToReattach)(preparedGesture, gesturesToAttach);
  state.forceRebuildReanimatedEvent = false;
  (0, _useAnimatedGesture.useAnimatedGesture)(preparedGesture, needsToRebuildReanimatedEvent);
  (0, _react.useLayoutEffect)(() => {
    const viewTag = (0, _findNodeHandle.default)(state.viewRef);
    preparedGesture.isMounted = true;
    (0, _attachHandlers.attachHandlers)({
      preparedGesture,
      gestureConfig,
      gesturesToAttach,
      webEventHandlersRef,
      viewTag
    });
    return () => {
      preparedGesture.isMounted = false;
      (0, _dropHandlers.dropHandlers)(preparedGesture);
    };
  }, []);
  (0, _react.useEffect)(() => {
    if (state.firstRender) {
      state.firstRender = false;
    } else {
      updateAttachedGestures();
    }
  }, [props]);
  (0, _useMountReactions.useMountReactions)(updateAttachedGestures, preparedGesture);
  if (shouldUseReanimated) {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(_Wrap.AnimatedWrap, {
      ref: refHandler,
      onGestureHandlerEvent: preparedGesture.animatedEventHandler,
      children: props.children
    });
  } else {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(_Wrap.Wrap, {
      ref: refHandler,
      children: props.children
    });
  }
};
exports.GestureDetector = GestureDetector;
//# sourceMappingURL=index.js.map