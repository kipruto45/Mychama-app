"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pinchHandlerName = exports.PinchGestureHandler = void 0;
var _createHandler = _interopRequireDefault(require("./createHandler"));
var _gestureHandlerCommon = require("./gestureHandlerCommon");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * @deprecated PinchGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Pinch()` instead.
 */

const pinchHandlerName = exports.pinchHandlerName = 'PinchGestureHandler';

/**
 * @deprecated PinchGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Pinch()` instead.
 */

/**
 * @deprecated PinchGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Pinch()` instead.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- backward compatibility; see description on the top of gestureHandlerCommon.ts file
const PinchGestureHandler = exports.PinchGestureHandler = (0, _createHandler.default)({
  name: pinchHandlerName,
  allowedProps: _gestureHandlerCommon.baseGestureHandlerProps,
  config: {}
});
//# sourceMappingURL=PinchGestureHandler.js.map