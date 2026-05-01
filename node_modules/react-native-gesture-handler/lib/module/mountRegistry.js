"use strict";

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class MountRegistry {
  static mountListeners = new Set();
  static unmountListeners = new Set();
  static addMountListener(listener) {
    this.mountListeners.add(listener);
    return () => {
      this.mountListeners.delete(listener);
    };
  }
  static addUnmountListener(listener) {
    this.unmountListeners.add(listener);
    return () => {
      this.unmountListeners.delete(listener);
    };
  }
  static gestureHandlerWillMount(handler) {
    this.mountListeners.forEach(listener => listener(handler));
  }
  static gestureHandlerWillUnmount(handler) {
    this.unmountListeners.forEach(listener => listener(handler));
  }
  static gestureWillMount(gesture) {
    this.mountListeners.forEach(listener => listener(gesture));
  }
  static gestureWillUnmount(gesture) {
    this.unmountListeners.forEach(listener => listener(gesture));
  }
}
//# sourceMappingURL=mountRegistry.js.map