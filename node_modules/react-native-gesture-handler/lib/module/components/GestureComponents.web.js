"use strict";

import * as React from 'react';
import { FlatList as RNFlatList, Switch as RNSwitch, TextInput as RNTextInput, ScrollView as RNScrollView, View } from 'react-native';
import createNativeWrapper from '../handlers/createNativeWrapper';
import { jsx as _jsx } from "react/jsx-runtime";
export const ScrollView = createNativeWrapper(RNScrollView, {
  disallowInterruption: false
});
export const Switch = createNativeWrapper(RNSwitch, {
  shouldCancelWhenOutside: false,
  shouldActivateOnStart: true,
  disallowInterruption: true
});
export const TextInput = createNativeWrapper(RNTextInput);
export const DrawerLayoutAndroid = () => {
  console.warn('DrawerLayoutAndroid is not supported on web!');
  return /*#__PURE__*/_jsx(View, {});
};

// RefreshControl is implemented as a functional component, rendering a View
// NativeViewGestureHandler needs to set a ref on its child, which cannot be done
// on functional components
export const RefreshControl = createNativeWrapper(View);
export const FlatList = /*#__PURE__*/React.forwardRef((props, ref) => /*#__PURE__*/_jsx(RNFlatList, {
  ref: ref,
  ...props,
  renderScrollComponent: scrollProps => /*#__PURE__*/_jsx(ScrollView, {
    ...scrollProps
  })
}));
//# sourceMappingURL=GestureComponents.web.js.map