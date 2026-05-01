"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
class CircularBuffer {
  constructor(size) {
    this.capacity = size;
    this.buffer = new Array(size);
    this.index = 0;
    this._size = 0;
  }
  push(element) {
    this.buffer[this.index] = element;
    this.index = (this.index + 1) % this.capacity;
    this._size = Math.min(this.size + 1, this.capacity);
  }
  get(at) {
    if (this._size === this.capacity) {
      let index = (this.index + at) % this.capacity;
      if (index < 0) {
        index += this.capacity;
      }
      return this.buffer[index];
    } else {
      return this.buffer[at];
    }
  }
  clear() {
    this.buffer = new Array(this.capacity);
    this.index = 0;
    this._size = 0;
  }
  get size() {
    return this._size;
  }
}
exports.default = CircularBuffer;
//# sourceMappingURL=CircularBuffer.js.map