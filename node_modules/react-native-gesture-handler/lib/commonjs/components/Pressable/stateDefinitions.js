"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StateMachineEvent = void 0;
exports.getStatesConfig = getStatesConfig;
var _reactNative = require("react-native");
let StateMachineEvent = exports.StateMachineEvent = /*#__PURE__*/function (StateMachineEvent) {
  StateMachineEvent["NATIVE_BEGIN"] = "nativeBegin";
  StateMachineEvent["NATIVE_START"] = "nativeStart";
  StateMachineEvent["FINALIZE"] = "finalize";
  StateMachineEvent["LONG_PRESS_TOUCHES_DOWN"] = "longPressTouchesDown";
  return StateMachineEvent;
}({});
function getAndroidStatesConfig(handlePressIn, handlePressOut) {
  return [{
    eventName: StateMachineEvent.NATIVE_BEGIN
  }, {
    eventName: StateMachineEvent.LONG_PRESS_TOUCHES_DOWN,
    callback: handlePressIn
  }, {
    eventName: StateMachineEvent.FINALIZE,
    callback: handlePressOut
  }];
}
function getIosStatesConfig(handlePressIn, handlePressOut) {
  return [{
    eventName: StateMachineEvent.LONG_PRESS_TOUCHES_DOWN
  }, {
    eventName: StateMachineEvent.NATIVE_START,
    callback: handlePressIn
  }, {
    eventName: StateMachineEvent.FINALIZE,
    callback: handlePressOut
  }];
}
function getWebStatesConfig(handlePressIn, handlePressOut) {
  return [{
    eventName: StateMachineEvent.NATIVE_BEGIN
  }, {
    eventName: StateMachineEvent.NATIVE_START
  }, {
    eventName: StateMachineEvent.LONG_PRESS_TOUCHES_DOWN,
    callback: handlePressIn
  }, {
    eventName: StateMachineEvent.FINALIZE,
    callback: handlePressOut
  }];
}
function getMacosStatesConfig(handlePressIn, handlePressOut) {
  return [{
    eventName: StateMachineEvent.LONG_PRESS_TOUCHES_DOWN
  }, {
    eventName: StateMachineEvent.NATIVE_BEGIN,
    callback: handlePressIn
  }, {
    eventName: StateMachineEvent.NATIVE_START
  }, {
    eventName: StateMachineEvent.FINALIZE,
    callback: handlePressOut
  }];
}
function getUniversalStatesConfig(handlePressIn, handlePressOut) {
  return [{
    eventName: StateMachineEvent.FINALIZE,
    callback: event => {
      handlePressIn(event);
      handlePressOut(event);
    }
  }];
}
function getStatesConfig(handlePressIn, handlePressOut) {
  if (_reactNative.Platform.OS === 'android') {
    return getAndroidStatesConfig(handlePressIn, handlePressOut);
  } else if (_reactNative.Platform.OS === 'ios') {
    return getIosStatesConfig(handlePressIn, handlePressOut);
  } else if (_reactNative.Platform.OS === 'web') {
    return getWebStatesConfig(handlePressIn, handlePressOut);
  } else if (_reactNative.Platform.OS === 'macos') {
    return getMacosStatesConfig(handlePressIn, handlePressOut);
  } else {
    // Unknown platform - using minimal universal setup.
    return getUniversalStatesConfig(handlePressIn, handlePressOut);
  }
}
//# sourceMappingURL=stateDefinitions.js.map