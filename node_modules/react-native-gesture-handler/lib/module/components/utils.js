"use strict";

export function applyRelationProp(gesture, relationPropName, relationProp) {
  if (!relationProp) {
    return;
  }
  if (Array.isArray(relationProp)) {
    gesture[relationPropName](...relationProp);
  } else {
    gesture[relationPropName](relationProp);
  }
}
//# sourceMappingURL=utils.js.map