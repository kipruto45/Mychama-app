"use strict";

import createHandler from './createHandler';
import { baseGestureHandlerProps } from './gestureHandlerCommon';
export const tapGestureHandlerProps = ['maxDurationMs', 'maxDelayMs', 'numberOfTaps', 'maxDeltaX', 'maxDeltaY', 'maxDist', 'minPointers'];

/**
 * @deprecated TapGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Tap()` instead.
 */

export const tapHandlerName = 'TapGestureHandler';

/**
 * @deprecated TapGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Tap()` instead.
 */

/**
 * @deprecated TapGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Tap()` instead.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- backward compatibility; see description on the top of gestureHandlerCommon.ts file
export const TapGestureHandler = createHandler({
  name: tapHandlerName,
  allowedProps: [...baseGestureHandlerProps, ...tapGestureHandlerProps],
  config: {
    shouldCancelWhenOutside: true
  }
});
//# sourceMappingURL=TapGestureHandler.js.map