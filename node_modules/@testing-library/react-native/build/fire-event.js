"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.fireEventAsync = fireEventAsync;
exports.isEventEnabled = isEventEnabled;
exports.isTouchResponder = isTouchResponder;
var _act = _interopRequireDefault(require("./act"));
var _eventHandler = require("./event-handler");
var _componentTree = require("./helpers/component-tree");
var _hostComponentNames = require("./helpers/host-component-names");
var _pointerEvents = require("./helpers/pointer-events");
var _textInput = require("./helpers/text-input");
var _nativeState = require("./native-state");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function isTouchResponder(element) {
  if (!(0, _componentTree.isHostElement)(element)) {
    return false;
  }
  return Boolean(element.props.onStartShouldSetResponder) || (0, _hostComponentNames.isHostTextInput)(element);
}

/**
 * List of events affected by `pointerEvents` prop.
 *
 * Note: `fireEvent` is accepting both `press` and `onPress` for event names,
 * so we need cover both forms.
 */
const eventsAffectedByPointerEventsProp = new Set(['press', 'onPress']);

/**
 * List of `TextInput` events not affected by `editable` prop.
 *
 * Note: `fireEvent` is accepting both `press` and `onPress` for event names,
 * so we need cover both forms.
 */
const textInputEventsIgnoringEditableProp = new Set(['contentSizeChange', 'onContentSizeChange', 'layout', 'onLayout', 'scroll', 'onScroll']);
function isEventEnabled(element, eventName, nearestTouchResponder) {
  if (nearestTouchResponder != null && (0, _hostComponentNames.isHostTextInput)(nearestTouchResponder)) {
    return (0, _textInput.isEditableTextInput)(nearestTouchResponder) || textInputEventsIgnoringEditableProp.has(eventName);
  }
  if (eventsAffectedByPointerEventsProp.has(eventName) && !(0, _pointerEvents.isPointerEventEnabled)(element)) {
    return false;
  }
  const touchStart = nearestTouchResponder?.props.onStartShouldSetResponder?.();
  const touchMove = nearestTouchResponder?.props.onMoveShouldSetResponder?.();
  if (touchStart || touchMove) {
    return true;
  }
  return touchStart === undefined && touchMove === undefined;
}
function findEventHandler(element, eventName, nearestTouchResponder) {
  const touchResponder = isTouchResponder(element) ? element : nearestTouchResponder;
  const handler = (0, _eventHandler.getEventHandler)(element, eventName, {
    loose: true
  });
  if (handler && isEventEnabled(element, eventName, touchResponder)) {
    return handler;
  }
  if (element.parent === null) {
    return null;
  }
  return findEventHandler(element.parent, eventName, touchResponder);
}

// String union type of keys of T that start with on, stripped of 'on'

function fireEvent(element, eventName, ...data) {
  if (!(0, _componentTree.isElementMounted)(element)) {
    return;
  }
  setNativeStateIfNeeded(element, eventName, data[0]);
  const handler = findEventHandler(element, eventName);
  if (!handler) {
    return;
  }
  let returnValue;
  void (0, _act.default)(() => {
    returnValue = handler(...data);
  });
  return returnValue;
}
fireEvent.press = (element, ...data) => fireEvent(element, 'press', ...data);
fireEvent.changeText = (element, ...data) => fireEvent(element, 'changeText', ...data);
fireEvent.scroll = (element, ...data) => fireEvent(element, 'scroll', ...data);
async function fireEventAsync(element, eventName, ...data) {
  if (!(0, _componentTree.isElementMounted)(element)) {
    return;
  }
  setNativeStateIfNeeded(element, eventName, data[0]);
  const handler = findEventHandler(element, eventName);
  if (!handler) {
    return;
  }
  let returnValue;
  // eslint-disable-next-line require-await
  await (0, _act.default)(async () => {
    returnValue = handler(...data);
  });
  return returnValue;
}
fireEventAsync.press = async (element, ...data) => await fireEventAsync(element, 'press', ...data);
fireEventAsync.changeText = async (element, ...data) => await fireEventAsync(element, 'changeText', ...data);
fireEventAsync.scroll = async (element, ...data) => await fireEventAsync(element, 'scroll', ...data);
var _default = exports.default = fireEvent;
const scrollEventNames = new Set(['scroll', 'scrollBeginDrag', 'scrollEndDrag', 'momentumScrollBegin', 'momentumScrollEnd']);
function setNativeStateIfNeeded(element, eventName, value) {
  if (eventName === 'changeText' && typeof value === 'string' && (0, _textInput.isEditableTextInput)(element)) {
    _nativeState.nativeState.valueForElement.set(element, value);
  }
  if (scrollEventNames.has(eventName) && (0, _hostComponentNames.isHostScrollView)(element)) {
    const contentOffset = tryGetContentOffset(value);
    if (contentOffset) {
      _nativeState.nativeState.contentOffsetForElement.set(element, contentOffset);
    }
  }
}
function tryGetContentOffset(event) {
  try {
    // @ts-expect-error: try to extract contentOffset from the event value
    const contentOffset = event?.nativeEvent?.contentOffset;
    const x = contentOffset?.x;
    const y = contentOffset?.y;
    if (typeof x === 'number' || typeof y === 'number') {
      return {
        x: Number.isFinite(x) ? x : 0,
        y: Number.isFinite(y) ? y : 0
      };
    }
  } catch {
    // Do nothing
  }
  return null;
}
//# sourceMappingURL=fire-event.js.map