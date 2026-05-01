"use strict";

import * as React from 'react';
import { Animated, Platform, processColor, StyleSheet } from 'react-native';
import createNativeWrapper from '../handlers/createNativeWrapper';
import GestureHandlerButton from './GestureHandlerButton';
import { State } from '../State';
import { isFabric } from '../utils';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const RawButton = createNativeWrapper(GestureHandlerButton, {
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
    const active = pointerInside && state === State.ACTIVE;
    if (active !== this.lastActive && this.props.onActiveStateChange) {
      this.props.onActiveStateChange(active);
    }
    if (!this.longPressDetected && oldState === State.ACTIVE && state !== State.CANCELLED && this.lastActive && this.props.onPress) {
      this.props.onPress(pointerInside);
    }
    if (!this.lastActive &&
    // NativeViewGestureHandler sends different events based on platform
    state === (Platform.OS !== 'android' ? State.ACTIVE : State.BEGAN) && pointerInside) {
      this.longPressDetected = false;
      if (this.props.onLongPress) {
        this.longPressTimeout = setTimeout(this.onLongPress, this.props.delayLongPress);
      }
    } else if (
    // Cancel longpress timeout if it's set and the finger moved out of the view
    state === State.ACTIVE && !pointerInside && this.longPressTimeout !== undefined) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = undefined;
    } else if (
    // Cancel longpress timeout if it's set and the gesture has finished
    this.longPressTimeout !== undefined && (state === State.END || state === State.CANCELLED || state === State.FAILED)) {
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
      IS_FABRIC = isFabric();
    }
    const rippleColor = IS_FABRIC ? unprocessedRippleColor : processColor(unprocessedRippleColor ?? undefined);
    return /*#__PURE__*/_jsx(RawButton, {
      ref: this.props.innerRef,
      rippleColor: rippleColor,
      style: [style, Platform.OS === 'ios' && {
        cursor: undefined
      }],
      ...rest,
      onGestureEvent: this.onGestureEvent,
      onHandlerStateChange: this.onHandlerStateChange
    });
  }
}
const AnimatedInnerBaseButton = Animated.createAnimatedComponent(InnerBaseButton);
export const BaseButton = /*#__PURE__*/React.forwardRef((props, ref) => /*#__PURE__*/_jsx(InnerBaseButton, {
  innerRef: ref,
  ...props
}));
const AnimatedBaseButton = /*#__PURE__*/React.forwardRef((props, ref) => /*#__PURE__*/_jsx(AnimatedInnerBaseButton, {
  innerRef: ref,
  ...props
}));
const btnStyles = StyleSheet.create({
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
    this.opacity = new Animated.Value(0);
  }
  onActiveStateChange = active => {
    if (Platform.OS !== 'android') {
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
    const resolvedStyle = StyleSheet.flatten(style) ?? {};
    return /*#__PURE__*/_jsxs(BaseButton, {
      ...rest,
      ref: this.props.innerRef,
      style: resolvedStyle,
      onActiveStateChange: this.onActiveStateChange,
      children: [/*#__PURE__*/_jsx(Animated.View, {
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
export const RectButton = /*#__PURE__*/React.forwardRef((props, ref) => /*#__PURE__*/_jsx(InnerRectButton, {
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
    this.opacity = new Animated.Value(1);
  }
  onActiveStateChange = active => {
    if (Platform.OS !== 'android') {
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
    return /*#__PURE__*/_jsx(AnimatedBaseButton, {
      ...rest,
      innerRef: innerRef,
      onActiveStateChange: this.onActiveStateChange,
      style: [style, Platform.OS === 'ios' && {
        opacity: this.opacity
      }],
      children: children
    });
  }
}
export const BorderlessButton = /*#__PURE__*/React.forwardRef((props, ref) => /*#__PURE__*/_jsx(InnerBorderlessButton, {
  innerRef: ref,
  ...props
}));
export { default as PureNativeButton } from './GestureHandlerButton';
//# sourceMappingURL=GestureButtons.js.map