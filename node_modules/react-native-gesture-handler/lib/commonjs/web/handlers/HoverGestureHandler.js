"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _State = require("../../State");
var _GestureHandlerOrchestrator = _interopRequireDefault(require("../tools/GestureHandlerOrchestrator"));
var _GestureHandler = _interopRequireDefault(require("./GestureHandler"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class HoverGestureHandler extends _GestureHandler.default {
  transformNativeEvent() {
    return {
      ...super.transformNativeEvent(),
      stylusData: this.stylusData
    };
  }
  onPointerMoveOver(event) {
    _GestureHandlerOrchestrator.default.instance.recordHandlerIfNotPresent(this);
    this.tracker.addToTracker(event);
    this.stylusData = event.stylusData;
    super.onPointerMoveOver(event);
    if (this.state === _State.State.UNDETERMINED) {
      this.begin();
      this.activate();
    }
  }
  onPointerMoveOut(event) {
    this.tracker.removeFromTracker(event.pointerId);
    this.stylusData = event.stylusData;
    super.onPointerMoveOut(event);
    this.end();
  }
  onPointerMove(event) {
    this.tracker.track(event);
    this.stylusData = event.stylusData;
    super.onPointerMove(event);
  }
  onPointerCancel(event) {
    super.onPointerCancel(event);
    this.reset();
  }
}
exports.default = HoverGestureHandler;
//# sourceMappingURL=HoverGestureHandler.js.map