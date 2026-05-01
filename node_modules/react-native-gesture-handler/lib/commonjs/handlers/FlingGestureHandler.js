"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.flingHandlerName = exports.flingGestureHandlerProps = exports.FlingGestureHandler = void 0;
var _createHandler = _interopRequireDefault(require("./createHandler"));
var _gestureHandlerCommon = require("./gestureHandlerCommon");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const flingGestureHandlerProps = exports.flingGestureHandlerProps = ['numberOfPointers', 'direction'];

/**
 * @deprecated FlingGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Fling()` instead.
 */

const flingHandlerName = exports.flingHandlerName = 'FlingGestureHandler';

/**
 * @deprecated FlingGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Fling()` instead.
 */

/**
 * @deprecated FlingGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Fling()` instead.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- backward compatibility; see description on the top of gestureHandlerCommon.ts file
const FlingGestureHandler = exports.FlingGestureHandler = (0, _createHandler.default)({
  name: flingHandlerName,
  allowedProps: [..._gestureHandlerCommon.baseGestureHandlerProps, ...flingGestureHandlerProps],
  config: {}
});
//# sourceMappingURL=FlingGestureHandler.js.map