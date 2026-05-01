"use strict";

import { State } from '../../State';
import { DiagonalDirections, Directions } from '../../Directions';
import GestureHandler from './GestureHandler';
import Vector from '../tools/Vector';
import { coneToDeviation } from '../utils';
const DEFAULT_MAX_DURATION_MS = 800;
const DEFAULT_MIN_VELOCITY = 700;
const DEFAULT_ALIGNMENT_CONE = 30;
const DEFAULT_DIRECTION = Directions.RIGHT;
const DEFAULT_NUMBER_OF_TOUCHES_REQUIRED = 1;
const AXIAL_DEVIATION_COSINE = coneToDeviation(DEFAULT_ALIGNMENT_CONE);
const DIAGONAL_DEVIATION_COSINE = coneToDeviation(90 - DEFAULT_ALIGNMENT_CONE);
export default class FlingGestureHandler extends GestureHandler {
  numberOfPointersRequired = DEFAULT_NUMBER_OF_TOUCHES_REQUIRED;
  direction = DEFAULT_DIRECTION;
  maxDurationMs = DEFAULT_MAX_DURATION_MS;
  minVelocity = DEFAULT_MIN_VELOCITY;
  maxNumberOfPointersSimultaneously = 0;
  keyPointer = NaN;
  updateGestureConfig({
    enabled = true,
    ...props
  }) {
    super.updateGestureConfig({
      enabled: enabled,
      ...props
    });
    if (this.config.direction) {
      this.direction = this.config.direction;
    }
    if (this.config.numberOfPointers) {
      this.numberOfPointersRequired = this.config.numberOfPointers;
    }
  }
  startFling() {
    this.begin();
    this.maxNumberOfPointersSimultaneously = 1;
    this.delayTimeout = setTimeout(() => this.fail(), this.maxDurationMs);
  }
  tryEndFling() {
    const velocityVector = Vector.fromVelocity(this.tracker, this.keyPointer);
    if (!velocityVector) {
      return false;
    }
    const getAlignment = (direction, minimalAlignmentCosine) => {
      return (direction & this.direction) === direction && velocityVector.isSimilar(Vector.fromDirection(direction), minimalAlignmentCosine);
    };
    const axialDirectionsList = Object.values(Directions);
    const diagonalDirectionsList = Object.values(DiagonalDirections);

    // List of alignments to all activated directions
    const axialAlignmentList = axialDirectionsList.map(direction => getAlignment(direction, AXIAL_DEVIATION_COSINE));
    const diagonalAlignmentList = diagonalDirectionsList.map(direction => getAlignment(direction, DIAGONAL_DEVIATION_COSINE));
    const isAligned = axialAlignmentList.some(Boolean) || diagonalAlignmentList.some(Boolean);
    const isFast = velocityVector.magnitude > this.minVelocity;
    if (this.maxNumberOfPointersSimultaneously === this.numberOfPointersRequired && isAligned && isFast) {
      clearTimeout(this.delayTimeout);
      this.activate();
      return true;
    }
    return false;
  }
  endFling() {
    if (!this.tryEndFling()) {
      this.fail();
    }
  }
  onPointerDown(event) {
    if (!this.isButtonInConfig(event.button)) {
      return;
    }
    this.tracker.addToTracker(event);
    this.keyPointer = event.pointerId;
    super.onPointerDown(event);
    this.newPointerAction();
    this.tryToSendTouchEvent(event);
  }
  onPointerAdd(event) {
    this.tracker.addToTracker(event);
    super.onPointerAdd(event);
    this.newPointerAction();
  }
  newPointerAction() {
    if (this.state === State.UNDETERMINED) {
      this.startFling();
    }
    if (this.state !== State.BEGAN) {
      return;
    }
    this.tryEndFling();
    if (this.tracker.trackedPointersCount > this.maxNumberOfPointersSimultaneously) {
      this.maxNumberOfPointersSimultaneously = this.tracker.trackedPointersCount;
    }
  }
  pointerMoveAction(event) {
    this.tracker.track(event);
    if (this.state !== State.BEGAN) {
      return;
    }
    this.tryEndFling();
  }
  onPointerMove(event) {
    this.pointerMoveAction(event);
    super.onPointerMove(event);
  }
  onPointerOutOfBounds(event) {
    this.pointerMoveAction(event);
    super.onPointerOutOfBounds(event);
  }
  onPointerUp(event) {
    super.onPointerUp(event);
    this.onUp(event);
    this.keyPointer = NaN;
  }
  onPointerRemove(event) {
    super.onPointerRemove(event);
    this.onUp(event);
  }
  onUp(event) {
    if (this.state === State.BEGAN) {
      this.endFling();
    }
    this.tracker.removeFromTracker(event.pointerId);
  }
  activate(force) {
    super.activate(force);
    this.end();
  }
  resetConfig() {
    super.resetConfig();
    this.numberOfPointersRequired = DEFAULT_NUMBER_OF_TOUCHES_REQUIRED;
    this.direction = DEFAULT_DIRECTION;
  }
}
//# sourceMappingURL=FlingGestureHandler.js.map