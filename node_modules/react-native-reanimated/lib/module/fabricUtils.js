/* eslint-disable @typescript-eslint/no-explicit-any */
'use strict';

import { findHostInstance } from './platform-specific/findHostInstance';
export function getShadowNodeWrapperFromRef(ref, hostInstance) {
  let resolvedInstance = hostInstance?.__internalInstanceHandle ?? ref?.__internalInstanceHandle;
  if (!resolvedInstance) {
    if (ref.getNativeScrollRef) {
      resolvedInstance = ref.getNativeScrollRef().__internalInstanceHandle;
    } else if (ref._reactInternals) {
      resolvedInstance = findHostInstance(ref).__internalInstanceHandle;
    } else {
      throw new ReanimatedError(`Failed to find host instance for a ref.}`);
    }
  }
  return resolvedInstance.stateNode.node;
}
//# sourceMappingURL=fabricUtils.js.map