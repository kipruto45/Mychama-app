"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class NodeManager {
  static gestures = {};
  static getHandler(tag) {
    if (tag in this.gestures) {
      return this.gestures[tag];
    }
    throw new Error(`No handler for tag ${tag}`);
  }
  static createGestureHandler(handlerTag, handler) {
    if (handlerTag in this.gestures) {
      throw new Error(`Handler with tag ${handlerTag} already exists. Please ensure that no Gesture instance is used across multiple GestureDetectors.`);
    }
    this.gestures[handlerTag] = handler;
    this.gestures[handlerTag].handlerTag = handlerTag;
  }
  static dropGestureHandler(handlerTag) {
    if (!(handlerTag in this.gestures)) {
      return;
    }
    this.gestures[handlerTag].onDestroy();

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this.gestures[handlerTag];
  }
  static get nodes() {
    return {
      ...this.gestures
    };
  }
}
exports.default = NodeManager;
//# sourceMappingURL=NodeManager.js.map