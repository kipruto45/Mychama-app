"use strict";

import createHandler from './createHandler';
import { baseGestureHandlerProps } from './gestureHandlerCommon';
export const flingGestureHandlerProps = ['numberOfPointers', 'direction'];

/**
 * @deprecated FlingGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Fling()` instead.
 */

export const flingHandlerName = 'FlingGestureHandler';

/**
 * @deprecated FlingGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Fling()` instead.
 */

/**
 * @deprecated FlingGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Fling()` instead.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- backward compatibility; see description on the top of gestureHandlerCommon.ts file
export const FlingGestureHandler = createHandler({
  name: flingHandlerName,
  allowedProps: [...baseGestureHandlerProps, ...flingGestureHandlerProps],
  config: {}
});
//# sourceMappingURL=FlingGestureHandler.js.map