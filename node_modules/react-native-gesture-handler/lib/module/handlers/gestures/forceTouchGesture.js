"use strict";

import { ContinousBaseGesture } from './gesture';

/**
 * @deprecated ForceTouch gesture is deprecated and will be removed in the future.
 */

function changeEventCalculator(current, previous) {
  'worklet';

  let changePayload;
  if (previous === undefined) {
    changePayload = {
      forceChange: current.force
    };
  } else {
    changePayload = {
      forceChange: current.force - previous.force
    };
  }
  return {
    ...current,
    ...changePayload
  };
}

/**
 * @deprecated ForceTouch gesture is deprecated and will be removed in the future.
 */
export class ForceTouchGesture extends ContinousBaseGesture {
  config = {};
  constructor() {
    super();
    this.handlerName = 'ForceTouchGestureHandler';
  }

  /**
   * A minimal pressure that is required before gesture can activate.
   * Should be a value from range [0.0, 1.0]. Default is 0.2.
   * @param force
   */
  minForce(force) {
    this.config.minForce = force;
    return this;
  }

  /**
   * A maximal pressure that could be applied for gesture.
   * If the pressure is greater, gesture fails. Should be a value from range [0.0, 1.0].
   * @param force
   */
  maxForce(force) {
    this.config.maxForce = force;
    return this;
  }

  /**
   * Value defining if haptic feedback has to be performed on activation.
   * @param value
   */
  feedbackOnActivation(value) {
    this.config.feedbackOnActivation = value;
    return this;
  }
  onChange(callback) {
    // @ts-ignore TS being overprotective, ForceTouchGestureHandlerEventPayload is Record
    this.handlers.changeEventCalculator = changeEventCalculator;
    return super.onChange(callback);
  }
}

/**
 * @deprecated ForceTouch gesture is deprecated and will be removed in the future.
 */
//# sourceMappingURL=forceTouchGesture.js.map