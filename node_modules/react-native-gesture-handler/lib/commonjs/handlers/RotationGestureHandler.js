"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rotationHandlerName = exports.RotationGestureHandler = void 0;
var _createHandler = _interopRequireDefault(require("./createHandler"));
var _gestureHandlerCommon = require("./gestureHandlerCommon");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * @deprecated RotationGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Rotation()` instead.
 */

const rotationHandlerName = exports.rotationHandlerName = 'RotationGestureHandler';

/**
 * @deprecated RotationGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Rotation()` instead.
 */

/**
 * @deprecated RotationGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Rotation()` instead.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- backward compatibility; see description on the top of gestureHandlerCommon.ts file
const RotationGestureHandler = exports.RotationGestureHandler = (0, _createHandler.default)({
  name: rotationHandlerName,
  allowedProps: _gestureHandlerCommon.baseGestureHandlerProps,
  config: {}
});
//# sourceMappingURL=RotationGestureHandler.js.map