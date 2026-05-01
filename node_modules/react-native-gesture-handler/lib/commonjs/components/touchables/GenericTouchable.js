"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.TOUCHABLE_STATE = void 0;
var _react = _interopRequireWildcard(require("react"));
var React = _react;
var _reactNative = require("react-native");
var _State = require("../../State");
var _GestureButtons = require("../GestureButtons");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * Each touchable is a states' machine which preforms transitions.
 * On very beginning (and on the very end or recognition) touchable is
 * UNDETERMINED. Then it moves to BEGAN. If touchable recognizes that finger
 * travel outside it transits to special MOVED_OUTSIDE state. Gesture recognition
 * finishes in UNDETERMINED state.
 */
const TOUCHABLE_STATE = exports.TOUCHABLE_STATE = {
  UNDETERMINED: 0,
  BEGAN: 1,
  MOVED_OUTSIDE: 2
};

// TODO: maybe can be better
// TODO: all clearTimeout have ! added, maybe they shouldn't ?

/**
 * GenericTouchable is not intented to be used as it is.
 * Should be treated as a source for the rest of touchables
 */

class GenericTouchable extends _react.Component {
  static defaultProps = {
    delayLongPress: 600,
    extraButtonProps: {
      rippleColor: 'transparent',
      exclusive: true
    }
  };

  // Timeout handlers

  // This flag is required since recognition of longPress implies not-invoking onPress
  longPressDetected = false;
  pointerInside = true;

  // State of touchable
  STATE = TOUCHABLE_STATE.UNDETERMINED;

  // handlePressIn in called on first touch on traveling inside component.
  // Handles state transition with delay.
  handlePressIn() {
    if (this.props.delayPressIn) {
      this.pressInTimeout = setTimeout(() => {
        this.moveToState(TOUCHABLE_STATE.BEGAN);
        this.pressInTimeout = null;
      }, this.props.delayPressIn);
    } else {
      this.moveToState(TOUCHABLE_STATE.BEGAN);
    }
    if (this.props.onLongPress) {
      const time = (this.props.delayPressIn || 0) + (this.props.delayLongPress || 0);
      this.longPressTimeout = setTimeout(this.onLongPressDetected, time);
    }
  }
  // handleMoveOutside in called on traveling outside component.
  // Handles state transition with delay.
  handleMoveOutside() {
    if (this.props.delayPressOut) {
      this.pressOutTimeout = this.pressOutTimeout || setTimeout(() => {
        this.moveToState(TOUCHABLE_STATE.MOVED_OUTSIDE);
        this.pressOutTimeout = null;
      }, this.props.delayPressOut);
    } else {
      this.moveToState(TOUCHABLE_STATE.MOVED_OUTSIDE);
    }
  }

  // handleGoToUndetermined transits to UNDETERMINED state with proper delay
  handleGoToUndetermined() {
    clearTimeout(this.pressOutTimeout); // TODO: maybe it can be undefined
    if (this.props.delayPressOut) {
      this.pressOutTimeout = setTimeout(() => {
        if (this.STATE === TOUCHABLE_STATE.UNDETERMINED) {
          this.moveToState(TOUCHABLE_STATE.BEGAN);
        }
        this.moveToState(TOUCHABLE_STATE.UNDETERMINED);
        this.pressOutTimeout = null;
      }, this.props.delayPressOut);
    } else {
      if (this.STATE === TOUCHABLE_STATE.UNDETERMINED) {
        this.moveToState(TOUCHABLE_STATE.BEGAN);
      }
      this.moveToState(TOUCHABLE_STATE.UNDETERMINED);
    }
  }
  componentDidMount() {
    this.reset();
  }
  // Reset timeout to prevent memory leaks.
  reset() {
    this.longPressDetected = false;
    this.pointerInside = true;
    clearTimeout(this.pressInTimeout);
    clearTimeout(this.pressOutTimeout);
    clearTimeout(this.longPressTimeout);
    this.pressOutTimeout = null;
    this.longPressTimeout = null;
    this.pressInTimeout = null;
  }

  // All states' transitions are defined here.
  moveToState(newState) {
    if (newState === this.STATE) {
      // Ignore dummy transitions
      return;
    }
    if (newState === TOUCHABLE_STATE.BEGAN) {
      // First touch and moving inside
      this.props.onPressIn?.();
    } else if (newState === TOUCHABLE_STATE.MOVED_OUTSIDE) {
      // Moving outside
      this.props.onPressOut?.();
    } else if (newState === TOUCHABLE_STATE.UNDETERMINED) {
      // Need to reset each time on transition to UNDETERMINED
      this.reset();
      if (this.STATE === TOUCHABLE_STATE.BEGAN) {
        // ... and if it happens inside button.
        this.props.onPressOut?.();
      }
    }
    // Finally call lister (used by subclasses)
    this.props.onStateChange?.(this.STATE, newState);
    // ... and make transition.
    this.STATE = newState;
  }
  onGestureEvent = ({
    nativeEvent: {
      pointerInside
    }
  }) => {
    if (this.pointerInside !== pointerInside) {
      if (pointerInside) {
        this.onMoveIn();
      } else {
        this.onMoveOut();
      }
    }
    this.pointerInside = pointerInside;
  };
  onHandlerStateChange = ({
    nativeEvent
  }) => {
    const {
      state
    } = nativeEvent;
    if (state === _State.State.CANCELLED || state === _State.State.FAILED) {
      // Need to handle case with external cancellation (e.g. by ScrollView)
      this.moveToState(TOUCHABLE_STATE.UNDETERMINED);
    } else if (
    // This platform check is an implication of slightly different behavior of handlers on different platform.
    // And Android "Active" state is achieving on first move of a finger, not on press in.
    // On iOS event on "Began" is not delivered.
    state === (_reactNative.Platform.OS !== 'android' ? _State.State.ACTIVE : _State.State.BEGAN) && this.STATE === TOUCHABLE_STATE.UNDETERMINED) {
      // Moving inside requires
      this.handlePressIn();
    } else if (state === _State.State.END) {
      const shouldCallOnPress = !this.longPressDetected && this.STATE !== TOUCHABLE_STATE.MOVED_OUTSIDE && this.pressOutTimeout === null;
      this.handleGoToUndetermined();
      if (shouldCallOnPress) {
        // Calls only inside component whether no long press was called previously
        this.props.onPress?.();
      }
    }
  };
  onLongPressDetected = () => {
    this.longPressDetected = true;
    // Checked for in the caller of `onLongPressDetected`, but better to check twice
    this.props.onLongPress?.();
  };
  componentWillUnmount() {
    // To prevent memory leaks
    this.reset();
  }
  onMoveIn() {
    if (this.STATE === TOUCHABLE_STATE.MOVED_OUTSIDE) {
      // This call is not throttled with delays (like in RN's implementation).
      this.moveToState(TOUCHABLE_STATE.BEGAN);
    }
  }
  onMoveOut() {
    // Long press should no longer be detected
    clearTimeout(this.longPressTimeout);
    this.longPressTimeout = null;
    if (this.STATE === TOUCHABLE_STATE.BEGAN) {
      this.handleMoveOutside();
    }
  }
  render() {
    const hitSlop = (typeof this.props.hitSlop === 'number' ? {
      top: this.props.hitSlop,
      left: this.props.hitSlop,
      bottom: this.props.hitSlop,
      right: this.props.hitSlop
    } : this.props.hitSlop) ?? undefined;
    const coreProps = {
      accessible: this.props.accessible !== false,
      accessibilityLabel: this.props.accessibilityLabel,
      accessibilityHint: this.props.accessibilityHint,
      accessibilityRole: this.props.accessibilityRole,
      // TODO: check if changed to no 's' correctly, also removed 2 props that are no longer available: `accessibilityComponentType` and `accessibilityTraits`,
      // would be good to check if it is ok for sure, see: https://github.com/facebook/react-native/issues/24016
      accessibilityState: this.props.accessibilityState,
      accessibilityActions: this.props.accessibilityActions,
      onAccessibilityAction: this.props.onAccessibilityAction,
      nativeID: this.props.nativeID,
      onLayout: this.props.onLayout
    };
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(_GestureButtons.BaseButton, {
      style: this.props.containerStyle,
      onHandlerStateChange:
      // TODO: not sure if it can be undefined instead of null
      this.props.disabled ? undefined : this.onHandlerStateChange,
      onGestureEvent: this.onGestureEvent,
      hitSlop: hitSlop,
      userSelect: this.props.userSelect,
      shouldActivateOnStart: this.props.shouldActivateOnStart,
      disallowInterruption: this.props.disallowInterruption,
      testID: this.props.testID,
      touchSoundDisabled: this.props.touchSoundDisabled ?? false,
      enabled: !this.props.disabled,
      ...this.props.extraButtonProps,
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Animated.View, {
        ...coreProps,
        style: this.props.style,
        children: this.props.children
      })
    });
  }
}
exports.default = GenericTouchable;
//# sourceMappingURL=GenericTouchable.js.map