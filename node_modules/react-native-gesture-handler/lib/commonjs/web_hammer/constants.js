"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MULTI_FINGER_PAN_MAX_ROTATION_THRESHOLD = exports.MULTI_FINGER_PAN_MAX_PINCH_THRESHOLD = exports.HammerInputNames = exports.HammerDirectionNames = exports.EventMap = exports.DirectionMap = exports.Direction = exports.DEG_RAD = exports.CONTENT_TOUCHES_QUICK_TAP_END_DELAY = exports.CONTENT_TOUCHES_DELAY = void 0;
var _hammerjs = _interopRequireDefault(require("@egjs/hammerjs"));
var _State = require("../State");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const CONTENT_TOUCHES_DELAY = exports.CONTENT_TOUCHES_DELAY = 240;
const CONTENT_TOUCHES_QUICK_TAP_END_DELAY = exports.CONTENT_TOUCHES_QUICK_TAP_END_DELAY = 50;
const MULTI_FINGER_PAN_MAX_PINCH_THRESHOLD = exports.MULTI_FINGER_PAN_MAX_PINCH_THRESHOLD = 0.1;
const MULTI_FINGER_PAN_MAX_ROTATION_THRESHOLD = exports.MULTI_FINGER_PAN_MAX_ROTATION_THRESHOLD = 7;
const DEG_RAD = exports.DEG_RAD = Math.PI / 180;

// Map Hammer values to RNGH
const EventMap = exports.EventMap = {
  [_hammerjs.default.INPUT_START]: _State.State.BEGAN,
  [_hammerjs.default.INPUT_MOVE]: _State.State.ACTIVE,
  [_hammerjs.default.INPUT_END]: _State.State.END,
  [_hammerjs.default.INPUT_CANCEL]: _State.State.FAILED
};
const Direction = exports.Direction = {
  RIGHT: 1,
  LEFT: 2,
  UP: 4,
  DOWN: 8
};
const DirectionMap = exports.DirectionMap = {
  [_hammerjs.default.DIRECTION_RIGHT]: Direction.RIGHT,
  [_hammerjs.default.DIRECTION_LEFT]: Direction.LEFT,
  [_hammerjs.default.DIRECTION_UP]: Direction.UP,
  [_hammerjs.default.DIRECTION_DOWN]: Direction.DOWN
};
const HammerInputNames = exports.HammerInputNames = {
  [_hammerjs.default.INPUT_START]: 'START',
  [_hammerjs.default.INPUT_MOVE]: 'MOVE',
  [_hammerjs.default.INPUT_END]: 'END',
  [_hammerjs.default.INPUT_CANCEL]: 'CANCEL'
};
const HammerDirectionNames = exports.HammerDirectionNames = {
  [_hammerjs.default.DIRECTION_HORIZONTAL]: 'HORIZONTAL',
  [_hammerjs.default.DIRECTION_UP]: 'UP',
  [_hammerjs.default.DIRECTION_DOWN]: 'DOWN',
  [_hammerjs.default.DIRECTION_VERTICAL]: 'VERTICAL',
  [_hammerjs.default.DIRECTION_NONE]: 'NONE',
  [_hammerjs.default.DIRECTION_ALL]: 'ALL',
  [_hammerjs.default.DIRECTION_RIGHT]: 'RIGHT',
  [_hammerjs.default.DIRECTION_LEFT]: 'LEFT'
};
//# sourceMappingURL=constants.js.map