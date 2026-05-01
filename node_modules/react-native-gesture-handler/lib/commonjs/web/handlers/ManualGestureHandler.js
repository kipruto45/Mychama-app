"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _GestureHandler = _interopRequireDefault(require("./GestureHandler"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class ManualGestureHandler extends _GestureHandler.default {
  onPointerDown(event) {
    this.tracker.addToTracker(event);
    super.onPointerDown(event);
    this.begin();
    this.tryToSendTouchEvent(event);
  }
  onPointerAdd(event) {
    this.tracker.addToTracker(event);
    super.onPointerAdd(event);
  }
  onPointerMove(event) {
    this.tracker.track(event);
    super.onPointerMove(event);
  }
  onPointerOutOfBounds(event) {
    this.tracker.track(event);
    super.onPointerOutOfBounds(event);
  }
  onPointerUp(event) {
    super.onPointerUp(event);
    this.tracker.removeFromTracker(event.pointerId);
  }
  onPointerRemove(event) {
    super.onPointerRemove(event);
    this.tracker.removeFromTracker(event.pointerId);
  }
}
exports.default = ManualGestureHandler;
//# sourceMappingURL=ManualGestureHandler.js.map