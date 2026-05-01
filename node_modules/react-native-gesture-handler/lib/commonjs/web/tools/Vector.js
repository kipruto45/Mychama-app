"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _Directions = require("../../Directions");
var _constants = require("../constants");
class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this._magnitude = Math.hypot(this.x, this.y);
    const isMagnitudeSufficient = this._magnitude > _constants.MINIMAL_RECOGNIZABLE_MAGNITUDE;
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
exports.default = Vector;
const DirectionToVectorMappings = new Map([[_Directions.Directions.LEFT, new Vector(-1, 0)], [_Directions.Directions.RIGHT, new Vector(1, 0)], [_Directions.Directions.UP, new Vector(0, -1)], [_Directions.Directions.DOWN, new Vector(0, 1)], [_Directions.DiagonalDirections.UP_RIGHT, new Vector(1, -1)], [_Directions.DiagonalDirections.DOWN_RIGHT, new Vector(1, 1)], [_Directions.DiagonalDirections.UP_LEFT, new Vector(-1, -1)], [_Directions.DiagonalDirections.DOWN_LEFT, new Vector(-1, 1)]]);
//# sourceMappingURL=Vector.js.map