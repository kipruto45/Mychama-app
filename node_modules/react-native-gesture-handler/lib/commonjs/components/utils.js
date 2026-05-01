"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.applyRelationProp = applyRelationProp;
function applyRelationProp(gesture, relationPropName, relationProp) {
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