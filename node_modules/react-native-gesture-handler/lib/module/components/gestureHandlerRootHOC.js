"use strict";

import * as React from 'react';
import { StyleSheet } from 'react-native';
import hoistNonReactStatics from 'hoist-non-react-statics';
import GestureHandlerRootView from './GestureHandlerRootView';

/**
 * @deprecated `gestureHandlerRootHOC` is deprecated and will be removed in the future version of Gesture Handler.
 * Use `GestureHandlerRootView` directly instead.
 */
import { jsx as _jsx } from "react/jsx-runtime";
export default function gestureHandlerRootHOC(Component, containerStyles) {
  function Wrapper(props) {
    return /*#__PURE__*/_jsx(GestureHandlerRootView, {
      style: [styles.container, containerStyles],
      children: /*#__PURE__*/_jsx(Component, {
        ...props
      })
    });
  }
  Wrapper.displayName = `gestureHandlerRootHOC(${Component.displayName || Component.name})`;

  // @ts-ignore - hoistNonReactStatics uses old version of @types/react
  hoistNonReactStatics(Wrapper, Component);
  return Wrapper;
}
const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
//# sourceMappingURL=gestureHandlerRootHOC.js.map