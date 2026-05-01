"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hoverGestureHandlerProps = exports.HoverGesture = exports.HoverEffect = void 0;
var _gesture = require("./gesture");
let HoverEffect = exports.HoverEffect = /*#__PURE__*/function (HoverEffect) {
  HoverEffect[HoverEffect["NONE"] = 0] = "NONE";
  HoverEffect[HoverEffect["LIFT"] = 1] = "LIFT";
  HoverEffect[HoverEffect["HIGHLIGHT"] = 2] = "HIGHLIGHT";
  return HoverEffect;
}({});
const hoverGestureHandlerProps = exports.hoverGestureHandlerProps = ['hoverEffect'];
function changeEventCalculator(current, previous) {
  'worklet';

  let changePayload;
  if (previous === undefined) {
    changePayload = {
      changeX: current.x,
      changeY: current.y
    };
  } else {
    changePayload = {
      changeX: current.x - previous.x,
      changeY: current.y - previous.y
    };
  }
  return {
    ...current,
    ...changePayload
  };
}
class HoverGesture extends _gesture.ContinousBaseGesture {
  config = {};
  constructor() {
    super();
    this.handlerName = 'HoverGestureHandler';
  }

  /**
   * #### iOS only
   * Sets the visual hover effect.
   */
  effect(effect) {
    this.config.hoverEffect = effect;
    return this;
  }
  onChange(callback) {
    // @ts-ignore TS being overprotective, HoverGestureHandlerEventPayload is Record
    this.handlers.changeEventCalculator = changeEventCalculator;
    return super.onChange(callback);
  }
}
exports.HoverGesture = HoverGesture;
//# sourceMappingURL=hoverGesture.js.map