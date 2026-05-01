"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _hammerjs = _interopRequireDefault(require("@egjs/hammerjs"));
var _constants = require("./constants");
var _IndiscreteGestureHandler = _interopRequireDefault(require("./IndiscreteGestureHandler"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class RotationGestureHandler extends _IndiscreteGestureHandler.default {
  get name() {
    return 'rotate';
  }
  get NativeGestureClass() {
    return _hammerjs.default.Rotate;
  }
  transformNativeEvent({
    rotation,
    velocity,
    center
  }) {
    return {
      rotation: (rotation - (this.initialRotation ?? 0)) * _constants.DEG_RAD,
      anchorX: center.x,
      anchorY: center.y,
      velocity
    };
  }
}
var _default = exports.default = RotationGestureHandler;
//# sourceMappingURL=RotationGestureHandler.js.map