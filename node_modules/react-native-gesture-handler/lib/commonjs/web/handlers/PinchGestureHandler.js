"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _State = require("../../State");
var _constants = require("../constants");
var _GestureHandler = _interopRequireDefault(require("./GestureHandler"));
var _ScaleGestureDetector = _interopRequireDefault(require("../detectors/ScaleGestureDetector"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class PinchGestureHandler extends _GestureHandler.default {
  scale = 1;
  velocity = 0;
  startingSpan = 0;
  spanSlop = _constants.DEFAULT_TOUCH_SLOP;
  scaleDetectorListener = {
    onScaleBegin: detector => {
      this.startingSpan = detector.currentSpan;
      return true;
    },
    onScale: detector => {
      const prevScaleFactor = this.scale;
      this.scale *= detector.calculateScaleFactor(this.tracker.trackedPointersCount);
      const delta = detector.timeDelta;
      if (delta > 0) {
        this.velocity = (this.scale - prevScaleFactor) / delta;
      }
      if (Math.abs(this.startingSpan - detector.currentSpan) >= this.spanSlop && this.state === _State.State.BEGAN) {
        this.activate();
      }
      return true;
    },
    onScaleEnd: _detector => {}
  };
  scaleGestureDetector = new _ScaleGestureDetector.default(this.scaleDetectorListener);
  init(ref, propsRef) {
    super.init(ref, propsRef);
    this.shouldCancelWhenOutside = false;
  }
  transformNativeEvent() {
    return {
      focalX: this.scaleGestureDetector.focusX,
      focalY: this.scaleGestureDetector.focusY,
      velocity: this.velocity,
      scale: this.scale
    };
  }
  onPointerDown(event) {
    this.tracker.addToTracker(event);
    super.onPointerDown(event);
    this.tryToSendTouchEvent(event);
  }
  onPointerAdd(event) {
    this.tracker.addToTracker(event);
    super.onPointerAdd(event);
    this.tryBegin();
    this.scaleGestureDetector.onTouchEvent(event, this.tracker);
  }
  onPointerUp(event) {
    super.onPointerUp(event);
    this.tracker.removeFromTracker(event.pointerId);
    if (this.state !== _State.State.ACTIVE) {
      return;
    }
    this.scaleGestureDetector.onTouchEvent(event, this.tracker);
    if (this.state === _State.State.ACTIVE) {
      this.end();
    } else {
      this.fail();
    }
  }
  onPointerRemove(event) {
    super.onPointerRemove(event);
    this.scaleGestureDetector.onTouchEvent(event, this.tracker);
    this.tracker.removeFromTracker(event.pointerId);
    if (this.state === _State.State.ACTIVE && this.tracker.trackedPointersCount < 2) {
      this.end();
    }
  }
  onPointerMove(event) {
    if (this.tracker.trackedPointersCount < 2) {
      return;
    }
    this.tracker.track(event);
    this.scaleGestureDetector.onTouchEvent(event, this.tracker);
    super.onPointerMove(event);
  }
  onPointerOutOfBounds(event) {
    if (this.tracker.trackedPointersCount < 2) {
      return;
    }
    this.tracker.track(event);
    this.scaleGestureDetector.onTouchEvent(event, this.tracker);
    super.onPointerOutOfBounds(event);
  }
  tryBegin() {
    if (this.state !== _State.State.UNDETERMINED) {
      return;
    }
    this.resetProgress();
    this.begin();
  }
  activate(force) {
    if (this.state !== _State.State.ACTIVE) {
      this.resetProgress();
    }
    super.activate(force);
  }
  onReset() {
    this.resetProgress();
  }
  resetProgress() {
    if (this.state === _State.State.ACTIVE) {
      return;
    }
    this.velocity = 0;
    this.scale = 1;
  }
}
exports.default = PinchGestureHandler;
//# sourceMappingURL=PinchGestureHandler.js.map