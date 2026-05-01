"use strict";

import { unregisterHandler } from '../../handlersRegistry';
import RNGestureHandlerModule from '../../../RNGestureHandlerModule';
import { scheduleFlushOperations } from '../../utils';
import { MountRegistry } from '../../../mountRegistry';
export function dropHandlers(preparedGesture) {
  for (const handler of preparedGesture.attachedGestures) {
    RNGestureHandlerModule.dropGestureHandler(handler.handlerTag);
    unregisterHandler(handler.handlerTag, handler.config.testId);
    MountRegistry.gestureWillUnmount(handler);
  }
  scheduleFlushOperations();
}
//# sourceMappingURL=dropHandlers.js.map