"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useMountReactions = useMountReactions;
var _utils = require("../../utils");
var _mountRegistry = require("../../../mountRegistry");
var _react = require("react");
function shouldUpdateDetector(relation, gesture) {
  if (relation === undefined) {
    return false;
  }
  for (const tag of (0, _utils.transformIntoHandlerTags)(relation)) {
    if (tag === gesture.handlerTag) {
      return true;
    }
  }
  return false;
}
function useMountReactions(updateDetector, state) {
  (0, _react.useEffect)(() => {
    return _mountRegistry.MountRegistry.addMountListener(gesture => {
      // At this point the ref in the gesture config should be updated, so we can check if one of the gestures
      // set in a relation with the gesture got mounted. If so, we need to update the detector to propagate
      // the changes to the native side.
      for (const attachedGesture of state.attachedGestures) {
        const blocksHandlers = attachedGesture.config.blocksHandlers;
        const requireToFail = attachedGesture.config.requireToFail;
        const simultaneousWith = attachedGesture.config.simultaneousWith;
        if (shouldUpdateDetector(blocksHandlers, gesture) || shouldUpdateDetector(requireToFail, gesture) || shouldUpdateDetector(simultaneousWith, gesture)) {
          updateDetector();

          // We can safely return here, if any other gestures should be updated, they will be by the above call
          return;
        }
      }
    });
  }, [updateDetector, state]);
}
//# sourceMappingURL=useMountReactions.js.map