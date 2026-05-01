"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.onGestureHandlerEvent = onGestureHandlerEvent;
exports.startListening = startListening;
exports.stopListening = stopListening;
var _reactNative = require("react-native");
var _State = require("../../State");
var _TouchEventType = require("../../TouchEventType");
var _handlersRegistry = require("../handlersRegistry");
var _gestureStateManager = require("./gestureStateManager");
let gestureHandlerEventSubscription = null;
let gestureHandlerStateChangeEventSubscription = null;
const gestureStateManagers = new Map();
const lastUpdateEvent = [];
function isStateChangeEvent(event) {
  // @ts-ignore oldState doesn't exist on GestureTouchEvent and that's the point
  return event.oldState != null;
}
function isTouchEvent(event) {
  return event.eventType != null;
}
function onGestureHandlerEvent(event) {
  const handler = (0, _handlersRegistry.findHandler)(event.handlerTag);
  if (handler) {
    if (isStateChangeEvent(event)) {
      if (event.oldState === _State.State.UNDETERMINED && event.state === _State.State.BEGAN) {
        handler.handlers.onBegin?.(event);
      } else if ((event.oldState === _State.State.BEGAN || event.oldState === _State.State.UNDETERMINED) && event.state === _State.State.ACTIVE) {
        handler.handlers.onStart?.(event);
        lastUpdateEvent[handler.handlers.handlerTag] = event;
      } else if (event.oldState !== event.state && event.state === _State.State.END) {
        if (event.oldState === _State.State.ACTIVE) {
          handler.handlers.onEnd?.(event, true);
        }
        handler.handlers.onFinalize?.(event, true);
        lastUpdateEvent[handler.handlers.handlerTag] = undefined;
      } else if ((event.state === _State.State.FAILED || event.state === _State.State.CANCELLED) && event.oldState !== event.state) {
        if (event.oldState === _State.State.ACTIVE) {
          handler.handlers.onEnd?.(event, false);
        }
        handler.handlers.onFinalize?.(event, false);
        gestureStateManagers.delete(event.handlerTag);
        lastUpdateEvent[handler.handlers.handlerTag] = undefined;
      }
    } else if (isTouchEvent(event)) {
      if (!gestureStateManagers.has(event.handlerTag)) {
        gestureStateManagers.set(event.handlerTag, _gestureStateManager.GestureStateManager.create(event.handlerTag));
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const manager = gestureStateManagers.get(event.handlerTag);
      switch (event.eventType) {
        case _TouchEventType.TouchEventType.TOUCHES_DOWN:
          handler.handlers?.onTouchesDown?.(event, manager);
          break;
        case _TouchEventType.TouchEventType.TOUCHES_MOVE:
          handler.handlers?.onTouchesMove?.(event, manager);
          break;
        case _TouchEventType.TouchEventType.TOUCHES_UP:
          handler.handlers?.onTouchesUp?.(event, manager);
          break;
        case _TouchEventType.TouchEventType.TOUCHES_CANCELLED:
          handler.handlers?.onTouchesCancelled?.(event, manager);
          break;
      }
    } else {
      handler.handlers.onUpdate?.(event);
      if (handler.handlers.onChange && handler.handlers.changeEventCalculator) {
        handler.handlers.onChange?.(handler.handlers.changeEventCalculator?.(event, lastUpdateEvent[handler.handlers.handlerTag]));
        lastUpdateEvent[handler.handlers.handlerTag] = event;
      }
    }
  } else {
    const oldHandler = (0, _handlersRegistry.findOldGestureHandler)(event.handlerTag);
    if (oldHandler) {
      const nativeEvent = {
        nativeEvent: event
      };
      if (isStateChangeEvent(event)) {
        oldHandler.onGestureStateChange(nativeEvent);
      } else {
        oldHandler.onGestureEvent(nativeEvent);
      }
      return;
    }
  }
}
function startListening() {
  stopListening();
  gestureHandlerEventSubscription = _reactNative.DeviceEventEmitter.addListener('onGestureHandlerEvent', onGestureHandlerEvent);
  gestureHandlerStateChangeEventSubscription = _reactNative.DeviceEventEmitter.addListener('onGestureHandlerStateChange', onGestureHandlerEvent);
}
function stopListening() {
  if (gestureHandlerEventSubscription) {
    gestureHandlerEventSubscription.remove();
    gestureHandlerEventSubscription = null;
  }
  if (gestureHandlerStateChangeEventSubscription) {
    gestureHandlerStateChangeEventSubscription.remove();
    gestureHandlerStateChangeEventSubscription = null;
  }
}
//# sourceMappingURL=eventReceiver.js.map