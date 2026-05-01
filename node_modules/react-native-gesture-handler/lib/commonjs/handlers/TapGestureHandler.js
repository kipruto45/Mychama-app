"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.tapHandlerName = exports.tapGestureHandlerProps = exports.TapGestureHandler = void 0;
var _createHandler = _interopRequireDefault(require("./createHandler"));
var _gestureHandlerCommon = require("./gestureHandlerCommon");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const tapGestureHandlerProps = exports.tapGestureHandlerProps = ['maxDurationMs', 'maxDelayMs', 'numberOfTaps', 'maxDeltaX', 'maxDeltaY', 'maxDist', 'minPointers'];

/**
 * @deprecated TapGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Tap()` instead.
 */

const tapHandlerName = exports.tapHandlerName = 'TapGestureHandler';

/**
 * @deprecated TapGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Tap()` instead.
 */

/**
 * @deprecated TapGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Tap()` instead.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- backward compatibility; see description on the top of gestureHandlerCommon.ts file
const TapGestureHandler = exports.TapGestureHandler = (0, _createHandler.default)({
  name: tapHandlerName,
  allowedProps: [..._gestureHandlerCommon.baseGestureHandlerProps, ...tapGestureHandlerProps],
  config: {
    shouldCancelWhenOutside: true
  }
});
//# sourceMappingURL=TapGestureHandler.js.map