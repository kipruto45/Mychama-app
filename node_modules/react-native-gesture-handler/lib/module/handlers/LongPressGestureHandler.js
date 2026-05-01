"use strict";

import createHandler from './createHandler';
import { baseGestureHandlerProps } from './gestureHandlerCommon';
export const longPressGestureHandlerProps = ['minDurationMs', 'maxDist', 'numberOfPointers'];

/**
 * @deprecated LongPressGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.LongPress()` instead.
 */

export const longPressHandlerName = 'LongPressGestureHandler';

/**
 * @deprecated LongPressGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.LongPress()` instead.
 */

/**
 * @deprecated LongPressGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.LongPress()` instead.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- backward compatibility; see description on the top of gestureHandlerCommon.ts file
export const LongPressGestureHandler = createHandler({
  name: longPressHandlerName,
  allowedProps: [...baseGestureHandlerProps, ...longPressGestureHandlerProps],
  config: {
    shouldCancelWhenOutside: true
  }
});
//# sourceMappingURL=LongPressGestureHandler.js.map