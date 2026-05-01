"use strict";

import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { maybeInitializeFabric } from '../init';
import GestureHandlerRootViewContext from '../GestureHandlerRootViewContext';
import { jsx as _jsx } from "react/jsx-runtime";
export default function GestureHandlerRootView({
  style,
  ...rest
}) {
  // Try initialize fabric on the first render, at this point we can
  // reliably check if fabric is enabled (the function contains a flag
  // to make sure it's called only once)
  maybeInitializeFabric();
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
//# sourceMappingURL=GestureHandlerRootView.js.map