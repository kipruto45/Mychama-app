"use strict";

import { DiagonalDirections, Directions } from '../../Directions';
import { MINIMAL_RECOGNIZABLE_MAGNITUDE } from '../constants';
export default class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this._magnitude = Math.hypot(this.x, this.y);
    const isMagnitudeSufficient = this._magnitude > MINIMAL_RECOGNIZABLE_MAGNITUDE;
    this.unitX = isMagnitudeSufficient ? this.x / this._magnitude : 0;
    this.unitY = isMagnitudeSufficient ? this.y / this._magnitude : 0;
  }
  static fromDirection(direction) {
    return DirectionToVectorMappings.get(direction) ?? new Vector(0, 0);
  }
  static fromVelocity(tracker, pointerId) {
    const velocity = tracker.getVelocity(pointerId);
    return velocity ? new Vector(velocity.x, velocity.y) : null;
  }
  get magnitude() {
    return this._magnitude;
  }
  computeSimilarity(vector) {
    return this.unitX * vector.unitX + this.unitY * vector.unitY;
  }
  isSimilar(vector, threshold) {
    return this.computeSimilarity(vector) > threshold;
  }
}
const DirectionToVectorMappings = new Map([[Directions.LEFT, new Vector(-1, 0)], [Directions.RIGHT, new Vector(1, 0)], [Directions.UP, new Vector(0, -1)], [Directions.DOWN, new Vector(0, 1)], [DiagonalDirections.UP_RIGHT, new Vector(1, -1)], [DiagonalDirections.DOWN_RIGHT, new Vector(1, 1)], [DiagonalDirections.UP_LEFT, new Vector(-1, -1)], [DiagonalDirections.DOWN_LEFT, new Vector(-1, 1)]]);
//# sourceMappingURL=Vector.js.map