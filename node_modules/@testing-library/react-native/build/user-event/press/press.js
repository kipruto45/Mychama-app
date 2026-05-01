"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DEFAULT_MIN_PRESS_DURATION = exports.DEFAULT_LONG_PRESS_DELAY_MS = void 0;
exports.longPress = longPress;
exports.press = press;
var _act = _interopRequireDefault(require("../../act"));
var _eventHandler = require("../../event-handler");
var _componentTree = require("../../helpers/component-tree");
var _errors = require("../../helpers/errors");
var _hostComponentNames = require("../../helpers/host-component-names");
var _pointerEvents = require("../../helpers/pointer-events");
var _eventBuilder = require("../event-builder");
var _utils = require("../utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// These are constants defined in the React Native repo
// See: https://github.com/facebook/react-native/blob/50e38cc9f1e6713228a91ad50f426c4f65e65e1a/packages/react-native/Libraries/Pressability/Pressability.js#L264
const DEFAULT_MIN_PRESS_DURATION = exports.DEFAULT_MIN_PRESS_DURATION = 130;
const DEFAULT_LONG_PRESS_DELAY_MS = exports.DEFAULT_LONG_PRESS_DELAY_MS = 500;
async function press(element) {
  if (!(0, _componentTree.isHostElement)(element)) {
    throw new _errors.ErrorWithStack(`press() works only with host elements. Passed element has type "${element.type}".`, press);
  }
  await basePress(this.config, element, {
    type: 'press'
  });
}
async function longPress(element, options) {
  if (!(0, _componentTree.isHostElement)(element)) {
    throw new _errors.ErrorWithStack(`longPress() works only with host elements. Passed element has type "${element.type}".`, longPress);
  }
  await basePress(this.config, element, {
    type: 'longPress',
    duration: options?.duration ?? DEFAULT_LONG_PRESS_DELAY_MS
  });
}
const basePress = async (config, element, options) => {
  if (isEnabledHostElement(element) && hasPressEventHandler(element)) {
    await emitDirectPressEvents(config, element, options);
    return;
  }
  if (isEnabledTouchResponder(element)) {
    await emitPressabilityPressEvents(config, element, options);
    return;
  }
  const hostParentElement = (0, _componentTree.getHostParent)(element);
  if (!hostParentElement) {
    return;
  }
  await basePress(config, hostParentElement, options);
};
function isEnabledHostElement(element) {
  if (!(0, _pointerEvents.isPointerEventEnabled)(element)) {
    return false;
  }
  if ((0, _hostComponentNames.isHostText)(element)) {
    return element.props.disabled !== true;
  }
  if ((0, _hostComponentNames.isHostTextInput)(element)) {
    // @ts-expect-error - workaround incorrect ReactTestInstance type
    return element.props.editable !== false;
  }
  return true;
}
function isEnabledTouchResponder(element) {
  return (0, _pointerEvents.isPointerEventEnabled)(element) && element.props.onStartShouldSetResponder?.();
}
function hasPressEventHandler(element) {
  return (0, _eventHandler.getEventHandler)(element, 'press') || (0, _eventHandler.getEventHandler)(element, 'longPress') || (0, _eventHandler.getEventHandler)(element, 'pressIn') || (0, _eventHandler.getEventHandler)(element, 'pressOut');
}

/**
 * Dispatches a press event sequence for host elements that have `onPress*` event handlers.
 */
async function emitDirectPressEvents(config, element, options) {
  await (0, _utils.wait)(config);
  await (0, _utils.dispatchEvent)(element, 'pressIn', _eventBuilder.EventBuilder.Common.touch());
  await (0, _utils.wait)(config, options.duration);

  // Long press events are emitted before `pressOut`.
  if (options.type === 'longPress') {
    await (0, _utils.dispatchEvent)(element, 'longPress', _eventBuilder.EventBuilder.Common.touch());
  }
  await (0, _utils.dispatchEvent)(element, 'pressOut', _eventBuilder.EventBuilder.Common.touch());

  // Regular press events are emitted after `pressOut` according to the React Native docs.
  // See: https://reactnative.dev/docs/pressable#onpress
  // Experimentally for very short presses (< 130ms) `press` events are actually emitted before `onPressOut`, but
  // we will ignore that as in reality most pressed would be above the 130ms threshold.
  if (options.type === 'press') {
    await (0, _utils.dispatchEvent)(element, 'press', _eventBuilder.EventBuilder.Common.touch());
  }
}
async function emitPressabilityPressEvents(config, element, options) {
  await (0, _utils.wait)(config);
  await (0, _utils.dispatchEvent)(element, 'responderGrant', _eventBuilder.EventBuilder.Common.responderGrant());
  const duration = options.duration ?? DEFAULT_MIN_PRESS_DURATION;
  await (0, _utils.wait)(config, duration);
  await (0, _utils.dispatchEvent)(element, 'responderRelease', _eventBuilder.EventBuilder.Common.responderRelease());

  // React Native will wait for minimal delay of DEFAULT_MIN_PRESS_DURATION
  // before emitting the `pressOut` event. We need to wait here, so that
  // `press()` function does not return before that.
  if (DEFAULT_MIN_PRESS_DURATION - duration > 0) {
    await (0, _act.default)(() => (0, _utils.wait)(config, DEFAULT_MIN_PRESS_DURATION - duration));
  }
}
//# sourceMappingURL=press.js.map