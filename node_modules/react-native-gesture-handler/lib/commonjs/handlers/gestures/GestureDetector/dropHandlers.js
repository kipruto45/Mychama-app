"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dropHandlers = dropHandlers;
var _handlersRegistry = require("../../handlersRegistry");
var _RNGestureHandlerModule = _interopRequireDefault(require("../../../RNGestureHandlerModule"));
var _utils = require("../../utils");
var _mountRegistry = require("../../../mountRegistry");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function dropHandlers(preparedGesture) {
  for (const handler of preparedGesture.attachedGestures) {
    _RNGestureHandlerModule.default.dropGestureHandler(handler.handlerTag);
    (0, _handlersRegistry.unregisterHandler)(handler.handlerTag, handler.config.testId);
    _mountRegistry.MountRegistry.gestureWillUnmount(handler);
  }
  (0, _utils.scheduleFlushOperations)();
}
//# sourceMappingURL=dropHandlers.js.map