"use strict";

import * as React from 'react';
import { Component } from 'react';
import GenericTouchable, { TOUCHABLE_STATE } from './GenericTouchable';
import { StyleSheet, View } from 'react-native';

/**
 * @deprecated TouchableHighlight will be removed in the future version of Gesture Handler. Use Pressable instead.
 */
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @deprecated TouchableHighlight will be removed in the future version of Gesture Handler. Use Pressable instead.
 *
 * TouchableHighlight follows RN's implementation
 */
export default class TouchableHighlight extends Component {
  static defaultProps = {
    ...GenericTouchable.defaultProps,
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
      return /*#__PURE__*/_jsx(View, {});
    }
    const child = React.Children.only(this.props.children); // TODO: not sure if OK but fixes error
    return /*#__PURE__*/React.cloneElement(child, {
      style: StyleSheet.compose(child.props.style, this.state.extraChildStyle)
    });
  }
  onStateChange = (_from, to) => {
    if (to === TOUCHABLE_STATE.BEGAN) {
      this.showUnderlay();
    } else if (to === TOUCHABLE_STATE.UNDETERMINED || to === TOUCHABLE_STATE.MOVED_OUTSIDE) {
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
    return /*#__PURE__*/_jsx(GenericTouchable, {
      ...rest,
      style: [style, extraUnderlayStyle],
      onStateChange: this.onStateChange,
      children: this.renderChildren()
    });
  }
}
//# sourceMappingURL=TouchableHighlight.js.map