"use strict";

import { State } from '../../State';
import { DEFAULT_TOUCH_SLOP } from '../constants';
import GestureHandler from './GestureHandler';
import ScaleGestureDetector from '../detectors/ScaleGestureDetector';
export default class PinchGestureHandler extends GestureHandler {
  scale = 1;
  velocity = 0;
  startingSpan = 0;
  spanSlop = DEFAULT_TOUCH_SLOP;
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
      if (Math.abs(this.startingSpan - detector.currentSpan) >= this.spanSlop && this.state === State.BEGAN) {
        this.activate();
      }
      return true;
    },
    onScaleEnd: _detector => {}
  };
  scaleGestureDetector = new ScaleGestureDetector(this.scaleDetectorListener);
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
    if (this.state !== State.ACTIVE) {
      return;
    }
    this.scaleGestureDetector.onTouchEvent(event, this.tracker);
    if (this.state === State.ACTIVE) {
      this.end();
    } else {
      this.fail();
    }
  }
  onPointerRemove(event) {
    super.onPointerRemove(event);
    this.scaleGestureDetector.onTouchEvent(event, this.tracker);
    this.tracker.removeFromTracker(event.pointerId);
    if (this.state === State.ACTIVE && this.tracker.trackedPointersCount < 2) {
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
    if (this.state !== State.UNDETERMINED) {
      return;
    }
    this.resetProgress();
    this.begin();
  }
  activate(force) {
    if (this.state !== State.ACTIVE) {
      this.resetProgress();
    }
    super.activate(force);
  }
  onReset() {
    this.resetProgress();
  }
  resetProgress() {
    if (this.state === State.ACTIVE) {
      return;
    }
    this.velocity = 0;
    this.scale = 1;
  }
}
//# sourceMappingURL=PinchGestureHandler.js.map