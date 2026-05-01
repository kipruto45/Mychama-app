"use strict";

import { EventTypes } from '../interfaces';
import EventManager from './EventManager';
import { PointerType } from '../../PointerType';
export default class KeyboardEventManager extends EventManager {
  static activationKeys = ['Enter', ' '];
  static cancelationKeys = ['Tab'];
  isPressed = false;
  static registeredStaticListeners = false;
  static instances = new Set();
  static keyUpStaticCallback = event => {
    // We need a global listener, as in some cases, keyUp event gets stop-propagated.
    // Then, if we used only component-level listeners the gesture would never end,
    // causing other gestues to fail.

    if (this.activationKeys.indexOf(event.key) === -1) {
      return;
    }
    this.instances.forEach(item => {
      item.onKeyUp(event);
    });
  };
  keyDownCallback = event => {
    if (KeyboardEventManager.cancelationKeys.indexOf(event.key) !== -1 && this.isPressed) {
      this.dispatchEvent(event, EventTypes.CANCEL);
      return;
    }
    if (KeyboardEventManager.activationKeys.indexOf(event.key) === -1) {
      return;
    }
    this.dispatchEvent(event, EventTypes.DOWN);
  };
  onKeyUp = event => {
    if (KeyboardEventManager.activationKeys.indexOf(event.key) === -1 || !this.isPressed) {
      return;
    }
    this.dispatchEvent(event, EventTypes.UP);
  };
  dispatchEvent(event, eventType) {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }
    const adaptedEvent = this.mapEvent(event, eventType);
    switch (eventType) {
      case EventTypes.UP:
        this.isPressed = false;
        this.onPointerUp(adaptedEvent);
        break;
      case EventTypes.DOWN:
        this.isPressed = true;
        this.onPointerDown(adaptedEvent);
        break;
      case EventTypes.CANCEL:
        this.isPressed = false;
        this.onPointerCancel(adaptedEvent);
        break;
    }
  }
  registerListeners() {
    this.view.addEventListener('keydown', this.keyDownCallback);
    KeyboardEventManager.instances.add(this);
    if (!KeyboardEventManager.registeredStaticListeners) {
      KeyboardEventManager.registeredStaticListeners = true;
      document.addEventListener('keyup', KeyboardEventManager.keyUpStaticCallback, {
        capture: true
      });
    }
  }
  unregisterListeners() {
    this.view.removeEventListener('keydown', this.keyDownCallback);
    KeyboardEventManager.instances.delete(this);
    if (KeyboardEventManager.instances.size === 0) {
      document.removeEventListener('keyup', KeyboardEventManager.keyUpStaticCallback, {
        capture: true
      });
      KeyboardEventManager.registeredStaticListeners = false;
    }
  }
  mapEvent(event, eventType) {
    const viewRect = event.target.getBoundingClientRect();
    const viewportPosition = {
      x: viewRect?.x + viewRect?.width / 2,
      y: viewRect?.y + viewRect?.height / 2
    };
    const relativePosition = {
      x: viewRect?.width / 2,
      y: viewRect?.height / 2
    };
    return {
      x: viewportPosition.x,
      y: viewportPosition.y,
      offsetX: relativePosition.x,
      offsetY: relativePosition.y,
      pointerId: 0,
      eventType: eventType,
      pointerType: PointerType.KEY,
      time: event.timeStamp
    };
  }
}
//# sourceMappingURL=KeyboardEventManager.js.map