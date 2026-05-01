"use strict";

import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import GestureHandlerRootViewContext from '../GestureHandlerRootViewContext';
import { jsx as _jsx } from "react/jsx-runtime";
export default function GestureHandlerRootView({
  style,
  ...rest
}) {
  return /*#__PURE__*/_jsx(GestureHandlerRootViewContext.Provider, {
    value: true,
    children: /*#__PURE__*/_jsx(View, {
      style: style ?? styles.container,
      ...rest
    })
  });
}
const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
//# sourceMappingURL=GestureHandlerRootView.web.js.map