"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _State = require("../../State");
var _GestureHandler = _interopRequireDefault(require("./GestureHandler"));
var _RotationGestureDetector = _interopRequireDefault(require("../detectors/RotationGestureDetector"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const ROTATION_RECOGNITION_THRESHOLD = Math.PI / 36;
class RotationGestureHandler extends _GestureHandler.default {
  rotation = 0;
  velocity = 0;
  cachedAnchorX = 0;
  cachedAnchorY = 0;
  rotationGestureListener = {
    onRotationBegin: _detector => true,
    onRotation: detector => {
      const previousRotation = this.rotation;
      this.rotation += detector.rotation;
      const delta = detector.timeDelta;
      if (delta > 0) {
        this.velocity = (this.rotation - previousRotation) / delta;
      }
      if (Math.abs(this.rotation) >= ROTATION_RECOGNITION_THRESHOLD && this.state === _State.State.BEGAN) {
        this.activate();
      }
      return true;
    },
    onRotationEnd: _detector => {
      this.end();
    }
  };
  rotationGestureDetector = new _RotationGestureDetector.default(this.rotationGestureListener);
  init(ref, propsRef) {
    super.init(ref, propsRef);
    this.shouldCancelWhenOutside = false;
  }
  transformNativeEvent() {
    return {
      rotation: this.rotation ? this.rotation : 0,
      anchorX: this.getAnchorX(),
      anchorY: this.getAnchorY(),
      velocity: this.velocity ? this.velocity : 0
    };
  }
  getAnchorX() {
    const anchorX = this.rotationGestureDetector.anchorX;
    return anchorX ? anchorX : this.cachedAnchorX;
  }
  getAnchorY() {
    const anchorY = this.rotationGestureDetector.anchorY;
    return anchorY ? anchorY : this.cachedAnchorY;
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
    this.rotationGestureDetector.onTouchEvent(event, this.tracker);
  }
  onPointerMove(event) {
    if (this.tracker.trackedPointersCount < 2) {
      return;
    }
    if (this.getAnchorX()) {
      this.cachedAnchorX = this.getAnchorX();
    }
    if (this.getAnchorY()) {
      this.cachedAnchorY = this.getAnchorY();
    }
    this.tracker.track(event);
    this.rotationGestureDetector.onTouchEvent(event, this.tracker);
    super.onPointerMove(event);
  }
  onPointerOutOfBounds(event) {
    if (this.tracker.trackedPointersCount < 2) {
      return;
    }
    if (this.getAnchorX()) {
      this.cachedAnchorX = this.getAnchorX();
    }
    if (this.getAnchorY()) {
      this.cachedAnchorY = this.getAnchorY();
    }
    this.tracker.track(event);
    this.rotationGestureDetector.onTouchEvent(event, this.tracker);
    super.onPointerOutOfBounds(event);
  }
  onPointerUp(event) {
    super.onPointerUp(event);
    this.tracker.removeFromTracker(event.pointerId);
    this.rotationGestureDetector.onTouchEvent(event, this.tracker);
    if (this.state !== _State.State.ACTIVE) {
      return;
    }
    if (this.state === _State.State.ACTIVE) {
      this.end();
    } else {
      this.fail();
    }
  }
  onPointerRemove(event) {
    super.onPointerRemove(event);
    this.rotationGestureDetector.onTouchEvent(event, this.tracker);
    this.tracker.removeFromTracker(event.pointerId);
  }
  tryBegin() {
    if (this.state !== _State.State.UNDETERMINED) {
      return;
    }
    this.begin();
  }
  onReset() {
    if (this.state === _State.State.ACTIVE) {
      return;
    }
    this.rotation = 0;
    this.velocity = 0;
    this.rotationGestureDetector.reset();
  }
}
exports.default = RotationGestureHandler;
//# sourceMappingURL=RotationGestureHandler.js.map