"use strict";

class PressableStateMachine {
  constructor() {
    this.states = null;
    this.currentStepIndex = 0;
    this.eventPayload = null;
  }
  setStates(states) {
    this.states = states;
  }
  reset() {
    this.currentStepIndex = 0;
    this.eventPayload = null;
  }
  handleEvent(eventName, eventPayload) {
    if (!this.states) {
      return;
    }
    const step = this.states[this.currentStepIndex];
    this.eventPayload = eventPayload || this.eventPayload;
    if (step.eventName !== eventName) {
      if (this.currentStepIndex > 0) {
        // retry with position at index 0
        this.reset();
        this.handleEvent(eventName, eventPayload);
      }
      return;
    }
    if (this.eventPayload && step.callback) {
      step.callback(this.eventPayload);
    }
    this.currentStepIndex++;
    if (this.currentStepIndex === this.states.length) {
      this.reset();
    }
  }
}
export { PressableStateMachine };
//# sourceMappingURL=StateMachine.js.map