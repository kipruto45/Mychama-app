"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _EventManager = _interopRequireDefault(require("./EventManager"));
var _interfaces = require("../interfaces");
var _PointerType = require("../../PointerType");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class WheelEventManager extends _EventManager.default {
  wheelDelta = {
    x: 0,
    y: 0
  };
  resetDelta = _event => {
    this.wheelDelta = {
      x: 0,
      y: 0
    };
  };
  wheelCallback = event => {
    this.wheelDelta.x += event.deltaX;
    this.wheelDelta.y += event.deltaY;
    const adaptedEvent = this.mapEvent(event);
    this.onWheel(adaptedEvent);
  };
  registerListeners() {
    this.view.addEventListener('pointermove', this.resetDelta);
    this.view.addEventListener('wheel', this.wheelCallback);
  }
  unregisterListeners() {
    this.view.removeEventListener('pointermove', this.resetDelta);
    this.view.removeEventListener('wheel', this.wheelCallback);
  }
  mapEvent(event) {
    return {
      x: event.clientX + this.wheelDelta.x,
      y: event.clientY + this.wheelDelta.y,
      offsetX: event.offsetX - event.deltaX,
      offsetY: event.offsetY - event.deltaY,
      pointerId: -1,
      eventType: _interfaces.EventTypes.MOVE,
      pointerType: _PointerType.PointerType.OTHER,
      time: event.timeStamp,
      // @ts-ignore It does exist, but it's deprecated
      wheelDeltaY: event.wheelDeltaY
    };
  }
  resetManager() {
    super.resetManager();
  }
}
exports.default = WheelEventManager;
//# sourceMappingURL=WheelEventManager.js.map