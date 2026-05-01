"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _State = require("../../State");
var _GestureHandler = _interopRequireDefault(require("./GestureHandler"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const DEFAULT_MIN_DURATION_MS = 500;
const DEFAULT_MAX_DIST_DP = 10;
const SCALING_FACTOR = 10;
class LongPressGestureHandler extends _GestureHandler.default {
  minDurationMs = DEFAULT_MIN_DURATION_MS;
  defaultMaxDistSq = DEFAULT_MAX_DIST_DP * SCALING_FACTOR;
  maxDistSq = this.defaultMaxDistSq;
  numberOfPointers = 1;
  startX = 0;
  startY = 0;
  startTime = 0;
  previousTime = 0;
  init(ref, propsRef) {
    if (this.config.enableContextMenu === undefined) {
      this.config.enableContextMenu = false;
    }
    super.init(ref, propsRef);
  }
  transformNativeEvent() {
    return {
      ...super.transformNativeEvent(),
      duration: Date.now() - this.startTime
    };
  }
  updateGestureConfig({
    enabled = true,
    ...props
  }) {
    super.updateGestureConfig({
      enabled: enabled,
      ...props
    });
    if (this.config.minDurationMs !== undefined) {
      this.minDurationMs = this.config.minDurationMs;
    }
    if (this.config.maxDist !== undefined) {
      this.maxDistSq = this.config.maxDist * this.config.maxDist;
    }
    if (this.config.numberOfPointers !== undefined) {
      this.numberOfPointers = this.config.numberOfPointers;
    }
  }
  resetConfig() {
    super.resetConfig();
    this.minDurationMs = DEFAULT_MIN_DURATION_MS;
    this.maxDistSq = this.defaultMaxDistSq;
  }
  onStateChange(_newState, _oldState) {
    clearTimeout(this.activationTimeout);
  }
  onPointerDown(event) {
    if (!this.isButtonInConfig(event.button)) {
      return;
    }
    this.tracker.addToTracker(event);
    super.onPointerDown(event);
    this.startX = event.x;
    this.startY = event.y;
    this.tryBegin();
    this.tryActivate();
    this.tryToSendTouchEvent(event);
  }
  onPointerAdd(event) {
    super.onPointerAdd(event);
    this.tracker.addToTracker(event);
    if (this.tracker.trackedPointersCount > this.numberOfPointers) {
      this.fail();
      return;
    }
    const absoluteCoordsAverage = this.tracker.getAbsoluteCoordsAverage();
    this.startX = absoluteCoordsAverage.x;
    this.startY = absoluteCoordsAverage.y;
    this.tryActivate();
  }
  onPointerMove(event) {
    super.onPointerMove(event);
    this.tracker.track(event);
    this.checkDistanceFail();
  }
  onPointerOutOfBounds(event) {
    super.onPointerOutOfBounds(event);
    this.tracker.track(event);
    this.checkDistanceFail();
  }
  onPointerUp(event) {
    super.onPointerUp(event);
    this.tracker.removeFromTracker(event.pointerId);
    if (this.state === _State.State.ACTIVE) {
      this.end();
    } else {
      this.fail();
    }
  }
  onPointerRemove(event) {
    super.onPointerRemove(event);
    this.tracker.removeFromTracker(event.pointerId);
    if (this.tracker.trackedPointersCount < this.numberOfPointers && this.state !== _State.State.ACTIVE) {
      this.fail();
    }
  }
  tryBegin() {
    if (this.state !== _State.State.UNDETERMINED) {
      return;
    }
    this.previousTime = Date.now();
    this.startTime = this.previousTime;
    this.begin();
  }
  tryActivate() {
    if (this.tracker.trackedPointersCount !== this.numberOfPointers) {
      return;
    }
    if (this.minDurationMs > 0) {
      this.activationTimeout = setTimeout(() => {
        this.activate();
      }, this.minDurationMs);
    } else if (this.minDurationMs === 0) {
      this.activate();
    }
  }
  checkDistanceFail() {
    const absoluteCoordsAverage = this.tracker.getAbsoluteCoordsAverage();
    const dx = absoluteCoordsAverage.x - this.startX;
    const dy = absoluteCoordsAverage.y - this.startY;
    const distSq = dx * dx + dy * dy;
    if (distSq <= this.maxDistSq) {
      return;
    }
    if (this.state === _State.State.ACTIVE) {
      this.cancel();
    } else {
      this.fail();
    }
  }
}
exports.default = LongPressGestureHandler;
//# sourceMappingURL=LongPressGestureHandler.js.map