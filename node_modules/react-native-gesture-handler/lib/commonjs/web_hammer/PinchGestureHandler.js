"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _hammerjs = _interopRequireDefault(require("@egjs/hammerjs"));
var _IndiscreteGestureHandler = _interopRequireDefault(require("./IndiscreteGestureHandler"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class PinchGestureHandler extends _IndiscreteGestureHandler.default {
  get name() {
    return 'pinch';
  }
  get NativeGestureClass() {
    return _hammerjs.default.Pinch;
  }
  transformNativeEvent({
    scale,
    velocity,
    center
  }) {
    return {
      focalX: center.x,
      focalY: center.y,
      velocity,
      scale
    };
  }
}
var _default = exports.default = PinchGestureHandler;
//# sourceMappingURL=PinchGestureHandler.js.map