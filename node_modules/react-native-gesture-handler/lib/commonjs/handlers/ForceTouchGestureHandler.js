"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.forceTouchHandlerName = exports.forceTouchGestureHandlerProps = exports.ForceTouchGestureHandler = void 0;
var _react = _interopRequireDefault(require("react"));
var _utils = require("../utils");
var _PlatformConstants = _interopRequireDefault(require("../PlatformConstants"));
var _createHandler = _interopRequireDefault(require("./createHandler"));
var _gestureHandlerCommon = require("./gestureHandlerCommon");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const forceTouchGestureHandlerProps = exports.forceTouchGestureHandlerProps = ['minForce', 'maxForce', 'feedbackOnActivation'];

// implicit `children` prop has been removed in @types/react^18.0.0
class ForceTouchFallback extends _react.default.Component {
  static forceTouchAvailable = false;
  componentDidMount() {
    console.warn((0, _utils.tagMessage)('ForceTouchGestureHandler is not available on this platform. Please use ForceTouchGestureHandler.forceTouchAvailable to conditionally render other components that would provide a fallback behavior specific to your usecase'));
  }
  render() {
    return this.props.children;
  }
}

/**
 * @deprecated ForceTouchGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.ForceTouch()` instead.
 */

/**
 * @deprecated ForceTouchGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.ForceTouch()` instead.
 */

const forceTouchHandlerName = exports.forceTouchHandlerName = 'ForceTouchGestureHandler';

/**
 * @deprecated ForceTouchGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.ForceTouch()` instead.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- backward compatibility; see description on the top of gestureHandlerCommon.ts file
const ForceTouchGestureHandler = exports.ForceTouchGestureHandler = _PlatformConstants.default?.forceTouchAvailable ? (0, _createHandler.default)({
  name: forceTouchHandlerName,
  allowedProps: [..._gestureHandlerCommon.baseGestureHandlerProps, ...forceTouchGestureHandlerProps],
  config: {}
}) : ForceTouchFallback;
ForceTouchGestureHandler.forceTouchAvailable = _PlatformConstants.default?.forceTouchAvailable || false;
//# sourceMappingURL=ForceTouchGestureHandler.js.map