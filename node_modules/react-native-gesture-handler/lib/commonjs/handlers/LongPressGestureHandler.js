"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.longPressHandlerName = exports.longPressGestureHandlerProps = exports.LongPressGestureHandler = void 0;
var _createHandler = _interopRequireDefault(require("./createHandler"));
var _gestureHandlerCommon = require("./gestureHandlerCommon");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const longPressGestureHandlerProps = exports.longPressGestureHandlerProps = ['minDurationMs', 'maxDist', 'numberOfPointers'];

/**
 * @deprecated LongPressGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.LongPress()` instead.
 */

const longPressHandlerName = exports.longPressHandlerName = 'LongPressGestureHandler';

/**
 * @deprecated LongPressGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.LongPress()` instead.
 */

/**
 * @deprecated LongPressGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.LongPress()` instead.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- backward compatibility; see description on the top of gestureHandlerCommon.ts file
const LongPressGestureHandler = exports.LongPressGestureHandler = (0, _createHandler.default)({
  name: longPressHandlerName,
  allowedProps: [..._gestureHandlerCommon.baseGestureHandlerProps, ...longPressGestureHandlerProps],
  config: {
    shouldCancelWhenOutside: true
  }
});
//# sourceMappingURL=LongPressGestureHandler.js.map