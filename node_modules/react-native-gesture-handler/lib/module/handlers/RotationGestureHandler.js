"use strict";

import createHandler from './createHandler';
import { baseGestureHandlerProps } from './gestureHandlerCommon';

/**
 * @deprecated RotationGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Rotation()` instead.
 */

export const rotationHandlerName = 'RotationGestureHandler';

/**
 * @deprecated RotationGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Rotation()` instead.
 */

/**
 * @deprecated RotationGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Rotation()` instead.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- backward compatibility; see description on the top of gestureHandlerCommon.ts file
export const RotationGestureHandler = createHandler({
  name: rotationHandlerName,
  allowedProps: baseGestureHandlerProps,
  config: {}
});
//# sourceMappingURL=RotationGestureHandler.js.map