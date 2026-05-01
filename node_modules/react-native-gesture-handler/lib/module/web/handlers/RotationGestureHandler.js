"use strict";

import { State } from '../../State';
import GestureHandler from './GestureHandler';
import RotationGestureDetector from '../detectors/RotationGestureDetector';
const ROTATION_RECOGNITION_THRESHOLD = Math.PI / 36;
export default class RotationGestureHandler extends GestureHandler {
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
      if (Math.abs(this.rotation) >= ROTATION_RECOGNITION_THRESHOLD && this.state === State.BEGAN) {
        this.activate();
      }
      return true;
    },
    onRotationEnd: _detector => {
      this.end();
    }
  };
  rotationGestureDetector = new RotationGestureDetector(this.rotationGestureListener);
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
    if (this.state !== State.ACTIVE) {
      return;
    }
    if (this.state === State.ACTIVE) {
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
    if (this.state !== State.UNDETERMINED) {
      return;
    }
    this.begin();
  }
  onReset() {
    if (this.state === State.ACTIVE) {
      return;
    }
    this.rotation = 0;
    this.velocity = 0;
    this.rotationGestureDetector.reset();
  }
}
//# sourceMappingURL=RotationGestureHandler.js.map