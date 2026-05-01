"use strict";

import React from 'react';
import { tagMessage } from '../utils';
import PlatformConstants from '../PlatformConstants';
import createHandler from './createHandler';
import { baseGestureHandlerProps } from './gestureHandlerCommon';
export const forceTouchGestureHandlerProps = ['minForce', 'maxForce', 'feedbackOnActivation'];

// implicit `children` prop has been removed in @types/react^18.0.0
class ForceTouchFallback extends React.Component {
  static forceTouchAvailable = false;
  componentDidMount() {
    console.warn(tagMessage('ForceTouchGestureHandler is not available on this platform. Please use ForceTouchGestureHandler.forceTouchAvailable to conditionally render other components that would provide a fallback behavior specific to your usecase'));
  }
  render() {
    return this.props.children;
  }
}

/**
 * @deprecated ForceTouchGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.ForceTouch()` instead.
 */

/**
 * @deprecated ForceTouchGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.ForceTouch()` instead.
 */

export const forceTouchHandlerName = 'ForceTouchGestureHandler';

/**
 * @deprecated ForceTouchGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.ForceTouch()` instead.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- backward compatibility; see description on the top of gestureHandlerCommon.ts file
export const ForceTouchGestureHandler = PlatformConstants?.forceTouchAvailable ? createHandler({
  name: forceTouchHandlerName,
  allowedProps: [...baseGestureHandlerProps, ...forceTouchGestureHandlerProps],
  config: {}
}) : ForceTouchFallback;
ForceTouchGestureHandler.forceTouchAvailable = PlatformConstants?.forceTouchAvailable || false;
//# sourceMappingURL=ForceTouchGestureHandler.js.map