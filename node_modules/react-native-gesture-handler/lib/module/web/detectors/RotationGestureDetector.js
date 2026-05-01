"use strict";

import { EventTypes } from '../interfaces';
export default class RotationGestureDetector {
  currentTime = 0;
  previousTime = 0;
  previousAngle = 0;
  _rotation = 0;
  _anchorX = 0;
  _anchorY = 0;
  isInProgress = false;
  keyPointers = [NaN, NaN];
  constructor(callbacks) {
    this.onRotationBegin = callbacks.onRotationBegin;
    this.onRotation = callbacks.onRotation;
    this.onRotationEnd = callbacks.onRotationEnd;
  }
  updateCurrent(event, tracker) {
    this.previousTime = this.currentTime;
    this.currentTime = event.time;
    const [firstPointerID, secondPointerID] = this.keyPointers;
    const firstPointerCoords = tracker.getLastAbsoluteCoords(firstPointerID);
    const secondPointerCoords = tracker.getLastAbsoluteCoords(secondPointerID);
    if (!firstPointerCoords || !secondPointerCoords) {
      return;
    }
    const vectorX = secondPointerCoords.x - firstPointerCoords.x;
    const vectorY = secondPointerCoords.y - firstPointerCoords.y;
    this._anchorX = (firstPointerCoords.x + secondPointerCoords.x) / 2;
    this._anchorY = (firstPointerCoords.y + secondPointerCoords.y) / 2;

    // Angle diff should be positive when rotating in clockwise direction
    const angle = -Math.atan2(vectorY, vectorX);
    this._rotation = Number.isNaN(this.previousAngle) ? 0 : this.previousAngle - angle;
    this.previousAngle = angle;
    if (this.rotation > Math.PI) {
      this._rotation -= Math.PI;
    } else if (this.rotation < -Math.PI) {
      this._rotation += Math.PI;
    }
    if (this.rotation > Math.PI / 2) {
      this._rotation -= Math.PI;
    } else if (this.rotation < -Math.PI / 2) {
      this._rotation += Math.PI;
    }
  }
  finish() {
    if (!this.isInProgress) {
      return;
    }
    this.isInProgress = false;
    this.keyPointers = [NaN, NaN];
    this.onRotationEnd(this);
  }
  setKeyPointers(tracker) {
    if (this.keyPointers[0] && this.keyPointers[1]) {
      return;
    }
    const pointerIDs = tracker.trackedPointers.keys();
    this.keyPointers[0] = pointerIDs.next().value;
    this.keyPointers[1] = pointerIDs.next().value;
  }
  onTouchEvent(event, tracker) {
    switch (event.eventType) {
      case EventTypes.DOWN:
        this.isInProgress = false;
        break;
      case EventTypes.ADDITIONAL_POINTER_DOWN:
        if (this.isInProgress) {
          break;
        }
        this.isInProgress = true;
        this.previousTime = event.time;
        this.previousAngle = NaN;
        this.setKeyPointers(tracker);
        this.updateCurrent(event, tracker);
        this.onRotationBegin(this);
        break;
      case EventTypes.MOVE:
        if (!this.isInProgress) {
          break;
        }
        this.updateCurrent(event, tracker);
        this.onRotation(this);
        break;
      case EventTypes.ADDITIONAL_POINTER_UP:
        if (!this.isInProgress) {
          break;
        }
        if (this.keyPointers.indexOf(event.pointerId) >= 0) {
          this.finish();
        }
        break;
      case EventTypes.UP:
        if (this.isInProgress) {
          this.finish();
        }
        break;
    }
    return true;
  }
  reset() {
    this.keyPointers = [NaN, NaN];
    this.isInProgress = false;
  }
  get anchorX() {
    return this._anchorX;
  }
  get anchorY() {
    return this._anchorY;
  }
  get rotation() {
    return this._rotation;
  }
  get timeDelta() {
    return this.currentTime + this.previousTime;
  }
}
//# sourceMappingURL=RotationGestureDetector.js.map